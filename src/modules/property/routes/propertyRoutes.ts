import express, { NextFunction, Request, Response } from 'express';
import { requireDeveloperAccount } from '../../../middlewares';
import { PropertyController } from '../controllers';
import { upload } from '../../../shared/utils/uploadToS3Bucket';

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

propertyRouter.post('/add-financials', requireDeveloperAccount, async (req: Request, res: Response, next: NextFunction) => {
    try {
        await propertyController.addFinancials(req, res);
    } catch (error) {
        next(error);
    }
});

propertyRouter.post('/adjust-financials', requireDeveloperAccount, async (req: Request, res: Response, next: NextFunction) => {
    try {
        await propertyController.adjustFinancials(req, res);
    } catch (error) {
        next(error);
    }
});

propertyRouter.post(
    '/upload-images/:propertyId',
    upload.fields([
        { name: 'images', maxCount: 20 },
        { name: 'thumbnail', maxCount: 1 }
    ]),
    requireDeveloperAccount,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await propertyController.uploadImages(req, res);
        } catch (error) {
            next(error);
        }
    });

export default propertyRouter;