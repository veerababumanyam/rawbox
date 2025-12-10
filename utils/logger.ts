/**
 * Centralized logging service for the application
 * Prevents sensitive information from being logged in production
 */

const isDevelopment = process.env.NODE_ENV === 'development';

interface LogContext {
    [key: string]: any;
}

/**
 * Sanitizes data to remove sensitive information before logging
 */
const sanitizeData = (data: any): any => {
    if (!data) return data;

    const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'accessCode'];

    if (typeof data === 'object') {
        const sanitized = { ...data };
        Object.keys(sanitized).forEach(key => {
            if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
                sanitized[key] = '[REDACTED]';
            }
        });
        return sanitized;
    }

    return data;
};

export const logger = {
    /**
     * Log informational messages (development only)
     */
    info: (message: string, context?: LogContext) => {
        if (isDevelopment) {
            console.log(`[INFO] ${message}`, context ? sanitizeData(context) : '');
        }
        // In production, send to monitoring service (e.g., LogRocket, Datadog)
    },

    /**
     * Log warning messages
     */
    warn: (message: string, context?: LogContext) => {
        if (isDevelopment) {
            console.warn(`[WARN] ${message}`, context ? sanitizeData(context) : '');
        }
        // In production, send to monitoring service
    },

    /**
     * Log error messages
     */
    error: (message: string, error?: Error | any, context?: LogContext) => {
        if (isDevelopment) {
            console.error(`[ERROR] ${message}`, error, context ? sanitizeData(context) : '');
        }
        // In production, send to error tracking service (e.g., Sentry)
        // Example: Sentry.captureException(error, { extra: context });
    },

    /**
     * Log debug messages (development only)
     */
    debug: (message: string, context?: LogContext) => {
        if (isDevelopment) {
            console.debug(`[DEBUG] ${message}`, context ? sanitizeData(context) : '');
        }
    }
};
