import { InvestmentPeriod, Maybe, ReturnModel, SupportedCurrency } from "../../../shared/types";

export interface FinancialsSchemaType {
    returnModel: ReturnModel;
    duration: string;
    durationUnit: string;
    interestRate?: number;
    repaymentDate?: Date;
    currency: SupportedCurrency;
    propertyValue: number;
    crowdfundingAmount: number;
    periods: Maybe<Periods>;
    createdAt?: Date;
    updatedAt?: Date;
}

interface Periods {
    currentPeriod: InvestmentPeriod;
    funding: Dates;
    holding: Dates;
    repayment: Dates;
}

interface Dates {
    start?: Date;
    end?: Date;
}

export interface Value {
    amount: number;
    currency: SupportedCurrency;
}