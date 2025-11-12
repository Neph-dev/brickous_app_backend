import express, { Request, Response, NextFunction } from 'express';
import { requireAuth, requireDeveloperAccount } from '../../../middlewares';
import { DeploymentController } from '../controllers';

const router = express.Router();
const deploymentController = new DeploymentController();

// Schedule a deployment
router.post(
    '/schedule',
    requireAuth,
    requireDeveloperAccount,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await deploymentController.scheduleDeployment(req, res);
        } catch (error) {
            next(error);
        }
    }
);

// Manually trigger a deployment
router.post(
    '/trigger/:deploymentId',
    requireAuth,
    requireDeveloperAccount,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await deploymentController.triggerDeployment(req, res);
        } catch (error) {
            next(error);
        }
    }
);

// Get all deployment schedules or by property ID
router.get(
    '/',
    requireAuth,
    requireDeveloperAccount,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await deploymentController.getDeploymentSchedules(req, res);
        } catch (error) {
            next(error);
        }
    }
);

// Get specific deployment schedule
router.get(
    '/:deploymentId',
    requireAuth,
    requireDeveloperAccount,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await deploymentController.getDeploymentSchedule(req, res);
        } catch (error) {
            next(error);
        }
    }
);

// Cancel a deployment
router.delete(
    '/:deploymentId',
    requireAuth,
    requireDeveloperAccount,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await deploymentController.cancelDeployment(req, res);
        } catch (error) {
            next(error);
        }
    }
);

// Process scheduled deployments (admin endpoint)
router.post(
    '/process',
    requireAuth,
    requireDeveloperAccount,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await deploymentController.processScheduledDeployments(req, res);
        } catch (error) {
            next(error);
        }
    }
);

export { router as deploymentRoutes };