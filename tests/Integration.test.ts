import request from 'supertest';
import express from 'express';
import { ShareRewardController } from '../src/controllers/ShareRewardController';
import { BrokerAPI } from '../src/services/BrokerAPI';
import { AppDataSource } from '../src/database/database';
import { User, RewardStatus } from '../src/entity/User';
import { CpaTracker } from '../src/entity/CpaTracker';

// Mocking external dependencies
jest.mock('../src/services/BrokerAPI');
jest.mock('../src/database/database');

// Setup Express app for testing
const app = express();
app.use(express.json());
app.post('/claim-free-share', ShareRewardController.claimFreeShare); 

describe('Integration Tests for ShareRewardService', () => {
    const mockUserRepo = {
        findOneBy: jest.fn(),
        save: jest.fn(),
    };
    const mockCpaRepo = {
        findOneBy: jest.fn(),
        save: jest.fn(),
    };

    beforeEach(() => {
        // Mock database repository methods
        (AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
            if (entity === User) return mockUserRepo;
            if (entity === CpaTracker) return mockCpaRepo;
        });

        // Mock BrokerAPI methods
        jest.spyOn(BrokerAPI, 'isMarketOpen').mockResolvedValue({ open: true, nextOpeningTime: "09:00:00", nextClosingTime: "17:00:00" });
        jest.spyOn(BrokerAPI, 'listTradableAssets').mockResolvedValue([{ tickerSymbol: 'AAPL' }]);
        jest.spyOn(BrokerAPI, 'getLatestPrice').mockResolvedValue({ sharePrice: 5 });
        jest.spyOn(BrokerAPI, 'placeBuyOrderUsingEmmaFunds').mockResolvedValue({ orderId: 'order123' });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should handle a request to claim a free share for an eligible user', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ id: 1, free_share_status: RewardStatus.Eligible });
        mockCpaRepo.findOneBy.mockResolvedValue({ id: 1, totalSpent: 100, sharesGiven: 10 });

        const response = await request(app)
            .post('/claim-free-share')
            .send({ userId: 1 });

        expect(response.status).toBe(200);
        expect(response.body.selectedStock).toBeDefined();
        expect(response.body.selectedStock.tickerSymbol).toBe('AAPL');
        expect(mockUserRepo.save).toHaveBeenCalledWith(expect.objectContaining({ free_share_status: RewardStatus.Claimed }));
        expect(mockCpaRepo.save).toHaveBeenCalled();
    });

});
