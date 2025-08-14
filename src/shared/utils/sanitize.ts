/**
 * Sanitizes sensitive values for safe logging.
 * Supports: emails, phone numbers, blockchain addresses (Ethereum-style)
 */

const sanitiseEmail = (email: string) => {
    if (!email) return email;

    const trimmed = email.trim();
    const [ local, domain ] = trimmed.split("@");
    const maskedLocal = local.length <= 2
        ? `${local[ 0 ]}*`
        : `${local[ 0 ]}${"*".repeat(local.length - 2)}${local[ local.length - 1 ]}`;
    return `${maskedLocal}@${domain}`;
};

const sanitisePhone = (phone: string) => {
    if (!phone) return phone;

    const trimmed = phone.trim();
    return trimmed.replace(/.(?=.{2})/g, "*");
};

const sanitiseBlockchainAddress = (address: string) => {
    if (!address) return address;

    const trimmed = address.trim();
    return `${trimmed.slice(0, 6)}****${trimmed.slice(-4)}`;
};

const defaultMask = (input: string) => {
    if (!input) return input;

    const trimmed = input.trim();
    if (trimmed.length > 8) {
        return `${trimmed.slice(0, 3)}****${trimmed.slice(-3)}`;
    }

    return trimmed;
};

export const sanitise = (input: string, type: 'email' | 'phone' | 'blockchain'): string => {
    if (!input) return input;

    const trimmed = input.trim();

    switch (type) {
        case 'email':
            return sanitiseEmail(trimmed);
        case 'phone':
            return sanitisePhone(trimmed);
        case 'blockchain':
            return sanitiseBlockchainAddress(trimmed);
        default:
            return defaultMask(trimmed);

    }
};
