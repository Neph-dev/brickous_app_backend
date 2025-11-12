import mongoose from "mongoose";

export interface DeploymentScheduleType {
    _id?: mongoose.Types.ObjectId;
    propertyId: mongoose.Types.ObjectId;
    scheduledDate: Date;
    deploymentData: {
        tokenName?: string;
        tokenSymbol?: string;
        totalSupply?: number;
        pricePerToken?: number;
        additionalMetadata?: Record<string, any>;
    };
    status: DeploymentScheduleStatus;
    scheduledBy: mongoose.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

export enum DeploymentScheduleStatus {
    Scheduled = 'scheduled',
    Processing = 'processing',
    Deployed = 'deployed',
    Failed = 'failed',
    Cancelled = 'cancelled'
}