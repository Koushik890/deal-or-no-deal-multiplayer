/**
 * Currency formatting utilities for UK pounds
 * Provides consistent currency display across the application
 */

export interface FormatCurrencyOptions {
    /** Show pence for values under £1 (e.g., "1p" instead of "£0.01") */
    usePence?: boolean;
    /** Use compact notation (e.g., "£50k" instead of "£50,000") */
    compact?: boolean;
    /** Show decimal places for non-whole numbers */
    showDecimals?: boolean;
}

/**
 * Format a number as UK currency
 * 
 * @example
 * formatCurrency(0.01) // "1p"
 * formatCurrency(1000) // "£1,000"
 * formatCurrency(50000, { compact: true }) // "£50k"
 * formatCurrency(250000, { compact: true }) // "£250k"
 */
export function formatCurrency(
    value: number,
    options: FormatCurrencyOptions = {}
): string {
    const { usePence = true, compact = false, showDecimals = false } = options;

    // Handle pence for very small values
    if (usePence && value < 1 && value > 0) {
        const pence = Math.round(value * 100);
        return `${pence}p`;
    }

    // Compact notation for large values
    if (compact) {
        if (value >= 1000000) {
            const millions = value / 1000000;
            return `£${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}m`;
        }
        if (value >= 1000) {
            const thousands = value / 1000;
            return `£${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}k`;
        }
    }

    // Standard formatting
    const formatted = value.toLocaleString("en-GB", {
        minimumFractionDigits: showDecimals && value % 1 !== 0 ? 2 : 0,
        maximumFractionDigits: showDecimals ? 2 : 0,
    });

    return `£${formatted}`;
}

/**
 * Format currency for display in the box grid (compact form)
 * 
 * @example
 * formatBoxValue(0.01) // "1p"
 * formatBoxValue(1000) // "£1k"
 * formatBoxValue(250000) // "£250k"
 */
export function formatBoxValue(value: number): string {
    return formatCurrency(value, { usePence: true, compact: true });
}

/**
 * Format currency for banker offers (full display with commas)
 * 
 * @example
 * formatOfferAmount(42500) // "£42,500"
 * formatOfferAmount(1234.56) // "£1,234.56"
 */
export function formatOfferAmount(value: number): string {
    return formatCurrency(value, { usePence: false, compact: false, showDecimals: true });
}

/**
 * Format currency for leaderboard/winnings display
 * 
 * @example
 * formatWinnings(75000) // "£75,000"
 */
export function formatWinnings(value: number): string {
    return formatCurrency(value, { usePence: false, compact: false });
}

/**
 * Parse a currency string back to a number
 * 
 * @example
 * parseCurrency("£42,500") // 42500
 * parseCurrency("50p") // 0.5
 * parseCurrency("£1.5k") // 1500
 */
export function parseCurrency(value: string): number {
    const cleaned = value.trim().toLowerCase();

    // Handle pence
    if (cleaned.endsWith("p")) {
        return parseInt(cleaned.replace("p", ""), 10) / 100;
    }

    // Remove currency symbol and commas
    let numStr = cleaned.replace(/[£,]/g, "");

    // Handle compact notation
    if (numStr.endsWith("k")) {
        return parseFloat(numStr.replace("k", "")) * 1000;
    }
    if (numStr.endsWith("m")) {
        return parseFloat(numStr.replace("m", "")) * 1000000;
    }

    return parseFloat(numStr);
}
