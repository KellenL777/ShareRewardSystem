import { ShareRewardService } from '../src/services/ShareRewardService'
import { BrokerAPI } from '../src/services/BrokerAPI';
import { AppDataSource } from '../src/database/database';
import { User, RewardStatus } from '../src/entity/User';
import { CpaTracker } from '../src/entity/CpaTracker';

jest.mock('../src/services/BrokerAPI');
jest.mock('../src/database/database');


describe('ShareRewardService', () => {
    let shareRewardService: ShareRewardService;
    const mockUserRepo = {
      findOneBy: jest.fn(),
      save: jest.fn(),
    };
    const mockCpaRepo = {
      findOneBy: jest.fn(),
      save: jest.fn(),
    };
    beforeEach(() => {
        shareRewardService = new ShareRewardService();
        (AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
            if (entity === User) return mockUserRepo;
            if (entity === CpaTracker) return mockCpaRepo;
        });
        // Mock BrokerAPI methods
        jest.spyOn(BrokerAPI, 'isMarketOpen').mockResolvedValue({ open: true, nextOpeningTime: "09:00:00", nextClosingTime: "17:00:00" });
        jest.spyOn(BrokerAPI, 'listTradableAssets').mockResolvedValue([
            { tickerSymbol: 'AAPL' },
            { tickerSymbol: 'MSFT' },
            { tickerSymbol: 'TSLA' },
            { tickerSymbol: 'AMZN' },
        ]);        
        jest.spyOn(BrokerAPI, 'getLatestPrice').mockImplementation((tickerSymbol: string) => {
            const prices: { [key: string]: number } = {
                'AAPL': 5,  // Low-priced stock
                'MSFT': 15, // Mid-priced stock
                'TSLA': 25, // High-priced stock
                'AMZN': 50, // High-priced stock
                // Add more prices as needed
            };
            return Promise.resolve({ sharePrice: prices[tickerSymbol] });
        });        
        jest.spyOn(BrokerAPI, 'placeBuyOrderUsingEmmaFunds').mockResolvedValue({ orderId: 'order123' });
    });

    afterEach(() => {
        // Clear all mock implementations after each test
        jest.clearAllMocks();
    });

    describe('User Eligibility Tests', () => {
        it('should throw an error if user is not found', async () => {
            mockUserRepo.findOneBy.mockResolvedValue(null);
            await expect(shareRewardService.claimFreeShare(1)).rejects.toThrow('User not found');
        });

        it('should throw an error if user is not eligible', async () => {
            mockUserRepo.findOneBy.mockResolvedValue({ id: 1, free_share_status: RewardStatus.Ineligible });
            await expect(shareRewardService.claimFreeShare(1)).rejects.toThrow('User not eligible for free share');
        });
    });


    describe('Market Status Check in ShareRewardService', () => {
        it('should throw an error when the market is closed', async () => {
            jest.spyOn(BrokerAPI, 'isMarketOpen').mockResolvedValue({ open: false, nextOpeningTime: "09:00:00", nextClosingTime: "17:00:00" });
            mockUserRepo.findOneBy.mockResolvedValue({ id: 1, free_share_status: RewardStatus.Eligible });
    
            await expect(shareRewardService.claimFreeShare(1)).rejects.toThrow('Market is closed');
        });
    });

    describe('Claim Share Tests', () => {
        it('should successfully claim a share for an eligible user', (done) => {
            mockUserRepo.findOneBy.mockResolvedValue({ id: 1, free_share_status: RewardStatus.Eligible });
            mockCpaRepo.findOneBy.mockResolvedValue({ id: 1, totalSpent: 100, sharesGiven: 10 });
        
            shareRewardService.claimFreeShare(1).then((result) => {
            expect(result.selectedStock).toBeDefined();
        
            // Wait for all promises to resolve
            setImmediate(() => {
                try {
                expect(mockUserRepo.save).toHaveBeenCalledWith(expect.objectContaining({ free_share_status: RewardStatus.Claimed }));
                expect(mockCpaRepo.save).toHaveBeenCalled();
                done();
                } catch (error) {
                done(error);
                }
            });
            });
        });  
    })

    describe('CPA Adjustment Calculation', () => {
        it('should calculate the correct adjustment factor', () => {
            const service = new ShareRewardService();
            const currentCpa = 120; // Example current CPA
            const targetCpa = 100; // Example target CPA
            const expectedAdjustmentFactor = (currentCpa - targetCpa) / targetCpa;
            const adjustmentFactor = service['calculateCpaAdjustmentFactor'](currentCpa, targetCpa);
            expect(adjustmentFactor).toBe(expectedAdjustmentFactor);
        });
    
        // Additional tests for different CPA scenarios
    });

    describe('getAdjustedDistribution', () => {
        it('should adjust distribution chances based on adjustment factor', () => {
            const adjustmentFactor = 0.2; // Example adjustment factor
            const adjustedDistribution = shareRewardService.getAdjustedDistribution(adjustmentFactor);
    
            // Check if distribution chances are adjusted as expected
            expect(adjustedDistribution.low.chance).toBeGreaterThan(0.95); // Expecting an increase in low chance
            expect(adjustedDistribution.mid.chance).toBeLessThan(0.03); // Expecting a decrease in mid chance
            expect(adjustedDistribution.high.chance).toBeLessThan(0.02); // Expecting a decrease in high chance
        });
    });

    describe('selectRandomStock', () => {
        it('should statistically align with adjusted distribution over multiple iterations', async () => {
            const iterations = 1000;
            let lowCount = 0, midCount = 0, highCount = 0;
    
            for (let i = 0; i < iterations; i++) {
                const stock = await shareRewardService.selectRandomStock();
                if (stock.price <= 10) lowCount++;
                else if (stock.price <= 25) midCount++;
                else highCount++;
            }
    
            // Check if the counts align with the expected distribution
            expect(lowCount / iterations).toBeCloseTo(0.95, 1); // Expecting about 95% low value stocks
            // Similar checks for mid and high counts
        });
    });
    
    


 

})