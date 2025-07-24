import { AccountStatus } from "./AccountStatus";
import { AccountType } from "./AccountType";
import { UserRole } from "./UserRole";

export interface UserType {
    _id?: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: UserRole;
    status?: AccountStatus;
    accountType: AccountType;
    isConfirmed?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
