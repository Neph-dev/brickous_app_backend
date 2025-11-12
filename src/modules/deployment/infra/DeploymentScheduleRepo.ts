import { ErrorResponse } from "../../../constants";
import { AppError, executeDatabaseOperation } from "../../../shared/utils";
import { DeploymentScheduleType, DeploymentScheduleStatus } from "../types";
import { DeploymentScheduleModel } from "./DeploymentScheduleModel";

export interface DeploymentScheduleRepo {
    save(data: DeploymentScheduleType): Promise<DeploymentScheduleType>;
    findById(id: string): Promise<DeploymentScheduleType | null>;
    findByIdRaw(id: string): Promise<DeploymentScheduleType | null>;
    findByPropertyId(propertyId: string): Promise<DeploymentScheduleType[]>;
    findScheduledDeployments(date?: Date): Promise<DeploymentScheduleType[]>;
    updateStatus(id: string, status: DeploymentScheduleStatus): Promise<DeploymentScheduleType>;
    delete(id: string): Promise<void>;
    getAll(): Promise<DeploymentScheduleType[]>;
}

const { NOT_FOUND } = ErrorResponse;

export class MongooseDeploymentScheduleRepo implements DeploymentScheduleRepo {
    async save(data: DeploymentScheduleType): Promise<DeploymentScheduleType> {
        return executeDatabaseOperation(async () => {
            const doc = new DeploymentScheduleModel(data);
            await doc.save();
            return doc.toObject();
        }, 'save');
    }

    async findById(id: string): Promise<DeploymentScheduleType | null> {
        return executeDatabaseOperation(async () => {
            const doc = await DeploymentScheduleModel.findById(id);
            return doc ? doc.toObject() : null;
        }, 'findById');
    }

    async findByIdRaw(id: string): Promise<DeploymentScheduleType | null> {
        return executeDatabaseOperation(async () => {
            // Find without population to get raw ObjectIds
            const doc = await DeploymentScheduleModel.findById(id).lean();
            return doc;
        }, 'findByIdRaw');
    }

    async findByPropertyId(propertyId: string): Promise<DeploymentScheduleType[]> {
        return executeDatabaseOperation(async () => {
            const docs = await DeploymentScheduleModel.find({ propertyId });
            return docs.map(doc => doc.toObject());
        }, 'findByPropertyId');
    }

    async findScheduledDeployments(date?: Date): Promise<DeploymentScheduleType[]> {
        return executeDatabaseOperation(async () => {
            const targetDate = date || new Date();
            const startOfDay = new Date(targetDate);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(targetDate);
            endOfDay.setHours(23, 59, 59, 999);

            const docs = await DeploymentScheduleModel.find({
                status: DeploymentScheduleStatus.Scheduled,
                scheduledDate: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            });

            return docs.map(doc => doc.toObject());
        }, 'findScheduledDeployments');
    }

    async updateStatus(id: string, status: DeploymentScheduleStatus): Promise<DeploymentScheduleType> {
        return executeDatabaseOperation(async () => {
            const updatedDoc = await DeploymentScheduleModel.findByIdAndUpdate(
                id,
                { status, updatedAt: new Date() },
                { new: true }
            );
            if (!updatedDoc) throw new AppError('Deployment schedule not found', NOT_FOUND.code, NOT_FOUND.statusCode);
            return updatedDoc.toObject();
        }, 'updateStatus');
    }

    async delete(id: string): Promise<void> {
        return executeDatabaseOperation(async () => {
            const deletedDoc = await DeploymentScheduleModel.findByIdAndDelete(id);
            if (!deletedDoc) throw new AppError('Deployment schedule not found', NOT_FOUND.code, NOT_FOUND.statusCode);
        }, 'delete');
    }

    async getAll(): Promise<DeploymentScheduleType[]> {
        return executeDatabaseOperation(async () => {
            const docs = await DeploymentScheduleModel.find().sort({ createdAt: -1 });
            return docs.map(doc => doc.toObject());
        }, 'getAll');
    }
}