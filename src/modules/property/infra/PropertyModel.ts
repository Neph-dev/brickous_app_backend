import mongoose, { Schema } from 'mongoose';
import { PropertySchemaType } from '../types';
import { InvestmentType, PropertyStatus } from '../../../shared/types';

const PropertySchema = new Schema<PropertySchemaType>({
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
    images: {
        type: Schema.Types.ObjectId,
        ref: 'PropertyImage',
        required: false
    },
    documents: {
        type: [ Schema.Types.ObjectId ],
        ref: 'PropertyDocs',
        required: false
    },
    status: {
        type: String,
        required: true,
        enum: PropertyStatus,
        default: PropertyStatus.Pending
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

PropertySchema.pre(/^find/, function (this: mongoose.Query<any, any>) {
    this.populate({
        path: 'details',
        select: 'address propertyStage propertyType propertyScope name description',
        model: 'Details'
    }).populate({
        path: 'images',
        select: 'imageUrls thumbnailUrl',
        model: 'PropertyImage'
    });
});

PropertySchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

export const PropertyModel = mongoose.model('Property', PropertySchema);
