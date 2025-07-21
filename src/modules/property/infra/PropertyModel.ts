import mongoose, { Schema } from 'mongoose';
import { PropertyType } from '../types';
import { InvestmentType } from '../../../shared/types';

const PropertySchema = new Schema<PropertyType>({
    developer: {
        type: Schema.Types.ObjectId,
        ref: 'Developer',
        required: true
    },
    investmentType: {
        type: String,
        required: true,
        enum: Object.values(InvestmentType),
        default: InvestmentType.Crowdfunding
    },
    details: {
        type: Schema.Types.ObjectId,
        ref: 'Details',
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

PropertySchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

export const PropertyModel = mongoose.model('Property', PropertySchema);
