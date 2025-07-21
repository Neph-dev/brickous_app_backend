import mongoose, { Schema } from 'mongoose';
import { DeveloperType } from '../types';

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
    website: {
        type: String,
        required: false,
        trim: true
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
