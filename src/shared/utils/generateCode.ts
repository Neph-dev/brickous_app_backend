import crypto from 'crypto';

export const generateCode = (length = 6): string => {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = crypto.randomBytes(length);
    let code = '';
    for (let i = 0; i < length; i++) {
        code += alphabet[ bytes[ i ] & 31 ];
    }
    return code;
};
