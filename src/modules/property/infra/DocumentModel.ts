import mongoose, { Schema } from 'mongoose';
import { PropertyDocsType, DocumentType } from '../types';

const PropertyDocsSchema = new Schema<PropertyDocsType>({
    title: {
        type: String,
        required: false,
    },
    description: {
        type: String,
        required: true
    },
    documentType: {
        type: String,
        enum: Object.values(DocumentType),
        required: true
    },
    url: {
        type: String,
        required: true
    },
    addedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
}, { timestamps: true });

export const PropertyDocsModel = mongoose.model<PropertyDocsType>('PropertyDocs', PropertyDocsSchema);
