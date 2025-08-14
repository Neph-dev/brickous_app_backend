import express, { NextFunction, Request, Response } from 'express';
import { requireDeveloperAccount } from '../../../middlewares';
import { DeveloperController } from '../controllers';

const developerRouter = express.Router();
const developerController = new DeveloperController();

developerRouter.post('/create-developer', requireDeveloperAccount, async (req: Request, res: Response, next: NextFunction) => {
    try {
        await developerController.createDeveloper(req, res);
    } catch (error) {
        next(error);
    }
});

developerRouter.get('/developer', requireDeveloperAccount, async (req: Request, res: Response, next: NextFunction) => {
    try {
        await developerController.getDeveloperByUserId(req, res);
    } catch (error) {
        next(error);
    }
});

export default developerRouter;