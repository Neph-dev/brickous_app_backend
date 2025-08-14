import { Request, Response } from 'express';

import { ErrorResponse } from '../../../constants';
import { AppError, errorHandler } from '../../../shared/utils';
import { validatePropertyDetails, validatePropertyFields } from '../utils';
import { MongoosePropertyRepo, MongoosePropertyDetailsRepo } from '../infra';
import { MongooseDeveloperRepo } from '../../developer/infra';

const { GENERIC, UNAUTHORIZED } = ErrorResponse;

export class PropertyController {
    private propertyRepo: MongoosePropertyRepo;
    private detailsRepo: MongoosePropertyDetailsRepo;
    private developerRepo: MongooseDeveloperRepo;

    constructor() {
        this.propertyRepo = new MongoosePropertyRepo();
        this.detailsRepo = new MongoosePropertyDetailsRepo();
        this.developerRepo = new MongooseDeveloperRepo();
    }

    createProperty = async (req: Request, res: Response) => {
        try {
            if (!req.user || !req.user.sub) {
                throw new AppError('User not authenticated', 'UNAUTHORIZED', 401);
            }
            const developer = await this.developerRepo.getDeveloperByUserId(req.user.sub);
            if (!developer) {
                throw new AppError(UNAUTHORIZED.message, UNAUTHORIZED.code, UNAUTHORIZED.statusCode);
            }

            req.body.developer = developer._id;
            validatePropertyFields(req.body);

            if (!developer) {
                return res.status(404).json({
                    status: 404,
                    message: 'Developer not found',
                });
            }

            await this.propertyRepo.save(req.body);

            res.status(201).json({
                status: 201,
                message: 'Property created successfully',
            });
        } catch (error: any) {
            return errorHandler(error, res);
        }
    };

    addPropertyDetails = async (req: Request, res: Response) => {
        try {
            const { propertyId, details } = req.body;

            validatePropertyDetails({ ...details, propertyId });

            await this.detailsRepo.save(details, propertyId);
            return res.status(201).json({
                status: 201,
                message: 'Property details added successfully',
            });
        } catch (error: any) {
            console.log('Error adding property details:', error?.code);
            return errorHandler(error, res);
        }
    };
}
