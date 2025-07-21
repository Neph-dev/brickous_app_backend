import { AccountType } from "./AccountType";
import { UserRole } from "./userRole";

export interface UserType {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: UserRole;
    account: {
        accountType: AccountType;
        isConfirmed: boolean;
        confirmationCode?: string;
        codeExpirationDate?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}
