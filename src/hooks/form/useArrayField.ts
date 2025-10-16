// hooks/form/useArrayField.ts
'use client';

import { useEffect, useMemo, useCallback } from 'react';
import type { UseFormReturn, FieldPath, FieldValues } from 'react-hook-form';

/**
 * Helper function to ensure a value is always an array of strings
 * Handles various input types: arrays, strings (comma-separated), null, undefined
 */
const ensureArray = (value: unknown): string[] => {
  // Already an array - filter to ensure only strings
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string' && v.trim() !== '');
  }
  
  // String value - split by comma and clean up
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);
  }
  
  // Null, undefined, or other types - return empty array
  return [];
};

/**
 * Options for the useArrayField hook
 */
interface UseArrayFieldOptions {
  /**
   * Whether to automatically normalize the field value on mount
   * @default true
   */
  autoNormalize?: boolean;
  
  /**
   * Separator to use when parsing string values
   * @default ','
   */
  separator?: string;
}

/**
 * Return type for the useArrayField hook
 */
interface UseArrayFieldReturn {
  /**
   * The current array value (always an array)
   */
  values: string[];
  
  /**
   * Add a new value to the array
   */
  addValue: (value: string) => void;
  
  /**
   * Remove a value at a specific index
   */
  removeValue: (index: number) => void;
  
  /**
   * Remove a value by its content
   */
  removeValueByContent: (value: string) => void;
  
  /**
   * Clear all values
   */
  clearValues: () => void;
  
  /**
   * Check if a value exists in the array
   */
  hasValue: (value: string) => boolean;
  
  /**
   * Get the count of values
   */
  count: number;
}

/**
 * Custom hook for managing array fields in React Hook Form
 * 
 * Features:
 * - Automatic normalization of string values to arrays
 * - Type-safe operations (add, remove, clear)
 * - Memory efficient with useMemo and useCallback
 * - Handles comma-separated strings from JSON presets
 * - Auto-cleanup of empty strings and duplicates
 * 
 * @example
 * ```tsx
 * const { values, addValue, removeValue } = useArrayField(
 *   form,
 *   'brandDetails.brandValues'
 * );
 * 
 * // Render chips
 * {values.map((value, index) => (
 *   <Chip 
 *     key={index} 
 *     label={value} 
 *     onDelete={() => removeValue(index)}
 *   />
 * ))}
 * ```
 */
export function useArrayField<TFieldValues extends FieldValues = FieldValues>(
  form: UseFormReturn<TFieldValues>,
  fieldPath: FieldPath<TFieldValues>,
  options: UseArrayFieldOptions = {}
): UseArrayFieldReturn {
  const { autoNormalize = true, separator = ',' } = options;
  const { watch, setValue } = form;
  
  // Watch the raw value from the form
  const rawValue = watch(fieldPath);
  
  // Memoize the normalized array value
  const values = useMemo(() => {
    return ensureArray(rawValue);
  }, [rawValue]);
  
  // Count of values
  const count = useMemo(() => values.length, [values.length]);
  
  // Auto-normalize the field value when it's not an array
  useEffect(() => {
    if (!autoNormalize) return;
    
    // If the current value is not an array, normalize it
    if (rawValue && !Array.isArray(rawValue)) {
      const normalized = ensureArray(rawValue);
      setValue(fieldPath, normalized as any, {
        shouldValidate: false,
        shouldDirty: false,
      });
    }
  }, [autoNormalize, rawValue, fieldPath, setValue]);
  
  // Add a new value to the array
  const addValue = useCallback(
    (value: string): void => {
      const trimmedValue = value.trim();
      
      // Don't add empty values
      if (!trimmedValue) return;
      
      // Don't add duplicates
      if (values.includes(trimmedValue)) return;
      
      const newValues = [...values, trimmedValue];
      setValue(fieldPath, newValues as any, {
        shouldValidate: true,
        shouldDirty: true,
      });
    },
    [values, fieldPath, setValue]
  );
  
  // Remove a value at a specific index
  const removeValue = useCallback(
    (index: number): void => {
      // Validate index
      if (index < 0 || index >= values.length) return;
      
      const newValues = [...values];
      newValues.splice(index, 1);
      setValue(fieldPath, newValues as any, {
        shouldValidate: true,
        shouldDirty: true,
      });
    },
    [values, fieldPath, setValue]
  );
  
  // Remove a value by its content
  const removeValueByContent = useCallback(
    (value: string): void => {
      const newValues = values.filter(v => v !== value);
      setValue(fieldPath, newValues as any, {
        shouldValidate: true,
        shouldDirty: true,
      });
    },
    [values, fieldPath, setValue]
  );
  
  // Clear all values
  const clearValues = useCallback((): void => {
    setValue(fieldPath, [] as any, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [fieldPath, setValue]);
  
  // Check if a value exists
  const hasValue = useCallback(
    (value: string): boolean => {
      return values.includes(value);
    },
    [values]
  );
  
  return {
    values,
    addValue,
    removeValue,
    removeValueByContent,
    clearValues,
    hasValue,
    count,
  };
}

/**
 * Variant of useArrayField for managing multiple related array fields
 * Useful when you need to manage several array fields with similar operations
 * 
 * @example
 * ```tsx
 * const fields = useMultipleArrayFields(form, [
 *   'brandDetails.brandValues',
 *   'brandDetails.voiceAndTone.toneKeywords'
 * ]);
 * 
 * // Access individual fields
 * const brandValues = fields['brandDetails.brandValues'];
 * const toneKeywords = fields['brandDetails.voiceAndTone.toneKeywords'];
 * ```
 */
export function useMultipleArrayFields<TFieldValues extends FieldValues = FieldValues>(
  form: UseFormReturn<TFieldValues>,
  fieldPaths: FieldPath<TFieldValues>[],
  options: UseArrayFieldOptions = {}
): Record<string, UseArrayFieldReturn> {
  const fields: Record<string, UseArrayFieldReturn> = {};
  
  fieldPaths.forEach(path => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    fields[path] = useArrayField(form, path, options);
  });
  
  return fields;
}