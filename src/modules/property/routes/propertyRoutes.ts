import express, { NextFunction, Request, Response } from 'express';
import { requireDeveloper } from '../../../middlewares';
import { createProperty } from '../controllers';

const propertyRouter = express.Router();

propertyRouter.post('/create-property', requireDeveloper, async (req: Request, res: Response, next: NextFunction) => {
    try {
        await createProperty(req, res);
    } catch (error) {
        next(error);
    }
});


export default propertyRouter;