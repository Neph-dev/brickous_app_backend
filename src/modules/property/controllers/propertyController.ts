import { Request, Response } from 'express';

import { ErrorResponse } from '../../../constants';
import { AppError, convertMulterFileToS3FileInfo, errorHandler, logger, uploadPropertyImages } from '../../../shared/utils';
import { validatePropertyDetails, validatePropertyFields, validateFinancialsFields } from '../utils';
import { MongoosePropertyRepo, MongoosePropertyDetailsRepo, MongooseFinancialsRepo } from '../infra';
import { MongooseDeveloperRepo } from '../../developer/infra';
import { PropertyStatus } from '../../../shared/types';

const { UNAUTHORIZED } = ErrorResponse;

export class PropertyController {
    private propertyRepo: MongoosePropertyRepo;
    private detailsRepo: MongoosePropertyDetailsRepo;
    private developerRepo: MongooseDeveloperRepo;
    private financialsRepo: MongooseFinancialsRepo;

    constructor() {
        this.propertyRepo = new MongoosePropertyRepo();
        this.detailsRepo = new MongoosePropertyDetailsRepo();
        this.developerRepo = new MongooseDeveloperRepo();
        this.financialsRepo = new MongooseFinancialsRepo();
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

            validateFinancialsFields({ ...financials, propertyId });

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
