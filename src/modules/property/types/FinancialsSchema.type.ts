import { InvestmentPeriod, ReturnModel, SupportedCurrency } from "../../../shared/types";

export interface FinancialsSchemaType {
    returnModel: ReturnModel;
    duration: string;
    durationUnit: string;
    interestRate?: number;
    repaymentDate?: Date;
    propertyValue: Value;
    periods: Periods;
    currentPeriod: InvestmentPeriod;
    createdAt?: Date;
    updatedAt?: Date;
}

interface Periods {
    currentPeriod?: InvestmentPeriod;
    funding?: Dates;
    holding?: Dates;
    repayment?: Dates;
}

interface Dates {
    start?: Date;
    end?: Date;
}

interface Value {
    amount: number;
    currency: SupportedCurrency;
}