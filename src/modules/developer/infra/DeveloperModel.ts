import mongoose, { Schema } from 'mongoose';
import { DeveloperType } from '../types';
import { addressValidation, urlValidation } from '../../../shared/utils/validations';
import { Address } from '../../../shared/types';

const DeveloperSchema = new Schema<DeveloperType>({
    users: {
        type: [ Schema.Types.ObjectId ],
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    businessAddress: {
        type: Object,
        required: true,
        validate: {
            validator: function (address: Address) {
                return addressValidation(address);
            },
            message: 'Invalid address format or missing required fields'
        }
    },
    website: {
        type: String,
        required: false,
        trim: true,
        validate: {
            validator: function (url: string) {
                return urlValidation(url);
            },
            message: 'Invalid website URL format'
        }
    },
    logo: {
        type: String,
        required: false,
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

DeveloperSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

export const DeveloperModel = mongoose.model('Developer', DeveloperSchema);
