'use client';

import { useState, useCallback } from 'react';

interface ValidationRule<T = unknown> {
    validate: (value: T) => boolean | Promise<boolean>;
    message: string;
}

interface UseFormValidationReturn<T> {
    errors: Record<keyof T, string>;
    validateField: (fieldName: keyof T, value: unknown) => Promise<boolean>;
    validateForm: (values: T) => Promise<boolean>;
    clearError: (fieldName: keyof T) => void;
    clearAllErrors: () => void;
    hasErrors: boolean;
}

/**
 * Custom hook for form validation
 */
export function useFormValidation<T extends Record<string, unknown>>(
    validationRules: Partial<Record<keyof T, ValidationRule[]>>
): UseFormValidationReturn<T> {
    const [errors, setErrors] = useState<Record<keyof T, string>>({} as Record<keyof T, string>);

    /**
     * Validate a single field
     */
    const validateField = useCallback(
        async (fieldName: keyof T, value: unknown): Promise<boolean> => {
            const rules = validationRules[fieldName];

            if (!rules || rules.length === 0) {
                return true;
            }

            for (const rule of rules) {
                const isValid = await rule.validate(value);
                if (!isValid) {
                    setErrors((prev) => ({
                        ...prev,
                        [fieldName]: rule.message,
                    }));
                    return false;
                }
            }

            // Clear error if validation passes
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[fieldName];
                return newErrors;
            });

            return true;
        },
        [validationRules]
    );

    /**
     * Validate entire form
     */
    const validateForm = useCallback(
        async (values: T): Promise<boolean> => {
            const newErrors: Record<string, string> = {};
            let isFormValid = true;

            for (const [fieldName, rules] of Object.entries(validationRules)) {
                if (!rules || rules.length === 0) continue;

                const value = values[fieldName as keyof T];

                for (const rule of rules as ValidationRule[]) {
                    const isValid = await rule.validate(value);
                    if (!isValid) {
                        newErrors[fieldName] = rule.message;
                        isFormValid = false;
                        break;
                    }
                }
            }

            setErrors(newErrors as Record<keyof T, string>);
            return isFormValid;
        },
        [validationRules]
    );

    /**
     * Clear error for a specific field
     */
    const clearError = useCallback((fieldName: keyof T) => {
        setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[fieldName];
            return newErrors;
        });
    }, []);

    /**
     * Clear all errors
     */
    const clearAllErrors = useCallback(() => {
        setErrors({} as Record<keyof T, string>);
    }, []);

    /**
     * Check if there are any errors
     */
    const hasErrors = Object.keys(errors).length > 0;

    return {
        errors,
        validateField,
        validateForm,
        clearError,
        clearAllErrors,
        hasErrors,
    };
}

/**
 * Common validation rules
 */
export const validationRules = {
    required: (message = 'This field is required'): ValidationRule => ({
        validate: (value) => {
            if (typeof value === 'string') {
                return value.trim().length > 0;
            }
            return value !== null && value !== undefined;
        },
        message,
    }),

    email: (message = 'Please enter a valid email address'): ValidationRule => ({
        validate: (value: unknown) => {
            if (typeof value !== 'string') return false;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(value);
        },
        message,
    }),

    minLength: (length: number, message?: string): ValidationRule => ({
        validate: (value: unknown) => {
            if (typeof value !== 'string') return false;
            return value.length >= length;
        },
        message: message || `Must be at least ${length} characters`,
    }),

    maxLength: (length: number, message?: string): ValidationRule => ({
        validate: (value: unknown) => {
            if (typeof value !== 'string') return false;
            return value.length <= length;
        },
        message: message || `Must be no more than ${length} characters`,
    }),

    pattern: (regex: RegExp, message = 'Invalid format'): ValidationRule => ({
        validate: (value: unknown) => {
            if (typeof value !== 'string') return false;
            return regex.test(value);
        },
        message,
    }),

    matchField: (otherValue: unknown, message = 'Fields do not match'): ValidationRule => ({
        validate: (value) => value === otherValue,
        message,
    }),

    phoneNumber: (message = 'Please enter a valid phone number'): ValidationRule => ({
        validate: (value: unknown) => {
            if (typeof value !== 'string') return false;
            const digits = value.replace(/\D/g, '');
            return digits.length >= 10 && digits.length <= 15;
        },
        message,
    }),

    passwordStrength: (message = 'Password is too weak'): ValidationRule => ({
        validate: (value: unknown) => {
            if (typeof value !== 'string') return false;
            return (
                value.length >= 8 &&
                /\d/.test(value) &&
                /[!@#$%^&*]/.test(value)
            );
        },
        message,
    }),

    url: (message = 'Please enter a valid URL'): ValidationRule => ({
        validate: (value: unknown) => {
            if (typeof value !== 'string') return false;
            try {
                new URL(value);
                return true;
            } catch {
                return false;
            }
        },
        message,
    }),
};