import redis from '../database/redisConfig'
import { TradableAsset, PriceData, MarketStatus, AccountPosition, Order, OrderDetails } from '../types/types';

export class BrokerAPI {
    static async listTradableAssets(): Promise<TradableAsset[]> {
        const cacheKey = 'tradable_assets';
        // Check if cache exists
        const cachedData = await redis.get(cacheKey);
        if (cachedData !== null) {
            return JSON.parse(cachedData);
        }
        // Returns a list of tradable assets
        const assets = [{ tickerSymbol: 'AAPL' }, { tickerSymbol: 'MSFT' }, { tickerSymbol: 'TSLA' }, { tickerSymbol: 'GOOG' }, { tickerSymbol: 'SIRI' }, { tickerSymbol: 'WBD' }, { tickerSymbol: 'SPLK' }, { tickerSymbol: 'KHC' }, { tickerSymbol: 'TMUS' }, { tickerSymbol: 'MDLZ' }];
        await redis.set(cacheKey, JSON.stringify(assets), 'EX', 86400); // Cache for 24 hours
        return assets;

    }

    static async getLatestPrice(tickerSymbol: string): Promise<PriceData> {
        const cacheKey = `price_${tickerSymbol}`;
        // Check if price is in cache
        const cachedPrice = await redis.get(cacheKey);
        if (cachedPrice !== null) {
            return { sharePrice: JSON.parse(cachedPrice) };
        }
        const prices: { [key: string]: number } = { 'AAPL': 7, 'MSFT': 4, 'TSLA': 8, 'GOOG': 147, 'SIRI': 5, 'WBD': 9, 'SPLK': 14, 'KHC': 6, 'TMUS': 3, 'MDLZ': 8};
        const price = prices[tickerSymbol];
        if (price !== undefined) {
            await redis.set(cacheKey, JSON.stringify(price), 'EX', 900); // Cache for 15 minutes
            return { sharePrice: price };
        } else {
            throw new Error(`Price for ticker symbol "${tickerSymbol}" not found.`);
        }
    }
    
    static async isMarketOpen(): Promise<MarketStatus>  {
        // Mock implementation: Simulates market open/close status
        const now = new Date();
        const isOpen = now.getHours() >= 9 && now.getHours() <= 17; // Market open from 9 AM to 5 PM
        return { open: isOpen, nextOpeningTime: "09:00:00", nextClosingTime: "17:00:00" };
    }

    static async placeBuyOrderUsingEmmaFunds(accountId: string, tickerSymbol: string, quantity: number): Promise<Order>  {
        // Mock implementation: Simulates placing a buy order
        // Returns a mock order ID
        return { orderId: `order_${Math.random().toString(36).substring(2, 9)}` };
    }

    static async getAccountPositions(accountId: string): Promise<AccountPosition[]>  {
        // Mock implementation: Returns the shares purchased in the account
        // In a real scenario, this would fetch account positions from an external API
        return [{ tickerSymbol: 'AAPL', quantity: 1, sharePrice: 150 }];
    }

    static async getAllOrders(accountId: string): Promise<OrderDetails[]>  {
        // Mock implementation: Returns the status of each order
        return [{ id: 'order_1', tickerSymbol: 'AAPL', quantity: 1, side: 'buy', status: 'filled', filledPrice: 150 }];
    }
}
