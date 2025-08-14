import { AppError } from "../../../shared/utils";
import { addressValidation, emailValidation, phoneNumberValidation } from "../../../shared/utils/validations";
import { DeveloperType } from "../types";

export const validateDeveloperFields = (fields: Omit<DeveloperType, '_id'>) => {
    const requiredFields = [ "name", "email", "phone", "businessAddress" ] as const;

    const missingFields = requiredFields.filter(field => !fields.hasOwnProperty(field));

    if (missingFields.length > 0) {
        throw new AppError(`Missing required fields: ${missingFields.join(', ')}`, 'MISSING_REQUIRED_FIELDS', 400);
    }

    if (typeof fields.name !== 'string' || fields.name.trim().length === 0) {
        throw new AppError('Invalid name format', 'INVALID_NAME_FORMAT', 400);
    }

    if (fields.email && !emailValidation(fields.email)) {
        throw new AppError(`Invalid email format: ${fields.email}`, 'INVALID_EMAIL_FORMAT', 400);
    }

    if (fields.phone && !phoneNumberValidation(fields.phone)) {
        throw new AppError(`Invalid phone number format: ${fields.phone}`, 'INVALID_PHONE_NUMBER_FORMAT', 400);
    }

    if (!addressValidation(fields.businessAddress)) {
        throw new AppError('Invalid business address format or missing required fields', 'INVALID_BUSINESS_ADDRESS_FORMAT', 400);
    }
};