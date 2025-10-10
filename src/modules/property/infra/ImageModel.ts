import mongoose, { Schema } from 'mongoose';
import { PropertyImageSchema } from '../types';

const PropertyImageSchema = new Schema<PropertyImageSchema>({
    imageUrls: {
        type: [String],
        required: true,
        validate: {
            validator: (v: string[]) => Array.isArray(v) && v.length <= 20,
            message: 'images exceed the maximum allowed length of 20'
        }
    },
    thumbnailUrl: {
        type: String,
        required: false,
        default: ''
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

PropertyImageSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

export const PropertyImageModel = mongoose.model('PropertyImage', PropertyImageSchema);