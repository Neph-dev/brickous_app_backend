import mongoose, { Schema } from 'mongoose';
import { DeploymentScheduleType, DeploymentScheduleStatus } from '../types';

const DeploymentScheduleSchema = new Schema<DeploymentScheduleType>({
    propertyId: {
        type: Schema.Types.ObjectId,
        ref: 'Property',
        required: true
    },
    scheduledDate: {
        type: Date,
        required: true
    },
    deploymentData: {
        tokenName: {
            type: String,
            required: false
        },
        tokenSymbol: {
            type: String,
            required: false
        },
        totalSupply: {
            type: Number,
            required: false
        },
        pricePerToken: {
            type: Number,
            required: false
        },
        additionalMetadata: {
            type: Schema.Types.Mixed,
            required: false
        }
    },
    status: {
        type: String,
        required: true,
        enum: Object.values(DeploymentScheduleStatus),
        default: DeploymentScheduleStatus.Scheduled
    },
    scheduledBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

// Index for efficient querying by status and scheduled date
DeploymentScheduleSchema.index({ status: 1, scheduledDate: 1 });
DeploymentScheduleSchema.index({ propertyId: 1 });

DeploymentScheduleSchema.pre(/^find/, function (this: mongoose.Query<any, any>) {
    this.populate({
        path: 'propertyId',
        select: 'developer details status contract',
        model: 'Property'
    }).populate({
        path: 'scheduledBy',
        select: 'firstName lastName email',
        model: 'User'
    });
});

export const DeploymentScheduleModel = mongoose.model<DeploymentScheduleType>('DeploymentSchedule', DeploymentScheduleSchema);