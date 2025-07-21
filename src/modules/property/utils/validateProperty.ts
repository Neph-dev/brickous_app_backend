import { InvestmentType } from "../../../shared/types";
import { PropertyType } from "../types";

export const validatePropertyFields = (data: PropertyType) => {
    const requiredFields = [ 'developer', 'investmentType' ];
    const missingFields = requiredFields.filter(field => !data.hasOwnProperty(field));
    const validInvestmentTypes = Object.values(InvestmentType);

    if (data.investmentType && !validInvestmentTypes.includes(data.investmentType)) {
        throw new Error(`Invalid investment type: ${data.investmentType}`);
    }

    if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // ! look for developer id in the database
};