export interface PasswordResetType {
    resetId: string;
    email: string;
    codeHash: string;
    expiresAt: string;
    attempts: number;
    maxAttempts: number;
    used: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}