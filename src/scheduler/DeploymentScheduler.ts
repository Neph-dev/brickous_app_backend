import cron from 'node-cron';
import { logger } from '../shared/utils';
import { PropertyDeploymentService } from '../modules/deployment/services';

export class DeploymentScheduler {
    private deploymentService: PropertyDeploymentService;
    private isRunning: boolean = false;

    constructor() {
        this.deploymentService = new PropertyDeploymentService();
    }

    start(): void {
        if (this.isRunning) {
            logger.warn('Deployment scheduler is already running');
            return;
        }

        // Schedule to run every day at midnight (00:00)
        cron.schedule('0 0 * * *', async () => {
            logger.info('Running scheduled deployment job at midnight');
            try {
                await this.processScheduledDeployments();
            } catch (error) {
                logger.error('Error in scheduled deployment job', {
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }, {
            timezone: 'UTC'
        });

        this.isRunning = true;
        logger.info('Deployment scheduler started - will run daily at midnight UTC');
    }

    stop(): void {
        if (!this.isRunning) {
            logger.warn('Deployment scheduler is not running');
            return;
        }

        // Note: node-cron doesn't provide a direct way to stop a specific task
        // In a production environment, you might want to store the task reference
        this.isRunning = false;
        logger.info('Deployment scheduler stopped');
    }

    async processScheduledDeployments(date?: Date): Promise<void> {
        const targetDate = date || new Date();
        logger.info('Processing scheduled deployments for date', { targetDate });

        try {
            await this.deploymentService.processScheduledDeployments(targetDate);
            logger.info('Successfully completed processing scheduled deployments');
        } catch (error) {
            logger.error('Failed to process scheduled deployments', {
                error: error instanceof Error ? error.message : 'Unknown error',
                targetDate
            });
            throw error;
        }
    }

    isSchedulerRunning(): boolean {
        return this.isRunning;
    }

    async runManualDeploymentProcess(date?: Date): Promise<void> {
        logger.info('Running manual deployment process', { date });
        await this.processScheduledDeployments(date);
    }
}