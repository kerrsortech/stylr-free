/**
 * Centralized error handling for production
 * Sanitizes all errors to hide third-party API details
 * All errors are branded as "Stylr AI" services
 */

export interface SanitizedError {
  message: string;
  code: string;
  userFriendly: string;
  shouldLog: boolean;
}

/**
 * Sanitize error messages to hide third-party API details
 * Replaces all references to GPT-5, Replicate, PageSpeed, etc. with generic messages
 */
export function sanitizeError(error: any, context?: string): SanitizedError {
  const errorMessage = error?.message || String(error) || 'An unexpected error occurred';
  const errorString = errorMessage.toLowerCase();

  // Map of third-party API patterns to generic messages
  const sanitizationMap: Array<{ pattern: RegExp; replacement: string }> = [
    // Replicate/GPT-5 references
    { pattern: /replicate|gpt-?5|openai|gpt-?4/gi, replacement: 'Stylr AI' },
    { pattern: /replicate api|replicate\.com/gi, replacement: 'Stylr AI service' },
    { pattern: /prediction (failed|error|timeout)/gi, replacement: 'analysis processing' },
    { pattern: /model version|model hash/gi, replacement: 'service configuration' },
    { pattern: /api token|replicate.*token/gi, replacement: 'service authentication' },
    
    // PageSpeed references
    { pattern: /pagespeed|google.*pagespeed|lighthouse/gi, replacement: 'performance analysis' },
    { pattern: /pagespeed.*api|pagespeedonline/gi, replacement: 'Stylr AI performance service' },
    
    // Generic API errors
    { pattern: /api.*error|api.*failed|api.*timeout/gi, replacement: 'service error' },
    { pattern: /failed to.*api|api.*unavailable/gi, replacement: 'service temporarily unavailable' },
    
    // Network errors
    { pattern: /fetch.*failed|network.*error|request.*timeout/gi, replacement: 'connection issue' },
    { pattern: /timeout|timed out/gi, replacement: 'processing timeout' },
    
    // JSON parsing errors (keep technical but generic)
    { pattern: /json.*parse|invalid json|malformed json/gi, replacement: 'data format error' },
    
    // Rate limiting
    { pattern: /rate.*limit|too.*many.*requests|429/gi, replacement: 'service temporarily busy' },
    
    // Authentication
    { pattern: /unauthorized|401|403|authentication.*failed/gi, replacement: 'authentication error' },
  ];

  let sanitizedMessage = errorMessage;
  
  // Apply all sanitization patterns
  for (const { pattern, replacement } of sanitizationMap) {
    sanitizedMessage = sanitizedMessage.replace(pattern, replacement);
  }

  // Generate user-friendly message
  let userFriendly = sanitizedMessage;
  
  // Categorize error types for better user messages
  if (errorString.includes('timeout') || errorString.includes('timed out')) {
    userFriendly = 'The analysis is taking longer than expected. Please try again in a moment.';
  } else if (errorString.includes('network') || errorString.includes('fetch') || errorString.includes('connection')) {
    userFriendly = 'Unable to connect to the analysis service. Please check your internet connection and try again.';
  } else if (errorString.includes('rate limit') || errorString.includes('429') || errorString.includes('busy')) {
    userFriendly = 'The service is currently busy. Please wait a moment and try again.';
  } else if (errorString.includes('invalid') || errorString.includes('malformed') || errorString.includes('parse')) {
    userFriendly = 'Unable to process the page data. Please verify the URL is accessible and try again.';
  } else if (errorString.includes('unauthorized') || errorString.includes('401') || errorString.includes('403')) {
    userFriendly = 'Authentication error. Please refresh the page and try again.';
  } else if (errorString.includes('not found') || errorString.includes('404')) {
    userFriendly = 'The requested page could not be found. Please verify the URL is correct.';
  } else if (errorString.includes('500') || errorString.includes('server error')) {
    userFriendly = 'An internal error occurred. Our team has been notified. Please try again in a few moments.';
  } else {
    // Generic fallback - make it sound like it's our service
    userFriendly = sanitizedMessage || 'An unexpected error occurred with Stylr AI analysis. Please try again.';
  }

  // Determine error code
  let code = 'UNKNOWN_ERROR';
  if (errorString.includes('timeout')) code = 'TIMEOUT';
  else if (errorString.includes('network') || errorString.includes('connection')) code = 'NETWORK_ERROR';
  else if (errorString.includes('rate limit') || errorString.includes('429')) code = 'RATE_LIMIT';
  else if (errorString.includes('unauthorized') || errorString.includes('401')) code = 'AUTH_ERROR';
  else if (errorString.includes('not found') || errorString.includes('404')) code = 'NOT_FOUND';
  else if (errorString.includes('500') || errorString.includes('server')) code = 'SERVER_ERROR';
  else if (errorString.includes('parse') || errorString.includes('json')) code = 'PARSE_ERROR';
  else if (errorString.includes('validation') || errorString.includes('invalid url')) code = 'VALIDATION_ERROR';

  return {
    message: sanitizedMessage,
    code,
    userFriendly,
    shouldLog: true, // Always log server-side for debugging
  };
}

/**
 * Log error server-side with full context (never exposed to frontend)
 */
export function logError(error: any, context?: string, additionalData?: Record<string, any>) {
  const sanitized = sanitizeError(error, context);
  
  // Log full error details server-side only
  const logData = {
    timestamp: new Date().toISOString(),
    context: context || 'unknown',
    errorCode: sanitized.code,
    sanitizedMessage: sanitized.message,
    originalError: error?.message || String(error),
    originalErrorType: error?.constructor?.name || typeof error,
    stack: error?.stack,
    ...additionalData,
  };

  // Use console.error for server-side logging (will be captured by logging service)
  // Log in a format that's easy to read in server logs
  console.error('='.repeat(80));
  console.error('[Stylr AI Error]', JSON.stringify(logData, null, 2));
  console.error('='.repeat(80));
  
  // Also log a more readable format for quick debugging
  console.error(`[${logData.context}] ${logData.originalError}`);
  if (error?.stack) {
    console.error('Stack trace:', error.stack);
  }
  if (additionalData && Object.keys(additionalData).length > 0) {
    console.error('Additional context:', additionalData);
  }
  
  return sanitized;
}

/**
 * Create a safe error response for frontend
 * Note: logError is called separately to allow additional context
 */
export function createErrorResponse(error: any, context?: string): { error: string; code: string } {
  const sanitized = sanitizeError(error, context);
  // Don't call logError here - it should be called explicitly with context
  // This prevents double logging and allows callers to add additional data
  
  return {
    error: sanitized.userFriendly,
    code: sanitized.code,
  };
}

/**
 * Check if error should be retried
 */
export function shouldRetry(error: any, attempt: number, maxAttempts: number = 3): boolean {
  if (attempt >= maxAttempts) return false;
  
  const errorString = String(error?.message || error).toLowerCase();
  
  // Retry on network errors, timeouts, rate limits (with backoff)
  return (
    errorString.includes('timeout') ||
    errorString.includes('network') ||
    errorString.includes('connection') ||
    errorString.includes('rate limit') ||
    errorString.includes('429') ||
    errorString.includes('503') || // Service unavailable
    errorString.includes('502') || // Bad gateway
    errorString.includes('504')    // Gateway timeout
  );
}

/**
 * Calculate exponential backoff delay
 */
export function getBackoffDelay(attempt: number, baseDelay: number = 1000): number {
  return Math.min(baseDelay * Math.pow(2, attempt), 30000); // Max 30 seconds
}

