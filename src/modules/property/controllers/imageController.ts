import { Request, Response } from 'express';

import { ErrorResponse } from '../../../constants';
import { errorHandler, logger } from '../../../shared/utils';
import { MongoosePropertyRepo } from '../infra';
import { PropertyStatus } from '../../../shared/types';
import { MongooseImageRepo } from '../infra/ImageRepo';

const { UNAUTHORIZED } = ErrorResponse;

const AWS_S3_BUCKET_IMAGES_BASE_URL = process.env.AWS_S3_BUCKET_IMAGES_BASE_URL || '';

export class ImageController {
    private propertyRepo: MongoosePropertyRepo;
    private imageRepo: MongooseImageRepo;

    constructor() {
        this.propertyRepo = new MongoosePropertyRepo();
        this.imageRepo = new MongooseImageRepo();
    }

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
}
