export const ErrorResponse = {
    GENERIC: {
        statusCode: 500,
        code: "REQUEST_FAILED",
        message: "Internal server error",
    },
    NOT_FOUND: {
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Resource not found",
    },
    UNAUTHORIZED: {
        statusCode: 403,
        code: "UNAUTHORIZED",
        message: "unauthorized access",
    },
    MISSING_TOKEN: {
        statusCode: 401,
        code: "MISSING_TOKEN",
        message: "Access token required",
    },
    JWT_SECRET_MISSING: {
        statusCode: 500,
        code: "JWT_SECRET_MISSING",
        message: "Server configuration error",
    },
    TOKEN_EXPIRED: {
        statusCode: 401,
        code: "TOKEN_EXPIRED",
        message: "Token has expired",
    },
    INVALID_FIELD: {
        statusCode: 400,
        code: "INVALID_FIELD",
        message: "Invalid field provided",
    },
    MAX_ATTEMPTS: {
        statusCode: 429,
        code: "MAX_ATTEMPTS",
        message: "Too many attempts. Please try again later.",
    },
    EMAIL_SEND_ERROR: {
        statusCode: 500,
        code: "EMAIL_SEND_ERROR",
        message: "Failed to send email",
    }
};