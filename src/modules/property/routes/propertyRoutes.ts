import express, { NextFunction, Request, Response } from 'express';
import { requireDeveloperAccount } from '../../../middlewares';
import { FinancialsController, ImageController, PropertyController } from '../controllers';
import { upload } from '../../../shared/utils/uploadToS3Bucket';
import { PropertyDetailsController } from '../controllers/propertyDetailsController';

const propertyRouter = express.Router();
const propertyController = new PropertyController();
const propertyDetailsController = new PropertyDetailsController();
const imageController = new ImageController();
const financialsController = new FinancialsController();


propertyRouter.post('/create-property', requireDeveloperAccount, async (req: Request, res: Response, next: NextFunction) => {
    try {
        await propertyController.createProperty(req, res);
    } catch (error) {
        next(error);
    }
});

propertyRouter.get(
    '/get-property/:propertyId',
    requireDeveloperAccount,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await propertyController.getProperty(req, res);
        } catch (error) {
            next(error);
        }
    }
);

propertyRouter.post('/add-property-details', requireDeveloperAccount, async (req: Request, res: Response, next: NextFunction) => {
    try {
        await propertyDetailsController.addPropertyDetails(req, res);
    } catch (error) {
        next(error);
    }
});

propertyRouter.post('/add-financials', requireDeveloperAccount, async (req: Request, res: Response, next: NextFunction) => {
    try {
        await financialsController.addFinancials(req, res);
    } catch (error) {
        next(error);
    }
});

propertyRouter.post('/adjust-financials', requireDeveloperAccount, async (req: Request, res: Response, next: NextFunction) => {
    try {
        await financialsController.adjustFinancials(req, res);
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
            await imageController.uploadImages(req, res);
        } catch (error) {
            next(error);
        }
    });

propertyRouter.get(
    '/get-images/:propertyId',
    requireDeveloperAccount,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await imageController.getImages(req, res);
        } catch (error) {
            next(error);
        }
    }
);

export default propertyRouter;