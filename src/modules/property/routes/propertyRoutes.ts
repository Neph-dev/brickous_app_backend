import express, { NextFunction, Request, Response } from 'express';
import { requireDeveloperAccount } from '../../../middlewares';
import { PropertyController } from '../controllers';

const propertyRouter = express.Router();
const propertyController = new PropertyController();


propertyRouter.post('/create-property', requireDeveloperAccount, async (req: Request, res: Response, next: NextFunction) => {
    try {
        await propertyController.createProperty(req, res);
    } catch (error) {
        next(error);
    }
});

propertyRouter.post('/add-property-details', requireDeveloperAccount, async (req: Request, res: Response, next: NextFunction) => {
    try {
        await propertyController.addPropertyDetails(req, res);
    } catch (error) {
        next(error);
    }
});

export default propertyRouter;