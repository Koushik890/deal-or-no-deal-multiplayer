export const AVATARS = [
    '/avatars/avatar_1.png',
    '/avatars/avatar_2.png',
    '/avatars/avatar_3.png',
    '/avatars/avatar_4.png',
];

/**
 * Deterministically selects an avatar based on the player's name.
 * Uses a simple hash function to ensure the same name always gets the same avatar.
 */
export function getAvatarForName(name: string): string {
    if (!name) return AVATARS[0];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % AVATARS.length;
    return AVATARS[index];
}
