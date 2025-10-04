import mongoose, { Schema } from 'mongoose';
import { FinancialsSchemaType } from '../types';
import { InvestmentPeriod, ReturnModel, SupportedCurrency } from '../../../shared/types';

const FinancialsSchema = new Schema<FinancialsSchemaType>({
    returnModel: {
        type: String,
        enum: Object.values(ReturnModel),
        required: true
    },
    duration: {
        type: String,
        enum: ["6", "12"],
        required: true
    },
    durationUnit: {
        type: String,
        enum: ["months"],
        required: true,
        default: "months"
    },
    interestRate: {
        type: Number,
        required: false,
        default: 0
    },
    repaymentDate: {
        type: Date,
        required: false
    },
    currency: {
        type: String,
        enum: Object.values(SupportedCurrency),
        required: true,
        default: SupportedCurrency.USD
    },
    crowdfundingAmount: {
        type: Number,
        required: false
    },
    propertyValue: {
        type: Number,
        required: false
    },
    periods: {
        currentPeriod: {
            type: String,
            enum: Object.values(InvestmentPeriod),
            required: false,
            default: InvestmentPeriod.PreFunding
        },
        funding: {
            start: {
                type: Date,
                required: false
            },
            end: {
                type: Date,
                required: false
            }
        },
        holding: {
            start: {
                type: Date,
                required: false
            },
            end: {
                type: Date,
                required: false
            }
        },
        repayment: {
            start: {
                type: Date,
                required: false
            }
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

FinancialsSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

export const FinancialsModel = mongoose.model('Financials', FinancialsSchema);
