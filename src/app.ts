import 'dotenv/config';
import express from 'express';
import { AppDataSource } from './database/database';
import { ShareRewardController } from './controllers/ShareRewardController';



const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;

AppDataSource.initialize().then(() => {
  app.post('/claim-free-share', ShareRewardController.claimFreeShare);

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}).catch(error => console.log(error));
