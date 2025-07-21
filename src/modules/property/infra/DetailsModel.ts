import mongoose, { Schema } from 'mongoose';
import { Address } from '../../../shared/types/Address';
import { addressValidation } from '../../../utils/validations';
import { PropertyStage } from '../../../shared/types';
import { DetailsType } from '../types';

const DetailsSchema = new Schema<DetailsType>({
    address: {
        type: Object,
        required: true,
        validate: {
            validator: function (address: Address) {
                return addressValidation(address);
            },
            message: 'Invalid address format or missing required fields'
        }
    },
    propertyStage: {
        type: String,
        required: true,
        enum: [ PropertyStage.PLANNING, PropertyStage.UNDER_CONSTRUCTION ],
        default: PropertyStage.PLANNING
    },
    name: {
        type: String,
        required: true,
        trim: true
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

DetailsSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

export const DetailsModel = mongoose.model('Details', DetailsSchema);
