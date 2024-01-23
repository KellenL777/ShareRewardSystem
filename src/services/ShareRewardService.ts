import { Repository } from 'typeorm';
import { AppDataSource } from '../database/database';
import { User, RewardStatus } from '../entity/User';
import { BrokerAPI } from './BrokerAPI'; // Mocked Broker API
import { CpaTracker } from '../entity/CpaTracker';
import { TradableAsset, Stock, DistributionLevel, DistributionRange } from '../types/types';


export class ShareRewardService {
    async claimFreeShare(userId: number): Promise<{ selectedStock: Stock }> {
        const userRepo = AppDataSource.getRepository(User);
        const user = await userRepo.findOneBy({ id: userId});

        if (!user) {
            throw new Error('User not found');
        }

        if (user.free_share_status !== RewardStatus.Eligible) {
            throw new Error('User not eligible for free share');
        }

        const marketStatus = await BrokerAPI.isMarketOpen();
        if (!marketStatus.open) {
            throw new Error('Market is closed, please retry after ${marketStatus.nextOpeningTime} tomorrow');
        }

        const selectedStock = await this.selectRandomStock();

        // Start the asynchronous order placement and user update process
        this.processOrderAsync(userId, selectedStock, userRepo, user);

        return { selectedStock };
    }

    private async processOrderAsync(userId: number, selectedStock: Stock, userRepo: Repository<User>, user: User): Promise<void>  {
        try {
            await BrokerAPI.placeBuyOrderUsingEmmaFunds(userId.toString(), selectedStock.tickerSymbol, 1);
            user.free_share_status = RewardStatus.Claimed;
            await userRepo.save(user);

            // Update CPA data
            console.log(selectedStock)
            const cpaRepo = AppDataSource.getRepository(CpaTracker);
            const cpaData = await cpaRepo.findOneBy({ id: 1 }) || new CpaTracker();
            cpaData.totalSpent += selectedStock.price; // Assume selectedStock includes a price attribute
            cpaData.sharesGiven += 1;
            await cpaRepo.save(cpaData);
        } catch (error) {
            console.error(`Error placing order for user ${userId}:`, error);
            // TODO: Implement retry mechanism here (retry up to 5 times in a real application)
            // Consider logging the failure for manual intervention if retries also fail
        }
    }

    public async selectRandomStock() : Promise<Stock> {
        const minShareValue = parseInt(process.env.MIN_SHARE_VALUE || '3');
        const maxShareValue = parseInt(process.env.MAX_SHARE_VALUE || '200');

        // Fetch all tradable assets
        const tradableAssets = await BrokerAPI.listTradableAssets();

        // Filter assets based on the price range
        const filteredAssets = await this.filterAssetsByPrice(tradableAssets, minShareValue, maxShareValue);

        // Apply distribution to select an asset
        const selectedAsset = await this.applyDistributionToSelectAsset(filteredAssets);

        const priceData = await BrokerAPI.getLatestPrice(selectedAsset.tickerSymbol);
        return { tickerSymbol: selectedAsset.tickerSymbol, price: priceData.sharePrice };

    }

    private async filterAssetsByPrice(assets: TradableAsset[], min: number, max: number) : Promise<TradableAsset[]> {
        const priceChecks = assets.map(async (asset) => {
            const price = await BrokerAPI.getLatestPrice(asset.tickerSymbol);
            return price.sharePrice >= min && price.sharePrice <= max ? asset : null;
        });
        const results = await Promise.all(priceChecks);
        return results.filter((asset): asset is { tickerSymbol: string } => asset !== null);
    }
    
    private async applyDistributionToSelectAsset(assets: TradableAsset[]): Promise<TradableAsset> {
        const cpaRepo = AppDataSource.getRepository(CpaTracker);
        const cpaData = await cpaRepo.findOneBy({ id: 1 }) || new CpaTracker();

        const targetCpa = parseFloat(process.env.TARGET_CPA || '10');
        const currentCpa = cpaData.sharesGiven > 0 ? cpaData.totalSpent / cpaData.sharesGiven : targetCpa;

        const adjustmentFactor = this.calculateCpaAdjustmentFactor(currentCpa, targetCpa);
        const distributionRanges = this.getAdjustedDistribution(adjustmentFactor);

        const selectedRange = this.selectRangeBasedOnDistribution(distributionRanges);
        const eligibleAssetChecks = assets.map(async (asset) => {
            const price = await BrokerAPI.getLatestPrice(asset.tickerSymbol);
            return (price.sharePrice >= selectedRange.min && price.sharePrice <= selectedRange.max) ? asset : null;
        });

        const eligibleAssets = (await Promise.all(eligibleAssetChecks)).filter((asset): asset is { tickerSymbol: string } => asset !== null);

        if (eligibleAssets.length === 0) {
            throw new Error("No eligible assets found in the selected range.");
        }

        // Select a random asset from the eligible assets
        const randomIndex = Math.floor(Math.random() * eligibleAssets.length);
        return eligibleAssets[randomIndex];
    }

    private calculateCpaAdjustmentFactor(currentCpa: number, targetCpa: number): number {
        // Implement logic to calculate an adjustment factor based on the CPA difference
        return (currentCpa - targetCpa) / targetCpa;
    }
 
    public getAdjustedDistribution(adjustmentFactor: number): DistributionLevel {
        // Adjust the distribution chances based on the adjustment factor
        const baseLowChance = parseFloat(process.env.DISTRIBUTION_LOW || '0.95');
        const baseMidChance = parseFloat(process.env.DISTRIBUTION_MID || '0.03');
        const baseHighChance = parseFloat(process.env.DISTRIBUTION_HIGH || '0.02');
        let adjustmentDelta = adjustmentFactor * (baseMidChance + baseHighChance);

        // Apply max adjustment limit
        adjustmentDelta = Math.max(Math.min(adjustmentDelta, 0.01), -0.01);
        return {
            low: {
                chance: baseLowChance + adjustmentDelta,
                min: parseFloat(process.env.PRICE_RANGE_LOW_MIN || '3'),
                max: parseFloat(process.env.PRICE_RANGE_LOW_MAX || '10')
            },
            mid: {
                chance: baseMidChance - adjustmentDelta / 2,
                min: parseFloat(process.env.PRICE_RANGE_MID_MIN || '10'),
                max: parseFloat(process.env.PRICE_RANGE_MID_MAX || '25')
            },
            high: {
                chance: baseHighChance - adjustmentDelta / 2,
                min: parseFloat(process.env.PRICE_RANGE_HIGH_MIN || '25'),
                max: parseFloat(process.env.PRICE_RANGE_HIGH_MAX || '200')
            }
        };
    }

    private selectRangeBasedOnDistribution(distributionLevel: DistributionLevel): DistributionRange {
        const rand = Math.random();
        let cumulative = 0;
        for (const distRange of Object.values(distributionLevel)) {
            cumulative += distRange.chance;
            if (rand <= cumulative) {
                return distRange;
            }
        }
        // Fallback to the low range
        return distributionLevel.low;
    }
}
