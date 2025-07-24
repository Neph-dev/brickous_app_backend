import mongoose, { Schema } from 'mongoose';
import { SessionType } from '../types';

const sessionSchema = new Schema<SessionType>({
    sessionId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    refreshToken: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    deviceId: {
        type: String,
        required: true,
        trim: true
    },
    expiresAt: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Create compound index for userId + deviceId for faster lookups
sessionSchema.index({ userId: 1, deviceId: 1 });

// Automatically remove expired sessions
sessionSchema.pre('find', function () {
    this.where({ expiresAt: { $gt: new Date().toISOString() } });
});

sessionSchema.pre('findOne', function () {
    this.where({ expiresAt: { $gt: new Date().toISOString() } });
});

export const SessionModel = mongoose.model<SessionType>('Session', sessionSchema);