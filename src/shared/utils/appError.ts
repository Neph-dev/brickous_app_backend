export class AppError extends Error {
    constructor(
        public readonly message: string,
        public readonly code: string,
        public readonly statusCode: number = 400,
        public readonly details?: any
    ) {
        super(message);
        Object.setPrototypeOf(this, AppError.prototype);
    }
}