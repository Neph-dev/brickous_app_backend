import { addressValidation, emailValidation, phoneNumberValidation } from "../../../shared/utils/validations";
import { DeveloperType } from "../types";


export const validateDeveloperFields = (fields: DeveloperType) => {
    const requiredFields = [ "name", "email", "phone", "businessAddress" ] as const;

    const missingFields = requiredFields.filter(field => !fields.hasOwnProperty(field));

    if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    if (typeof fields.name !== 'string' || fields.name.trim().length === 0) {
        throw new Error('Invalid name format');
    }

    if (fields.email && !emailValidation(fields.email)) {
        throw new Error(`Invalid email format: ${fields.email}`);
    }

    if (fields.phone && !phoneNumberValidation(fields.phone)) {
        throw new Error(`Invalid phone number format: ${fields.phone}`);
    }

    if (!addressValidation(fields.businessAddress)) {
        throw new Error('Invalid business address format or missing required fields');
    }
};