import { Request, Response } from 'express';

import { ErrorResponse } from '../../../constants';
import { AppError, errorHandler, logger } from '../../../shared/utils';
import { validatePropertyDetails, validatePropertyFields, validateFinancialsFields } from '../utils';
import { MongoosePropertyRepo, MongoosePropertyDetailsRepo, MongooseFinancialsRepo } from '../infra';
import { MongooseDeveloperRepo } from '../../developer/infra';
import { PropertyStatus } from '../../../shared/types';
import { MongooseImageRepo } from '../infra/ImageRepo';

const { UNAUTHORIZED } = ErrorResponse;

const AWS_S3_BUCKET_IMAGES_BASE_URL = process.env.AWS_S3_BUCKET_IMAGES_BASE_URL || '';

export class PropertyController {
    private propertyRepo: MongoosePropertyRepo;
    private detailsRepo: MongoosePropertyDetailsRepo;
    private developerRepo: MongooseDeveloperRepo;
    private financialsRepo: MongooseFinancialsRepo;
    private imageRepo: MongooseImageRepo;

    constructor() {
        this.propertyRepo = new MongoosePropertyRepo();
        this.detailsRepo = new MongoosePropertyDetailsRepo();
        this.developerRepo = new MongooseDeveloperRepo();
        this.financialsRepo = new MongooseFinancialsRepo();
        this.imageRepo = new MongooseImageRepo();
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

    async uploadImages(req: any, res: Response) {
        try {
            const { propertyId } = req.params;

            if (!propertyId) {
                return res.status(400).json({
                    status: 400,
                    message: 'propertyId is required',
                    code: 'MISSING_PROPERTY_ID'
                });
            }

            const propertyDoc = await this.propertyRepo.findById(propertyId);
            if (!propertyDoc) {
                return res.status(404).json({
                    status: 404,
                    message: 'Property not found',
                    code: 'PROPERTY_NOT_FOUND'
                });
            }

            if (
                propertyDoc.status === PropertyStatus.Deployed ||
                propertyDoc.status === PropertyStatus.Archived
            ) {
                return res.status(400).json({
                    status: 400,
                    message: 'Cannot upload images to a published or archived property',
                    code: 'CANNOT_UPLOAD_TO_PUBLISHED_PROPERTY'
                });
            }

            let allFiles: any[] = [];
            let thumbnailFile: any = null;

            if (req.files) {
                if (Array.isArray(req.files)) {
                    allFiles = req.files;
                } else {
                    const filesObj = req.files as { [fieldname: string]: Express.Multer.File[]; };
                    allFiles = filesObj.images || [];
                    thumbnailFile = filesObj.thumbnail?.[0] || null;
                }
            }

            if (allFiles.length === 0) {
                return res.status(400).json({
                    status: 400,
                    message: 'No images provided for upload',
                    code: 'NO_IMAGES_PROVIDED'
                });
            }

            const filesKeys = allFiles.map(file => `${AWS_S3_BUCKET_IMAGES_BASE_URL}/${file.key}`);
            const thumbnailUrl = thumbnailFile ? `${AWS_S3_BUCKET_IMAGES_BASE_URL}/${thumbnailFile.key}` : undefined;

            try {
                await this.imageRepo.save(propertyId, filesKeys, thumbnailUrl);
            } catch (persistErr) {
                logger.warn('Could not persist image references to property', {
                    propertyId,
                    error: (persistErr as Error).message
                });
                return errorHandler(persistErr, res);
            }

            return res.status(200).json({
                status: 200,
                message: 'Images uploaded successfully',
            });
        } catch (error: any) {
            logger.error('Error uploading property images', { error: error?.message });
            return errorHandler(error, res);
        }
    }

    async getImages(req: Request, res: Response) {
        try {
            const { propertyId } = req.params;

            if (!propertyId) {
                return res.status(400).json({
                    status: 400,
                    message: 'propertyId is required',
                    code: 'MISSING_PROPERTY_ID'
                });
            }

            const images = await this.imageRepo.get(propertyId);

            return res.status(200).json({
                status: 200,
                message: 'Images retrieved successfully',
                data: images
            });
        } catch (error: any) {
            logger.error('Error retrieving property images', { error: error?.message });
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
