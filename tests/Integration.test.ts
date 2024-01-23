import request from 'supertest';
import express from 'express';
import { AppDataSource } from '../src/database/database';
import { ShareRewardController } from '../src/controllers/ShareRewardController';
import { User } from '../src/entity/User';
import { CpaTracker } from '../src/entity/CpaTracker';
import { RewardStatus } from '../src/entity/User';

describe('Integration Tests', () => {
  const app = express();
  app.use(express.json());
  app.post('/claim-free-share', ShareRewardController.claimFreeShare);

  beforeAll(async () => {
    await AppDataSource.initialize();
    // Set up any necessary data for testing
    const userRepo = AppDataSource.getRepository(User);
    await userRepo.save({ id: 1, free_share_status:  RewardStatus.Eligible});
    const cpaRepo = AppDataSource.getRepository(CpaTracker);
    await cpaRepo.save({ id: 1, totalSpent: 0, sharesGiven: 0 });
  });

  afterAll(async () => {
    // Wait for all pending operations to complete
    await new Promise(resolve => setImmediate(resolve));

    // Additional delay to ensure all operations are complete
    await new Promise(resolve => setTimeout(resolve, 5000));
    // Clean up database or close connections if necessary
    await AppDataSource.destroy();
  });

  it('should successfully claim a free share', async () => {
    const response = await request(app)
      .post('/claim-free-share')
      .send({ userId: 1 });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('selectedStock');
    // Additional assertions as needed
  });
});
