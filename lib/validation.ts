/**
 * Input validation and sanitization utilities
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitized?: string;
}

/**
 * Sanitize user input by removing potentially harmful characters
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';

  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');

  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove excessive whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  return sanitized;
}

/**
 * Validate question input
 */
export function validateQuestion(question: unknown): ValidationResult {
  // Check if question exists
  if (!question) {
    return {
      isValid: false,
      error: 'Vraag is verplicht'
    };
  }

  // Check if question is a string
  if (typeof question !== 'string') {
    return {
      isValid: false,
      error: 'Vraag moet een tekst zijn'
    };
  }

  // Sanitize input
  const sanitized = sanitizeInput(question);

  // Check if empty after sanitization
  if (sanitized.length === 0) {
    return {
      isValid: false,
      error: 'Vraag kan niet leeg zijn'
    };
  }

  // Check minimum length
  if (sanitized.length < 10) {
    return {
      isValid: false,
      error: 'Vraag moet minimaal 10 karakters bevatten'
    };
  }

  // Check maximum length
  if (sanitized.length > 500) {
    return {
      isValid: false,
      error: 'Vraag mag maximaal 500 karakters bevatten'
    };
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick=
    /eval\(/i,
    /expression\(/i
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(sanitized)) {
      return {
        isValid: false,
        error: 'Vraag bevat ongeldige karakters'
      };
    }
  }

  return {
    isValid: true,
    sanitized
  };
}

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if request is allowed
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];

    // Remove old requests outside the time window
    const recentRequests = userRequests.filter(time => now - time < this.windowMs);

    if (recentRequests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);

    return true;
  }

  /**
   * Get remaining requests
   */
  getRemaining(identifier: string): number {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    const recentRequests = userRequests.filter(time => now - time < this.windowMs);
    return Math.max(0, this.maxRequests - recentRequests.length);
  }
}
