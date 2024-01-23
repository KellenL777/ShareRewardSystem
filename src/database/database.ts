import { DataSource } from 'typeorm';
import { User } from '../entity/User';
import { CpaTracker } from '../entity/CpaTracker';


export const AppDataSource = new DataSource({
    type: "sqlite",
    database: 'data/db.sqlite',
    synchronize: true,
    logging: true,
    entities: [User, CpaTracker],
})


