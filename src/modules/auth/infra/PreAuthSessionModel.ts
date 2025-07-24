import mongoose, { Schema } from 'mongoose';
import { PreAuthSessionType } from '../types';
import { emailValidation } from '../../../shared/utils/validations';

const preAuthSessionSchema = new Schema<PreAuthSessionType>({
    preAuthSessionId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        validate: {
            validator: function (email: string) {
                return emailValidation(email);
            },
            message: 'Invalid email format'
        }
    },
    deviceId: {
        type: String,
        required: true,
        trim: true,
    },
    code: {
        type: String,
        required: true,
        trim: true,
        minlength: 6,
        maxlength: 6
    },
    expiresAt: {
        type: String,
        required: true,
        default: () => {
            const date = new Date();
            date.setMinutes(date.getMinutes() + 15);
            return date.toISOString();
        },
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

preAuthSessionSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

export const PreAuthSessionModel = mongoose.model<PreAuthSessionType>('PreAuthSession', preAuthSessionSchema);
