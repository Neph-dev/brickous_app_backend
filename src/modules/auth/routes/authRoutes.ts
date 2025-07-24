import express, { NextFunction, Request, Response } from 'express';
import { signupController, verifySignupController } from '../controllers/signupController';
import { hashPasswordMiddleware } from '../../../middlewares';

const authRouter = express.Router();

authRouter.post('/signup', hashPasswordMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        await signupController(req, res);
    } catch (error) {
        next(error);
    }
});

authRouter.post('/signup/verify', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await verifySignupController(req, res);
    } catch (error) {
        next(error);
    }
});


export default authRouter;