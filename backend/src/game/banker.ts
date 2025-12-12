/**
 * Banker offer calculation
 * 
 * Client-approved formula with round modifiers and randomFactor.
 * Rounds to nearest £10 as specified.
 */

/**
 * Get the banker's offer based on remaining values and current round
 * 
 * Client-approved formula:
 * - Calculate average of remaining values
 * - Apply round modifier (more generous in later rounds)
 * - Apply random factor (0.9-1.1) for variance
 * - Round to nearest £10
 * 
 * @param remainingValues - Array of values still in play
 * @param round - Current round number (1-based)
 * @returns The banker's offer amount (rounded to nearest £10)
 */
export function getBankerOffer(remainingValues: number[], round: number): number {
    if (remainingValues.length === 0) {
        return 0;
    }

    const avg = remainingValues.reduce((sum, v) => sum + v, 0) / remainingValues.length;

    // Round modifiers – more generous later
    const roundModifiers = [0.7, 0.8, 0.9, 0.95, 1.0, 1.05];
    const baseModifier = roundModifiers[Math.min(round - 1, roundModifiers.length - 1)];

    const randomFactor = 0.9 + Math.random() * 0.2; // 0.9–1.1

    const offer = avg * baseModifier * randomFactor;

    return Math.round(offer / 10) * 10; // round to nearest £10
}

/**
 * Legacy alias for backwards compatibility
 * @deprecated Use getBankerOffer instead
 */
export function calculateBankerOffer(
    remainingValues: number[],
    round: number
): number {
    return getBankerOffer(remainingValues, round);
}

/**
 * Calculate a "fair" offer for comparison
 * This is simply the average of remaining values
 */
export function calculateFairValue(remainingValues: number[]): number {
    if (remainingValues.length === 0) return 0;
    const sum = remainingValues.reduce((acc, val) => acc + val, 0);
    return sum / remainingValues.length;
}

/**
 * Determine if an offer is "good" compared to fair value
 */
export function isGoodOffer(offer: number, remainingValues: number[]): boolean {
    const fairValue = calculateFairValue(remainingValues);
    return offer >= fairValue * 0.8; // Within 80% of fair value is "good"
}
