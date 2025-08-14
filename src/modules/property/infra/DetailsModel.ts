import mongoose, { Schema } from 'mongoose';
import { Address } from '../../../shared/types/Address';
import { addressValidation } from '../../../shared/utils/validations';
import { PropertyScope, PropertyStage, PropertyType } from '../../../shared/types';
import { DetailsType } from '../types';

const DetailsSchema = new Schema<DetailsType>({
    address: {
        type: Object,
        required: true,
        validate: {
            validator: (address: Address) => addressValidation(address),
            message: 'Invalid address format or missing required fields'
        }
    },
    propertyStage: {
        type: String,
        required: true,
        enum: PropertyStage,
        default: PropertyStage.PLANNING
    },
    propertyType: {
        type: String,
        required: true,
        trim: true,
        enum: PropertyType
    },
    propertyScope: {
        type: String,
        required: true,
        enum: PropertyScope,
        default: PropertyScope.UNIT
    },
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    description: {
        type: String,
        required: false,
        trim: true,
        minlength: 50,
        maxlength: 300
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
