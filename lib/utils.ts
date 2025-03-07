import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format, isValid } from 'date-fns';
import { de } from 'date-fns/locale';

/**
 * Combines multiple class names with Tailwind CSS support
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Formats a date as a localized string (DD.MM.YYYY)
 */
export function formatDate(date: Date | string | null | undefined): string {
    if (!date) return '';

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (!isValid(dateObj)) return '';

    return format(dateObj, 'dd.MM.yyyy', { locale: de });
}

/**
 * Returns a relative time string (e.g., "vor 3 Tagen")
 */
export function relativeDate(date: Date | string | null | undefined): string {
    if (!date) return '';

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (!isValid(dateObj)) return '';

    return formatDistanceToNow(dateObj, { addSuffix: true, locale: de });
}

/**
 * Returns a date object from a string
 */
export function parseDate(dateString: string): Date | null {
    const date = new Date(dateString);
    return isValid(date) ? date : null;
}

/**
 * Formats a date for use in inputs (YYYY-MM-DD)
 */
export function formatDateForInput(date: Date | string | null | undefined): string {
    if (!date) return '';

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (!isValid(dateObj)) return '';

    return format(dateObj, 'yyyy-MM-dd');
}

/**
 * Creates a function to log audit events
 */
export function createAuditLogger(userId: string, userAgent?: string, ipAddress?: string) {
    return async function logAudit(
        tableName: string,
        recordId: string,
        action: 'INSERT' | 'UPDATE' | 'DELETE',
        oldValues?: Record<string, any>,
        newValues?: Record<string, any>
    ) {
        try {
            const response = await fetch('/api/audit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tabellenname: tableName,
                    datensatzId: recordId,
                    aktion: action,
                    alteWerte: oldValues ? JSON.stringify(oldValues) : null,
                    neueWerte: newValues ? JSON.stringify(newValues) : null,
                    benutzerId: userId,
                    benutzerAgent: userAgent,
                    ipAdresse: ipAddress,
                }),
            });

            if (!response.ok) {
                console.error('Failed to log audit event:', await response.text());
            }
        } catch (error) {
            console.error('Error logging audit event:', error);
        }
    };
}

/**
 * Truncates a string to a specified length
 */
export function truncate(str: string, length: number): string {
    if (str.length <= length) return str;
    return str.slice(0, length) + '...';
}

/**
 * Safely stringify an object to JSON
 */
export function safeStringify(obj: unknown): string {
    try {
        return JSON.stringify(obj);
    } catch (error) {
        console.error('Error stringifying object:', error);
        return '';
    }
}

/**
 * Safely parse a JSON string
 */
export function safeParse<T>(json: string): T | null {
    try {
        return JSON.parse(json) as T;
    } catch (error) {
        console.error('Error parsing JSON:', error);
        return null;
    }
}

/**
 * Get a formatted error message from an error object
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
}