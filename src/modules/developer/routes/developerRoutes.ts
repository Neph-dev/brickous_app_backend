import express, { NextFunction, Request, Response } from 'express';
import { requireDeveloperAccount } from '../../../middlewares';
import { createDeveloper } from '../controllers';

const developerRouter = express.Router();

developerRouter.post('/create-developer', requireDeveloperAccount, async (req: Request, res: Response, next: NextFunction) => {
    try {
        await createDeveloper(req, res);
    } catch (error) {
        next(error);
    }
});


export default developerRouter;