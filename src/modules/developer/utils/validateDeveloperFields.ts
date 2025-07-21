import { emailValidation, phoneNumberValidation } from "../../../utils/validations";
import { DeveloperType } from "../types";


export const validateDeveloperFields = (fields: DeveloperType) => {
    const requiredFields = [ "name", "email", "phone" ] as const;

    const missingFields = requiredFields.filter(field => !fields.hasOwnProperty(field));

    if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    if (fields.email && !emailValidation(fields.email)) {
        throw new Error(`Invalid email format: ${fields.email}`);
    }

    if (fields.phone && !phoneNumberValidation(fields.phone)) {
        throw new Error(`Invalid phone number format: ${fields.phone}`);
    }


};