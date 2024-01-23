import { AppDataSource } from '../database/database';
import { CpaTracker } from '../entity/CpaTracker';
import { User } from '../entity/User';
import { RewardStatus } from '../entity/User';

async function initDatabase() {
    try {
        await AppDataSource.initialize();
        const userRepo = AppDataSource.getRepository(User);

        // Create an array of Promises for user creation
        const userPromises = Array.from({ length: 100 }, async () => {
            const user = new User();
            user.free_share_status = RewardStatus.Eligible;
            return userRepo.save(user);
        });

        // Execute all user creation Promises concurrently
        await Promise.all(userPromises);

        // Initialize CPA Tracker with default values
        const cpaRepo = AppDataSource.getRepository(CpaTracker);
        const cpaData = new CpaTracker();
        cpaData.totalSpent = 0;
        cpaData.sharesGiven = 0;
        await cpaRepo.save(cpaData);
        console.log('Database initialization done.');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

initDatabase();
