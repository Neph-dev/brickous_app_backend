import { Address } from "../../shared/types";

export const addressValidation = (address: Address): boolean => {
    /*
        Required fields validation
    */
    if (!address.line1 || typeof address.line1 !== 'string' || address.line1.trim().length === 0) {
        return false;
    }

    if (!address.city || typeof address.city !== 'string' || address.city.trim().length === 0) {
        return false;
    }

    if (!address.country || typeof address.country !== 'string' || address.country.trim().length === 0) {
        return false;
    }

    /*
    Optional fields validation
    */
    if (address.line2 && (typeof address.line2 !== 'string' || address.line2.trim().length === 0)) {
        return false;
    }

    if (address.state && (typeof address.state !== 'string' || address.state.trim().length === 0)) {
        return false;
    }

    if (address.postalCode && (typeof address.postalCode !== 'string' || address.postalCode.trim().length === 0)) {
        return false;
    }

    /*
        Coordinates validation
    */
    if (address.coordinates) {
        const { latitude, longitude } = address.coordinates;
        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
            return false;
        }

        if (latitude < -90 || latitude > 90) {
            return false;
        }

        if (longitude < -180 || longitude > 180) {
            return false;
        }
    }

    return true;
};