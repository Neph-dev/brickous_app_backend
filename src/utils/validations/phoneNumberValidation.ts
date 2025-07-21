import { isPossiblePhoneNumber } from 'libphonenumber-js';

export const phoneNumberValidation = (phoneNumber: string): boolean => {
    if (!phoneNumber) {
        return false;
    }

    return isPossiblePhoneNumber(phoneNumber);
};
