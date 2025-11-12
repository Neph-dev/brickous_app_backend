import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { errorHandler } from '../../../shared/utils';
import { PropertyDeploymentService } from '../services';
import { DeploymentScheduleStatus } from '../types';
import { MongooseDeploymentScheduleRepo } from '../infra';

export class DeploymentController {
    private deploymentService: PropertyDeploymentService;
    private deploymentRepo: MongooseDeploymentScheduleRepo;

    constructor() {
        this.deploymentService = new PropertyDeploymentService();
        this.deploymentRepo = new MongooseDeploymentScheduleRepo();
    }

    async scheduleDeployment(req: Request, res: Response) {
        try {
            const { propertyId, scheduledDate, deploymentData } = req.body;
            const userId: string = req.user?.sub || '';

            if (!propertyId) {
                return res.status(400).json({
                    status: 400,
                    message: 'Property ID is required',
                    code: 'MISSING_PROPERTY_ID'
                });
            }

            if (!scheduledDate) {
                return res.status(400).json({
                    status: 400,
                    message: 'Scheduled date is required',
                    code: 'MISSING_SCHEDULED_DATE'
                });
            }

            // Validate scheduled date is in the future
            const schedDate = new Date(scheduledDate);
            if (schedDate <= new Date()) {
                return res.status(400).json({
                    status: 400,
                    message: 'Scheduled date must be in the future',
                    code: 'INVALID_SCHEDULED_DATE'
                });
            }

            const deployment = await this.deploymentService.scheduleDeployment({
                propertyId: new ObjectId(propertyId),
                scheduledDate: schedDate,
                deploymentData: deploymentData || {},
                status: DeploymentScheduleStatus.Scheduled,
                scheduledBy: new ObjectId(userId)
            });

            return res.status(201).json({
                status: 201,
                message: 'Deployment scheduled successfully',
                data: deployment
            });
        } catch (error: any) {
            return errorHandler(error, res);
        }
    }

    async triggerDeployment(req: Request, res: Response) {
        try {
            const { deploymentId } = req.params;
            const userId: string = req.user?.sub || '';

            if (!deploymentId) {
                return res.status(400).json({
                    status: 400,
                    message: 'Deployment ID is required',
                    code: 'MISSING_DEPLOYMENT_ID'
                });
            }

            await this.deploymentService.deployProperty(deploymentId, userId);

            return res.status(200).json({
                status: 200,
                message: 'Deployment triggered successfully'
            });
        } catch (error: any) {
            return errorHandler(error, res);
        }
    }

    async getDeploymentSchedules(req: Request, res: Response) {
        try {
            const { propertyId } = req.query;

            let deployments;
            if (propertyId) {
                deployments = await this.deploymentRepo.findByPropertyId(propertyId as string);
            } else {
                deployments = await this.deploymentRepo.getAll();
            }

            return res.status(200).json({
                status: 200,
                message: 'Deployment schedules retrieved successfully',
                data: deployments
            });
        } catch (error: any) {
            return errorHandler(error, res);
        }
    }

    async getDeploymentSchedule(req: Request, res: Response) {
        try {
            const { deploymentId } = req.params;

            if (!deploymentId) {
                return res.status(400).json({
                    status: 400,
                    message: 'Deployment ID is required',
                    code: 'MISSING_DEPLOYMENT_ID'
                });
            }

            const deployment = await this.deploymentRepo.findById(deploymentId);

            if (!deployment) {
                return res.status(404).json({
                    status: 404,
                    message: 'Deployment schedule not found',
                    code: 'DEPLOYMENT_NOT_FOUND'
                });
            }

            return res.status(200).json({
                status: 200,
                message: 'Deployment schedule retrieved successfully',
                data: deployment
            });
        } catch (error: any) {
            return errorHandler(error, res);
        }
    }

    async cancelDeployment(req: Request, res: Response) {
        try {
            const { deploymentId } = req.params;

            if (!deploymentId) {
                return res.status(400).json({
                    status: 400,
                    message: 'Deployment ID is required',
                    code: 'MISSING_DEPLOYMENT_ID'
                });
            }

            await this.deploymentService.cancelDeployment(deploymentId);

            return res.status(200).json({
                status: 200,
                message: 'Deployment cancelled successfully'
            });
        } catch (error: any) {
            return errorHandler(error, res);
        }
    }

    async processScheduledDeployments(req: Request, res: Response) {
        try {
            const { date } = req.query;
            const targetDate = date ? new Date(date as string) : new Date();

            await this.deploymentService.processScheduledDeployments(targetDate);

            return res.status(200).json({
                status: 200,
                message: 'Scheduled deployments processed successfully'
            });
        } catch (error: any) {
            return errorHandler(error, res);
        }
    }
}