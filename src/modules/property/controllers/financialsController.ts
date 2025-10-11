import { Request, Response } from 'express';

import { errorHandler, logger } from '../../../shared/utils';
import { validateFinancialsFields } from '../utils';
import { MongoosePropertyRepo, MongooseFinancialsRepo } from '../infra';
import { PropertyStatus } from '../../../shared/types';

export class FinancialsController {
    private propertyRepo: MongoosePropertyRepo;
    private financialsRepo: MongooseFinancialsRepo;

    constructor() {
        this.propertyRepo = new MongoosePropertyRepo();
        this.financialsRepo = new MongooseFinancialsRepo();
    }

    async addFinancials(req: Request, res: Response) {
        try {
            const { propertyId, financials } = req.body;

            validateFinancialsFields({ ...financials, propertyId });

            await this.financialsRepo.save(financials, propertyId);
            return res.status(201).json({
                status: 201,
                message: 'Property financials added successfully',
            });
        } catch (error: any) {
            logger.error('Error adding property financials', error);
            return errorHandler(error, res);
        }
    }

    async adjustFinancials(req: Request, res: Response) {
        try {
            const { propertyId, financials } = req.body;

            const propertyDoc = await this.propertyRepo.findById(propertyId);

            if (!propertyDoc) {
                return res.status(404).json({
                    status: 404,
                    message: 'Property not found',
                    code: 'PROPERTY_NOT_FOUND'
                });
            }

            if (propertyDoc.status === PropertyStatus.Deployed || propertyDoc.status === PropertyStatus.Archived) {
                return res.status(400).json({
                    status: 400,
                    message: 'Cannot adjust financials of a published property',
                    code: 'CANNOT_ADJUST_PUBLISHED_PROPERTY'
                });
            }

            // validateFinancialsFields({ ...financials, propertyId });

            await this.financialsRepo.update(propertyId, financials);

            return res.status(200).json({
                status: 200,
                message: 'Property financials updated successfully',
            });
        } catch (error: any) {
            logger.error('Error adjusting property financials', error);
            return errorHandler(error, res);
        }
    }
}
