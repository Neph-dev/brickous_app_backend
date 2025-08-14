import mongoose, { Schema } from 'mongoose';
import { PropertyImageSchema } from '../types';

const PropertyImageSchema = new Schema<PropertyImageSchema>({
    imageUrls: {
        type: [ String ],
        required: true
    },
    thumbnailUrl: {
        type: String,
        required: true
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