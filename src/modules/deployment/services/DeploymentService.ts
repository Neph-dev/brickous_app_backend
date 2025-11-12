import { PropertyStatus } from "../../../shared/types";
import { logger } from "../../../shared/utils";
import { MongoosePropertyRepo } from "../../property/infra";
import { MongooseDeploymentScheduleRepo } from "../infra";
import { DeploymentScheduleType, DeploymentScheduleStatus } from "../types";
import { BlockchainService, SimulatedBlockchainService } from "./BlockchainService";

export interface DeploymentService {
    scheduleDeployment(deployment: Omit<DeploymentScheduleType, '_id' | 'createdAt' | 'updatedAt'>): Promise<DeploymentScheduleType>;
    deployProperty(deploymentId: string, deployedBy?: string): Promise<void>;
    processScheduledDeployments(date?: Date): Promise<void>;
    cancelDeployment(deploymentId: string): Promise<void>;
}

export class PropertyDeploymentService implements DeploymentService {
    private deploymentRepo: MongooseDeploymentScheduleRepo;
    private propertyRepo: MongoosePropertyRepo;
    private blockchainService: BlockchainService;

    constructor() {
        this.deploymentRepo = new MongooseDeploymentScheduleRepo();
        this.propertyRepo = new MongoosePropertyRepo();
        this.blockchainService = new SimulatedBlockchainService();
    }

    async scheduleDeployment(deployment: Omit<DeploymentScheduleType, '_id' | 'createdAt' | 'updatedAt'>): Promise<DeploymentScheduleType> {
        logger.info('Scheduling deployment', {
            propertyId: deployment.propertyId,
            scheduledDate: deployment.scheduledDate
        });

        const property = await this.propertyRepo.findById(deployment.propertyId.toString());
        if (!property) {
            throw new Error('Property not found');
        }

        if (property.status === PropertyStatus.Deployed) {
            throw new Error('Property is already deployed');
        }

        const existingDeployments = await this.deploymentRepo.findByPropertyId(deployment.propertyId.toString());
        const activeDeployment = existingDeployments.find(d =>
            d.status === DeploymentScheduleStatus.Scheduled ||
            d.status === DeploymentScheduleStatus.Processing
        );

        if (activeDeployment) {
            throw new Error('There is already an active deployment schedule for this property');
        }

        return await this.deploymentRepo.save(deployment as DeploymentScheduleType);
    }

    async deployProperty(deploymentId: string, deployedBy: string = 'Automatic'): Promise<void> {
        logger.info('Starting property deployment', { deploymentId, deployedBy });

        const rawDeployment = await this.deploymentRepo.findByIdRaw(deploymentId);
        if (!rawDeployment) {
            throw new Error('Deployment schedule not found');
        }

        // Update status to processing
        await this.deploymentRepo.updateStatus(deploymentId, DeploymentScheduleStatus.Processing);

        const deployment = await this.deploymentRepo.findById(deploymentId);
        if (!deployment) {
            throw new Error('Deployment schedule not found');
        }

        try {
            const deploymentResult = await this.blockchainService.deployProperty(deployment);

            const propertyId = rawDeployment.propertyId._id.toString();

            await this.propertyRepo.update(propertyId, {
                status: PropertyStatus.Deployed,
                contract: deploymentResult.contractAddress,
                'deployment.deployedAt': new Date(),
                'deployment.deployedBy': deployedBy,
                'deployment.transactionHash': deploymentResult.transactionHash
            });

            await this.deploymentRepo.updateStatus(deploymentId, DeploymentScheduleStatus.Deployed);

            logger.info('Property deployment completed successfully', {
                deploymentId,
                propertyId: propertyId,
                contractAddress: deploymentResult.contractAddress,
                deployedBy
            });

        } catch (error) {
            logger.error('Property deployment failed', {
                deploymentId,
                propertyId: rawDeployment.propertyId._id,
                error: error instanceof Error ? error.message : 'Unknown error'
            });

            await this.deploymentRepo.updateStatus(deploymentId, DeploymentScheduleStatus.Failed);
            throw error;
        }
    }

    async processScheduledDeployments(date?: Date): Promise<void> {
        const targetDate = date || new Date();
        logger.info('Processing scheduled deployments', { targetDate });

        try {
            const scheduledDeployments = await this.deploymentRepo.findScheduledDeployments(targetDate);

            if (scheduledDeployments.length === 0) {
                logger.info('No scheduled deployments found for date', { targetDate });
                return;
            }

            logger.info('Found scheduled deployments to process', {
                count: scheduledDeployments.length,
                deployments: scheduledDeployments.map(d => ({
                    id: d._id,
                    propertyId: d.propertyId,
                    scheduledDate: d.scheduledDate
                }))
            });

            for (const deployment of scheduledDeployments) {
                try {
                    if (deployment._id) {
                        await this.deployProperty(deployment._id.toString(), 'Automatic');
                    }
                } catch (error) {
                    logger.error('Failed to process scheduled deployment', {
                        deploymentId: deployment._id,
                        propertyId: deployment.propertyId,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }

            logger.info('Completed processing scheduled deployments', {
                processedCount: scheduledDeployments.length
            });

        } catch (error) {
            logger.error('Error processing scheduled deployments', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    async cancelDeployment(deploymentId: string): Promise<void> {
        logger.info('Cancelling deployment', { deploymentId });

        const deployment = await this.deploymentRepo.findById(deploymentId);
        if (!deployment) {
            throw new Error('Deployment schedule not found');
        }

        if (deployment.status === DeploymentScheduleStatus.Processing) {
            throw new Error('Cannot cancel deployment that is currently being processed');
        }

        if (deployment.status === DeploymentScheduleStatus.Deployed) {
            throw new Error('Cannot cancel deployment that has already been deployed');
        }

        await this.deploymentRepo.updateStatus(deploymentId, DeploymentScheduleStatus.Cancelled);

        logger.info('Deployment cancelled successfully', { deploymentId });
    }
}