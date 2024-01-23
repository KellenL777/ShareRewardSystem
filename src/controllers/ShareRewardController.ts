import { Request, Response } from 'express';
import { ShareRewardService } from '../services/ShareRewardService';

export class ShareRewardController {
    static async claimFreeShare(req: Request, res: Response) {
        try {
            const userId = req.body.userId; // Assuming userID is sent in the request
            const shareService = new ShareRewardService();
            const shareData = await shareService.claimFreeShare(userId);
            res.json(shareData);
        } catch (error) {
            if (error instanceof Error) {
                res.status(500).json({ message: error.message });
            } else {
                res.status(500).json({ message: 'An unknown error occurred' });
            }
        }
    }
}
