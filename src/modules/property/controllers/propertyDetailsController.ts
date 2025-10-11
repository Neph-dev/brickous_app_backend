import { Request, Response } from 'express';

import { errorHandler, logger } from '../../../shared/utils';
import { validatePropertyDetails } from '../utils';
import { MongoosePropertyDetailsRepo } from '../infra';

export class PropertyDetailsController {
    private detailsRepo: MongoosePropertyDetailsRepo;

    constructor() {
        this.detailsRepo = new MongoosePropertyDetailsRepo();
    }

    async addPropertyDetails(req: Request, res: Response) {
        try {
            const { propertyId, details } = req.body;

            validatePropertyDetails({ ...details, propertyId });

            await this.detailsRepo.save(details, propertyId);
            return res.status(201).json({
                status: 201,
                message: 'Property details added successfully',
            });
        } catch (error: any) {
            logger.error('Error adding property details', error);
            return errorHandler(error, res);
        }
    };
}
