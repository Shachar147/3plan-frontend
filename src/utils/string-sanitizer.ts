/**
 * Utility functions for sanitizing strings
 */

/**
 * Sanitizes a string by replacing non-English, non-numeric, and non-Hebrew characters with underscores
 * Keeps: a-z, A-Z, 0-9, underscore (_), hyphen (-), and Hebrew characters (\u0590-\u05FF)
 * @param str The string to sanitize
 * @returns The sanitized string
 */
export function sanitizeString(str: string): string {
	if (!str) return '';
	return str.replace(/[^a-zA-Z0-9_\-\u0590-\u05FF]/g, '_');
}

/**
 * Sanitizes a string for use in filenames by replacing non-alphanumeric characters with underscores
 * Keeps: a-z, A-Z, 0-9, underscore (_), hyphen (-)
 * @param str The string to sanitize for filename use
 * @returns The sanitized string safe for filenames
 */
export function sanitizeForFilename(str: string): string {
	if (!str) return '';
	return sanitizeString(str).replace(/\s+/g, '_');
}
