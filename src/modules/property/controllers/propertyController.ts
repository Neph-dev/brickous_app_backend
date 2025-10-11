import { Request, Response } from 'express';

import { ErrorResponse } from '../../../constants';
import { AppError, errorHandler, logger } from '../../../shared/utils';
import { validatePropertyFields } from '../utils';
import { MongoosePropertyRepo, MongoosePropertyDetailsRepo, MongooseFinancialsRepo } from '../infra';
import { MongooseDeveloperRepo } from '../../developer/infra';
import { MongooseImageRepo } from '../infra/ImageRepo';

const { UNAUTHORIZED } = ErrorResponse;

const AWS_S3_BUCKET_IMAGES_BASE_URL = process.env.AWS_S3_BUCKET_IMAGES_BASE_URL || '';

export class PropertyController {
    private propertyRepo: MongoosePropertyRepo;
    private developerRepo: MongooseDeveloperRepo;

    constructor() {
        this.propertyRepo = new MongoosePropertyRepo();
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

    async getProperty(req: Request, res: Response) {
        try {
            const { propertyId } = req.params;

            if (!propertyId) {
                return res.status(400).json({
                    status: 400,
                    message: 'propertyId is required',
                    code: 'MISSING_PROPERTY_ID'
                });
            }

            const property = await this.propertyRepo.findById(propertyId);
            if (!property) {
                return res.status(404).json({
                    status: 404,
                    message: 'Property not found',
                    code: 'PROPERTY_NOT_FOUND'
                });
            }

            return res.status(200).json({
                status: 200,
                data: property
            });
        } catch (error: any) {
            logger.error('Error fetching property', { error: error?.message });
            return errorHandler(error, res);
        }
    }
}
