/**
 * Game constants for Deal or No Deal UK Edition
 */

/**
 * UK Box Values in pounds
 * 20 boxes with values from 1p to £250,000
 */
export const BOX_VALUES: number[] = [
    0.01,
    1,
    5,
    10,
    50,
    100,
    250,
    500,
    750,
    1000,
    3000,
    5000,
    10000,
    15000,
    20000,
    35000,
    50000,
    75000,
    100000,
    250000,
];

/**
 * Round configuration
 * Defines how many boxes to open per round
 * PRD: Round 1: 5, Round 2: 4, Round 3: 3, Round 4: 2, Round 5+: 1
 */
export const ROUNDS: { round: number; boxesToOpen: number }[] = [
    { round: 1, boxesToOpen: 5 },
    { round: 2, boxesToOpen: 4 },
    { round: 3, boxesToOpen: 3 },
    { round: 4, boxesToOpen: 2 },
    // Round 5+: 1 box each until only player's box remains
];

/**
 * Get boxes to open for a given round
 */
export function getBoxesToOpenForRound(round: number): number {
    const roundConfig = ROUNDS.find((r) => r.round === round);
    if (roundConfig) {
        return roundConfig.boxesToOpen;
    }
    // Round 5+: open 1 box at a time
    return 1;
}

/**
 * Offer timeout in milliseconds (20 seconds as per PRD)
 */
export const OFFER_TIMEOUT_MS = 20000;

/**
 * Box opening turn timeout in milliseconds (20 seconds)
 */
export const BOX_OPEN_TIMEOUT_MS = 20000;

/**
 * Room code length
 */
export const ROOM_CODE_LENGTH = 6;

/**
 * Maximum players per room
 */
export const MAX_PLAYERS_PER_ROOM = 6;

/**
 * Minimum players to start game
 */
export const MIN_PLAYERS_TO_START = 2;

/**
 * Maximum display name length
 */
export const MAX_NAME_LENGTH = 16;

/**
 * Banned words for basic profanity filter
 */
export const BANNED_WORDS: string[] = [
    'fuck', 'shit', 'bitch', 'cunt', 'dick', 'ass',
    'bastard', 'wanker', 'twat', 'bollocks', 'prick',
    'nigger', 'faggot', 'retard'
];

/**
 * Check if a name contains banned words
 */
export function containsProfanity(name: string): boolean {
    const lowerName = name.toLowerCase();
    return BANNED_WORDS.some(word => lowerName.includes(word));
}

/**
 * Sanitise a player name (apply profanity filter)
 * If banned word found, replace vowels with asterisks
 */
export function sanitiseName(name: string): string {
    const trimmed = name.trim().slice(0, MAX_NAME_LENGTH);
    if (containsProfanity(trimmed)) {
        // Replace vowels with asterisks
        return trimmed.replace(/[aeiouAEIOU]/g, '*');
    }
    return trimmed;
}
