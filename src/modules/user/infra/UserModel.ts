import mongoose, { Schema } from 'mongoose';
import { emailValidation } from '../../../utils/validations';
import { AccountStatus, AccountType, UserRole, UserType } from '../types';

const UserSchema = new Schema<UserType>({
    firstName: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 50
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        validate: {
            validator: function (email: string) {
                return emailValidation(email);
            },
            message: 'Invalid email format'
        }
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: [ UserRole.Admin, UserRole.User, UserRole.Guest ],
    },
    account: {
        accountType: {
            type: String,
            required: true,
            enum: [ AccountType.Inverstor, AccountType.Developer ],
        },
        isConfirmed: {
            type: Boolean,
            default: false,
            required: true,
        },
        confirmationCode: {
            type: String,
            required: false,
            trim: true,
            minlength: 6,
            maxlength: 6
        },
        codeExpirationDate: {
            type: String,
            required: false,
            default: () => {
                const date = new Date();
                date.setMinutes(date.getMinutes() + 10);
                return date.toISOString();
            },
        },
        status: {
            type: String,
            required: true,
            enum: [
                AccountStatus.Active,
                AccountStatus.Inactive,
                AccountStatus.Suspended,
                AccountStatus.Waitlist,
                AccountStatus.Closed
            ],
            default: AccountStatus.Inactive
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

UserSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

export const UserModel = mongoose.model('User', UserSchema);

