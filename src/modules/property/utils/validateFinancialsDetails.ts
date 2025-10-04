import { AppError, parseIsoDate } from "../../../shared/utils";
import {
    ReturnModel,
    SupportedCurrency
} from "../../../shared/types";
import { FinancialsSchemaType } from "../types";

/**
 * Validate incoming financials payload
 * Throws AppError on first validation failure
 */
export const validateFinancialsFields = (data: Partial<FinancialsSchemaType>) => {
    if (!data) {
        throw new AppError("Financials payload missing", "MISSING_FINANCIALS_PAYLOAD", 400);
    }

    const required: (keyof FinancialsSchemaType)[] = ["returnModel", "duration", "durationUnit", "propertyValue"];
    const missing = required.filter(f => !data[f]);
    if (missing.length) {
        throw new AppError(
            `Missing required financial fields: ${missing.join(", ")}`,
            "MISSING_FINANCIAL_FIELDS",
            400
        );
    }

    if (!Object.values(ReturnModel).includes(data.returnModel!)) {
        throw new AppError(
            `Invalid returnModel: ${data.returnModel}`,
            "INVALID_RETURN_MODEL",
            400
        );
    }

    const allowedDurations = ["6", "12"];
    if (!allowedDurations.includes(data.duration!)) {
        throw new AppError(
            `Invalid duration: ${data.duration}. Allowed: ${allowedDurations.join(", ")}`,
            "INVALID_DURATION",
            400
        );
    }

    if (data.durationUnit !== "months") {
        throw new AppError(
            `Invalid durationUnit: ${data.durationUnit}. Only 'months' supported`,
            "INVALID_DURATION_UNIT",
            400
        );
    }

    if (data?.interestRate) {
        if (typeof data.interestRate !== "number" || Number.isNaN(data.interestRate)) {
            throw new AppError("interestRate must be a number", "INVALID_INTEREST_RATE_TYPE", 400);
        }
        if (data.interestRate < 0 || data.interestRate > 100) {
            throw new AppError("interestRate must be between 0 and 100", "INVALID_INTEREST_RATE_RANGE", 400);
        }
    }

    const { propertyValue } = data;
    const currency: SupportedCurrency = data.currency || SupportedCurrency.USD;

    if (typeof propertyValue !== "number" || Number.isNaN(propertyValue) || propertyValue <= 0) {
        throw new AppError("propertyValue must be a positive number", "INVALID_PROPERTY_VALUE_AMOUNT", 400);
    }
    if (!Object.values(SupportedCurrency).includes(currency)) {
        throw new AppError(
            `Invalid propertyValue.currency: ${currency}`,
            "INVALID_PROPERTY_VALUE_CURRENCY",
            400
        );
    }
    // crowdfundingAmount (optional)
    const { crowdfundingAmount } = data;
    if (crowdfundingAmount != null) { // allow 0 to be explicitly validated (null/undefined skip)
        if (typeof crowdfundingAmount !== "number" || Number.isNaN(crowdfundingAmount)) {
            throw new AppError("crowdfundingAmount must be a number", "INVALID_CROWDFUNDING_AMOUNT_TYPE", 400);
        }
        if (crowdfundingAmount <= 0) {
            throw new AppError("crowdfundingAmount must be a positive number", "INVALID_CROWDFUNDING_AMOUNT", 400);
        }
        if (crowdfundingAmount > propertyValue) {
            throw new AppError("crowdfundingAmount cannot exceed propertyValue", "INVALID_CROWDFUNDING_AMOUNT_EXCEEDS_PROPERTY_VALUE", 400);
        }
    }

    // periods (optional)
    if (data.periods) {
        const { funding, holding, repayment } = data.periods as any;

        const normalizeRange = (label: string, range?: { start?: any; end?: any; }) => {
            if (!range) return { start: undefined, end: undefined };
            const start = parseIsoDate(range.start, `${label}.start`);
            const end = parseIsoDate(range.end, `${label}.end`);
            if (start && end && start.getTime() > end.getTime()) {
                throw new AppError(
                    `${label}.start cannot be after ${label}.end`,
                    `INVALID_${label.toUpperCase().replace(/\./g, "_")}_RANGE`,
                    400
                );
            }
            // Mutate back normalized Date objects
            range.start = start;
            range.end = end;
            return range;
        };

        normalizeRange("funding", funding);
        normalizeRange("holding", holding);
        normalizeRange("repayment", repayment);

        if (funding?.end && holding?.start && funding.end > holding.start) {
            throw new AppError("funding.end must be before or equal to holding.start", "INVALID_FUNDING_HOLDING_SEQUENCE", 400);
        }
        if (holding?.end && repayment?.start && holding.end > repayment.start) {
            throw new AppError("holding.end must be before or equal to repayment.start", "INVALID_HOLDING_REPAYMENT_SEQUENCE", 400);
        }
    }

    if (data.repaymentDate) {
        const parsed = parseIsoDate(data.repaymentDate as any, "repaymentDate")!;
        if (parsed.getTime() < Date.now()) {
            throw new AppError("repaymentDate cannot be in the past", "INVALID_REPAYMENT_DATE_PAST", 400);
        }
        data.repaymentDate = parsed;
    }
};