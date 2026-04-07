import type { Request, Response, NextFunction } from 'express';

// ────────────────────────────────────────────────────────────
// Validation helpers
// ────────────────────────────────────────────────────────────

interface FieldRule {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
}

/**
 * Returns an Express middleware that validates the request body against
 * an array of FieldRule definitions.  If any rule fails the middleware
 * responds with 400 and a descriptive message.
 */
export function validate(rules: FieldRule[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    for (const rule of rules) {
      const value = req.body[rule.name];

      // Required check
      if (rule.required !== false && (value === undefined || value === null)) {
        errors.push(`${rule.name} is required`);
        continue;
      }

      // If value is not present and not required, skip further checks
      if (value === undefined || value === null) continue;

      // Type check
      if (typeof value !== rule.type) {
        errors.push(`${rule.name} must be of type ${rule.type}`);
        continue;
      }

      // String-specific checks
      if (rule.type === 'string') {
        const str = value as string;
        if (rule.minLength !== undefined && str.length < rule.minLength) {
          errors.push(`${rule.name} must be at least ${rule.minLength} characters`);
        }
        if (rule.maxLength !== undefined && str.length > rule.maxLength) {
          errors.push(`${rule.name} must be at most ${rule.maxLength} characters`);
        }
        if (rule.pattern && !rule.pattern.test(str)) {
          errors.push(`${rule.name} has invalid format`);
        }
      }

      // Number-specific checks
      if (rule.type === 'number') {
        const num = value as number;
        if (rule.min !== undefined && num < rule.min) {
          errors.push(`${rule.name} must be >= ${rule.min}`);
        }
        if (rule.max !== undefined && num > rule.max) {
          errors.push(`${rule.name} must be <= ${rule.max}`);
        }
      }
    }

    if (errors.length > 0) {
      res.status(400).json({ success: false, message: errors.join('; ') });
      return;
    }

    next();
  };
}

// ────────────────────────────────────────────────────────────
// Input sanitisation
// ────────────────────────────────────────────────────────────

/**
 * Strip characters that could be used for injection attacks while
 * preserving Korean / Unicode letters, digits, basic punctuation and
 * whitespace.
 */
export function sanitizeInput(input: string): string {
  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');

  // Remove script-related patterns
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Trim leading / trailing whitespace
  sanitized = sanitized.trim();

  return sanitized;
}
