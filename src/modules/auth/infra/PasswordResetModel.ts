import mongoose, { Schema } from 'mongoose';
import { PasswordResetType } from '../types/PasswordResetType';

const passwordResetSchema = new Schema<PasswordResetType>({
    resetId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        index: true,
        trim: true
    },
    codeHash: {
        type: String,
        required: true
    },
    expiresAt: {
        type: String,
        required: true
    },
    attempts: {
        type: Number,
        required: true,
        default: 0
    },
    maxAttempts: {
        type: Number,
        required: true,
        default: 5
    },
    used: {
        type: Boolean,
        required: true,
        default: false
    }
}, { timestamps: true });

passwordResetSchema.index({ email: 1, used: 1 });

export const PasswordResetModel = mongoose.model<PasswordResetType>('PasswordReset', passwordResetSchema);
