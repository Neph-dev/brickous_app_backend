import { Request, Response } from 'express';

import { ErrorResponse } from '../../../constants';
import { AppError, convertMulterFileToS3FileInfo, errorHandler, logger, uploadPropertyImages } from '../../../shared/utils';
import { validatePropertyDetails, validatePropertyFields } from '../utils';
import { MongoosePropertyRepo, MongoosePropertyDetailsRepo } from '../infra';
import { MongooseDeveloperRepo } from '../../developer/infra';

const { UNAUTHORIZED } = ErrorResponse;

export class PropertyController {
    private propertyRepo: MongoosePropertyRepo;
    private detailsRepo: MongoosePropertyDetailsRepo;
    private developerRepo: MongooseDeveloperRepo;

    constructor() {
        this.propertyRepo = new MongoosePropertyRepo();
        this.detailsRepo = new MongoosePropertyDetailsRepo();
        this.developerRepo = new MongooseDeveloperRepo();
    }

    async createProperty(req: Request, res: Response) {
        try {
            if (!req.user || !req.user.sub) {
                throw new AppError('User not authenticated', 'UNAUTHORIZED', 401);
            }
            const developer = await this.developerRepo.getDeveloperByUserId(req.user.sub);
            if (!developer) {
                throw new AppError(UNAUTHORIZED.message, UNAUTHORIZED.code, UNAUTHORIZED.statusCode);
            }

            const propertyData = {
                ...req.body,
                developer: developer._id
            };

            validatePropertyFields(propertyData);

            await this.propertyRepo.save(propertyData);

            res.status(201).json({
                status: 201,
                message: 'Property created successfully',
            });
        } catch (error: any) {
            return errorHandler(error, res);
        }
    };

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

    async uploadImages(req: Request, res: Response) {
        try {
        } catch (error: any) {
            logger.error('Error uploading property images', error);
            return errorHandler(error, res);
        }
    }
}
