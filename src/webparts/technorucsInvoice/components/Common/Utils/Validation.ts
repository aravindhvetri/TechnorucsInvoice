/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ValidationRule {
  required?: boolean | ((data: any) => boolean);
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  message?: string;
}

export type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRule;
};

export type ValidationErrors<T> = {
  [K in keyof T]?: string;
};

/**
 * Validates data against a schema and returns an object with error messages.
 * @param data The data object to validate.
 * @param schema The validation schema with rules for each field.
 * @returns An object with field names as keys and error messages as values.
 */
export const validate = <T extends Record<string, any>>(
  data: T,
  schema: ValidationSchema<T>,
): ValidationErrors<T> => {
  const errors: ValidationErrors<T> = {};

  for (const key in schema) {
    if (!Object.prototype.hasOwnProperty.call(schema, key)) continue;
    const value = data[key];
    const rule = schema[key];

    if (!rule) continue;

    // Required check
    const isRequired =
      typeof rule.required === "function" ? rule.required(data) : rule.required;

    if (
      isRequired &&
      (value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "") ||
        (Array.isArray(value) && value.length === 0))
    ) {
      errors[key] = rule.message || "This field is required";
      continue;
    }

    // Pattern check
    if (value && rule.pattern && !rule.pattern.test(String(value))) {
      errors[key] = rule.message || "Invalid format";
      continue;
    }

    // MinLength check
    if (value && rule.minLength && String(value).length < rule.minLength) {
      errors[key] = rule.message || `Minimum length is ${rule.minLength}`;
      continue;
    }

    // MaxLength check
    if (value && rule.maxLength && String(value).length > rule.maxLength) {
      errors[key] = rule.message || `Maximum length is ${rule.maxLength}`;
      continue;
    }
  }

  return errors;
};
