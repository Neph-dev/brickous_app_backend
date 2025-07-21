import bcrypt from "bcrypt";

const PASSWORD_MIN_LENGTH = 8;

// Regex explanation:
// - (?=.*[a-z])        → at least one lowercase letter
// - (?=.*[A-Z])        → at least one uppercase letter
// - (?=.*\d)           → at least one digit
// - (?=.*[!@#$%^&*()]) → at least one special character
// - .{8,}              → at least 8 characters
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()])[A-Za-z\d!@#$%^&*()]{8,}$/;

/**
 * Checks if a password is strong according to defined criteria.
 * @param password - The password string to validate.
 * @returns {boolean} - True if password is strong.
 */
export function isStrongPassword(password: string): boolean {
    return strongPasswordRegex.test(password);
}

/**
 * Hashes a password using bcrypt.
 * @param password - Plain password to hash.
 * @param saltRounds - Optional number of salt rounds (default: 12).
 * @returns {Promise<string>} - The hashed password.
 */
export async function hashPassword(password: string, saltRounds = 12): Promise<string> {
    if (!isStrongPassword(password)) {
        throw new Error("Password does not meet strength requirements.");
    }

    return await bcrypt.hash(password, saltRounds);
}
