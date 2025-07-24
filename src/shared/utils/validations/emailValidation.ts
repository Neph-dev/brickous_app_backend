export const emailValidation = (email: string): boolean => {
    const emailRegex = /^[^\s@]+(\.[^\s@]+)*@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && !email.includes('..');
};
