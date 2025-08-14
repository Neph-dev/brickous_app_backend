import mongoose from "mongoose";
import { AppError } from "../../../shared/utils";
import { addressValidation } from "../../../shared/utils/validations";
import { PropertyScope, PropertyStage, PropertyType } from "../../../shared/types";
import { DetailsType } from "../types";

interface propertyValidationTypes extends DetailsType {
    propertyId: string;
}

export const validatePropertyDetails = (data: propertyValidationTypes) => {

    const requiredFields = [ 'address', 'propertyStage', 'name', 'propertyType', 'propertyScope', 'propertyId' ] as const;
    const missingFields = requiredFields.filter(field => !data.hasOwnProperty(field) || data[ field ] === undefined || data[ field ] === null);

    if (missingFields.length > 0) {
        throw new AppError(`Missing required fields: ${missingFields.join(', ')}`, 'MISSING_REQUIRED_FIELDS', 400);
    }

    // Address validation
    if (!addressValidation(data.address)) {
        throw new AppError('Invalid address format or missing required fields', 'INVALID_ADDRESS_FORMAT', 400);
    }

    // Property stage validation
    if (!Object.values(PropertyStage).includes(data.propertyStage)) {
        throw new AppError(`Invalid property stage: ${data.propertyStage}. Must be one of: ${Object.values(PropertyStage).join(', ')}`, 'INVALID_PROPERTY_STAGE', 400);
    }

    // Property type validation
    if (!Object.values(PropertyType).includes(data.propertyType)) {
        throw new AppError(`Invalid property type: ${data.propertyType}. Must be one of: ${Object.values(PropertyType).join(', ')}`, 'INVALID_PROPERTY_TYPE', 400);
    }

    // Property scope validation
    if (!Object.values(PropertyScope).includes(data.propertyScope)) {
        throw new AppError(`Invalid property scope: ${data.propertyScope}. Must be one of: ${Object.values(PropertyScope).join(', ')}`, 'INVALID_PROPERTY_SCOPE', 400);
    }

    // Name validation
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
        throw new AppError('Property name must be a non-empty string', 'INVALID_NAME_FORMAT', 400);
    }

    if (data.name.trim().length > 100) {
        throw new AppError('Property name must not exceed 100 characters', 'NAME_TOO_LONG', 400);
    }

    // Description validation (optional field)
    if (data.description !== undefined) {
        if (typeof data.description !== 'string') {
            throw new AppError('Description must be a string', 'INVALID_DESCRIPTION_FORMAT', 400);
        }

        if (data.description.trim().length > 0 && data.description.trim().length < 50) {
            throw new AppError('Description must be at least 50 characters long if provided', 'DESCRIPTION_TOO_SHORT', 400);
        }

        if (data.description.trim().length > 300) {
            throw new AppError('Description must not exceed 300 characters', 'DESCRIPTION_TOO_LONG', 400);
        }
    }
};