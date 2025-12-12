"use client";

import { getAvatarForName } from "@/lib/avatar";

interface Player {
    id: string;
    name: string;
    isHost?: boolean;
    hasDealt?: boolean;
    isActive?: boolean;
    isReady?: boolean;
    boxNumber?: number;
    finalAmount?: number;
}

interface PlayerPanelProps {
    /** List of players in the room */
    players: Player[];
    /** ID of the current user */
    currentPlayerId?: string;
    /** Maximum players allowed */
    maxPlayers?: number;
}

/**
 * PlayerPanel - Displays list of players in the game
 * 
 * Shows player avatars, names, and status.
 * Highlights active player, dims dealt players, indicates host.
 */
export function PlayerPanel({
    players,
    currentPlayerId,
    maxPlayers = 6,
}: PlayerPanelProps) {
    const emptySlots = Math.max(0, maxPlayers - players.length);

    return (
        <div className="player-panel">
            <h3 className="text-xs font-bold text-gold-400 mb-3 uppercase tracking-widest pl-1">
                Contestants ({players.length}/{maxPlayers})
            </h3>

            <div
                className="space-y-3 player-panel-carousel"
                role="list"
                aria-label="Players in game"
            >
                {/* Player List */}
                {players.map((player) => (
                    <PlayerCard
                        key={player.id}
                        player={player}
                        isCurrentUser={player.id === currentPlayerId}
                    />
                ))}

                {/* Empty Slots */}
                {Array.from({ length: emptySlots }).map((_, idx) => (
                    <div
                        key={`empty-${idx}`}
                        className="player-card-empty flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-white/5 bg-black/20 min-h-[64px]"
                    >
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                            <span className="text-white/10 text-xl font-bold">?</span>
                        </div>
                        <span className="text-xs text-gray-600 font-medium uppercase tracking-wider">Open Slot</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

interface PlayerCardProps {
    player: Player;
    isCurrentUser: boolean;
}

function PlayerCard({ player, isCurrentUser }: PlayerCardProps) {
    const isDealt = player.hasDealt;
    const isActive = player.isActive;
    const isReady = player.isReady;

    // Determine card styling
    let cardClasses = "player-card flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 min-h-[64px] relative overflow-hidden group ";

    if (isActive && !isDealt) {
        cardClasses += "bg-gradient-to-r from-gold-900/40 to-black border border-gold-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)] ";
    } else if (isDealt) {
        cardClasses += "bg-black/40 border border-white/5 opacity-60 grayscale ";
    } else if (isReady) {
        cardClasses += "bg-gradient-to-r from-success-900/30 to-black border border-success-500/40 ";
    } else {
        cardClasses += "bg-studio-800/40 border border-white/10 hover:bg-studio-700/60 ";
    }

    if (isCurrentUser && !isActive) {
        cardClasses += "ring-1 ring-gold-500/30 ";
    }

    // Avatar Styling
    const avatarBorderClass = isDealt
        ? "border-gray-700 opacity-50"
        : isActive
            ? "border-gold-500 shadow-glow-gold"
            : isReady
                ? "border-success-500"
                : "border-white/20";

    return (
        <div
            className={cardClasses}
            role="listitem"
            tabIndex={0}
            aria-label={`${player.name}${player.isHost ? ', Host' : ''}${isActive ? ', currently playing' : ''}${isDealt ? `, dealt for £${player.finalAmount?.toLocaleString('en-GB') || 0}` : ''}`}
        >
            {/* Active Player Glow Effect */}
            {isActive && !isDealt && (
                <div className="absolute inset-0 bg-gradient-to-r from-gold-500/5 via-transparent to-transparent pointer-events-none animate-pulse" />
            )}

            {/* Avatar Wrapper */}
            <div className="relative z-10 w-10 h-10 flex-shrink-0">
                <div className={`w-full h-full rounded-full flex items-center justify-center shadow-inner overflow-hidden border-2 ${avatarBorderClass}`}>
                    <img
                        src={getAvatarForName(player.name)}
                        alt={player.name}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Online Dot (Outside overflow) */}
                {!isDealt && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-black rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)] z-20" />
                )}
            </div>

            {/* Player Info */}
            <div className="flex-1 min-w-0 z-10">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold tracking-wide truncate ${isDealt ? "text-gray-500 line-through" : "text-gray-100"}`}>
                                {player.name}
                            </span>
                            {isCurrentUser && (
                                <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-300">YOU</span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 text-xs mt-0.5">
                            {player.isHost && (
                                <span className="text-gold-500 font-bold text-[10px] uppercase tracking-widest">HOST</span>
                            )}
                            {player.boxNumber !== undefined && (
                                <span className="text-blue-400 font-mono">BOX {player.boxNumber}</span>
                            )}
                        </div>
                    </div>

                    {/* Right Side Status */}
                    <div className="text-right">
                        {isDealt && player.finalAmount !== undefined ? (
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Dealt</span>
                                <span className="text-green-500 font-mono font-bold">
                                    £{player.finalAmount.toLocaleString("en-GB", { notation: "compact" })}
                                </span>
                            </div>
                        ) : isActive ? (
                            <span className="flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-gold-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-500"></span>
                            </span>
                        ) : isReady ? (
                            <span className="text-[10px] text-success-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                                Ready
                            </span>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * PlayerPanel CSS additions
 */
export const playerPanelStyles = `
.player-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
`;
