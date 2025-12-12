/**
 * Points calculation for leaderboard
 * 
 * Client-approved scoring formula with:
 * - Base points from winnings (capped at 3000)
 * - Smart Deal bonus (beat your own box)
 * - Guts bonus (stayed to later rounds)
 * - Early exit penalty
 * - Last standing / highest winnings bonuses
 * - Timeout penalties
 */

import { BOX_VALUES } from './constants';

/**
 * Calculate the maximum possible value for reference
 */
const MAX_VALUE = Math.max(...BOX_VALUES);

/**
 * Parameters for calculating player points
 */
export interface CalculatePointsParams {
    finalWinnings: number;
    finalBoxValue: number;
    roundDealt: number;
    isLastStanding: boolean;
    isHighestWinnings: boolean;
    timeoutCount: number;
}

/**
 * Calculate points for a player's performance
 * 
 * Client-approved formula with bonuses and penalties.
 * 
 * @param params - Object containing all scoring parameters
 * @returns Points earned (minimum 0)
 */
export function calculatePoints({
    finalWinnings,
    finalBoxValue,
    roundDealt,
    isLastStanding,
    isHighestWinnings,
    timeoutCount
}: CalculatePointsParams): number {
    let points = 0;

    // Base: £ scaled down, capped
    points += Math.min(Math.floor(finalWinnings / 100), 3000); // e.g. £250k → 2500 pts (capped at 3000)

    // Smart Deal bonus: beat your own box
    if (finalWinnings > finalBoxValue) {
        points += 200;
    }

    // Guts bonus: stayed to later rounds
    if (roundDealt >= 4) {
        points += 150;
    }

    // Very early exit penalty (round 1 or 2)
    if (roundDealt <= 2) {
        points -= 50;
    }

    if (isLastStanding) points += 200;
    if (isHighestWinnings) points += 200;

    // Penalty for timeouts / AFK behaviour
    points -= timeoutCount * 50;

    return Math.max(points, 0);
}

/**
 * Legacy function signature for backwards compatibility
 * @deprecated Use calculatePoints with CalculatePointsParams object instead
 */
export function calculatePointsLegacy(
    finalAmount: number,
    roundDealt: number | null,
    remainingValuesAtDeal: number[]
): number {
    // Approximate legacy behaviour with new formula
    const estimatedBoxValue = remainingValuesAtDeal.length > 0
        ? remainingValuesAtDeal.reduce((a, b) => a + b, 0) / remainingValuesAtDeal.length
        : 0;

    return calculatePoints({
        finalWinnings: finalAmount,
        finalBoxValue: estimatedBoxValue,
        roundDealt: roundDealt || 10,
        isLastStanding: roundDealt === null,
        isHighestWinnings: false,
        timeoutCount: 0
    });
}

/**
 * Generate leaderboard from player results
 */
export interface PlayerResult {
    playerId: string;
    playerName: string;
    finalAmount: number;
    finalBoxValue: number;
    roundDealt: number;
    isLastStanding: boolean;
    timeoutCount: number;
}

export interface LeaderboardEntry {
    playerId: string;
    playerName: string;
    amount: number;
    points: number;
    rank: number;
}

export function generateLeaderboard(players: PlayerResult[]): LeaderboardEntry[] {
    // Find highest winnings for bonus
    const highestWinnings = Math.max(...players.map(p => p.finalAmount));

    const entries = players.map((player) => ({
        playerId: player.playerId,
        playerName: player.playerName,
        amount: player.finalAmount,
        points: calculatePoints({
            finalWinnings: player.finalAmount,
            finalBoxValue: player.finalBoxValue,
            roundDealt: player.roundDealt,
            isLastStanding: player.isLastStanding,
            isHighestWinnings: player.finalAmount === highestWinnings,
            timeoutCount: player.timeoutCount
        }),
        rank: 0,
    }));

    // Sort by points descending
    entries.sort((a, b) => b.points - a.points);

    // Assign ranks
    entries.forEach((entry, index) => {
        entry.rank = index + 1;
    });

    return entries;
}
