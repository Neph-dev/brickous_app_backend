export interface PreAuthSessionType {
    preAuthSessionId: string;
    email: string;
    deviceId: string;
    code: string;
    expiresAt: string;
    createdAt?: Date;
    updatedAt?: Date;
}