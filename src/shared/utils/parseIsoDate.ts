import { AppError } from "./appError";

// Accept only strict YYYY-MM-DD
export const parseIsoDate = (value: unknown, fieldPath: string): Date | undefined => {
    if (value === undefined || value === null) return undefined;
    if (value instanceof Date) {
        if (isNaN(value.getTime())) {
            throw new AppError(`${fieldPath} is invalid Date`, `INVALID_${fieldPath.toUpperCase().replace(/\./g, "_")}`, 400);
        }
        return value;
    }
    if (typeof value === 'string') {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            throw new AppError(
                `${fieldPath} must match format YYYY-MM-DD`,
                `INVALID_${fieldPath.toUpperCase().replace(/\./g, "_")}_FORMAT`,
                400
            );
        }
        const date = new Date(`${value}T00:00:00.000Z`);
        if (isNaN(date.getTime())) {
            throw new AppError(
                `${fieldPath} is not a valid calendar date`,
                `INVALID_${fieldPath.toUpperCase().replace(/\./g, "_")}_VALUE`,
                400
            );
        }
        return date;
    }
    throw new AppError(
        `${fieldPath} must be a Date or YYYY-MM-DD string`,
        `INVALID_${fieldPath.toUpperCase().replace(/\./g, "_")}_TYPE`,
        400
    );
};