"use client";

import { useState } from "react";
import { Logo } from "./Logo";
import { SettingsPanel } from "./SettingsPanel";
import { getAvatarForName } from "@/lib/avatar";

interface TopBarProps {
    /** Room code to display */
    roomCode?: string;
    /** Current player's display name */
    playerName?: string;
    /** Whether there's an active banker offer */
    hasActiveOffer?: boolean;
    /** Whether player is the host */
    isHost?: boolean;
    /** Callback when logo is clicked */
    onLogoClick?: () => void;
}

/**
 * TopBar - Main navigation bar for the game
 * 
 * Displays logo, room code, player name, settings, and notification indicator.
 * Uses TV-studio styling with glass effect and glow accents.
 */
export function TopBar({
    roomCode,
    playerName,
    hasActiveOffer = false,
    isHost = false,
    onLogoClick,
}: TopBarProps) {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    return (
        <>
            <header
                role="banner"
                className="top-bar glass-dark sticky top-0 z-50 px-4 py-3 flex items-center justify-between gap-4"
            >
                {/* Logo */}
                <button
                    onClick={onLogoClick}
                    className="min-h-[44px] min-w-[44px] hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 focus:ring-offset-studio-900 rounded-lg"
                    aria-label="Go to home"
                >
                    <Logo size="md" showText className="hidden sm:flex" />
                    <Logo size="sm" showText={false} className="sm:hidden" />
                </button>

                {/* Centre - Room Code */}
                {roomCode && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Room</span>
                        <code className="px-3 py-1.5 rounded-md bg-studio-700 text-gold-400 font-mono font-semibold text-sm border border-gold-500/30">
                            {roomCode}
                        </code>
                    </div>
                )}

                {/* Right - Settings, Player Info & Notification */}
                <div className="flex items-center gap-3">
                    {/* Settings Button */}
                    <button
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-studio-700/50 border border-white/5 hover:border-gold-500/30 hover:bg-studio-700 transition-all focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 focus:ring-offset-studio-900"
                        aria-label="Open settings"
                        aria-expanded={isSettingsOpen}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-gray-400 hover:text-gold-400 transition-colors"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                        </svg>
                    </button>

                    {/* Notification Indicator - Banker Incoming */}
                    {hasActiveOffer && (
                        <div className="relative flex items-center justify-center">
                            {/* Outer sweep ring */}
                            <div className="absolute w-6 h-6 rounded-full border-2 border-gold-400/50 animate-ping" />
                            {/* Inner pulsing dot */}
                            <div className="notification-dot w-3 h-3 rounded-full bg-gold-500 glow-gold-pulse animate-pulse" />
                            <span className="sr-only">Banker is calling with an offer</span>
                        </div>
                    )}

                    {/* Player Name */}
                    {playerName && (
                        <div className="flex items-center gap-2 min-h-[44px] px-3 py-2 rounded-lg bg-studio-700/50 border border-white/5">
                            <div className="w-8 h-8 rounded-full border border-gold-500/30 overflow-hidden bg-studio-950">
                                <img
                                    src={getAvatarForName(playerName)}
                                    alt={playerName}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="hidden sm:flex flex-col">
                                <span className="text-sm font-medium text-white leading-tight">
                                    {playerName}
                                </span>
                                {isHost && (
                                    <span className="text-xs text-gold-400 leading-tight">Host</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* Settings Panel Dropdown */}
            {isSettingsOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40 bg-black/30"
                        onClick={() => setIsSettingsOpen(false)}
                        aria-hidden="true"
                    />
                    {/* Panel */}
                    <div className="fixed top-16 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] animate-in fade-in slide-in-from-top-2 duration-200">
                        <SettingsPanel />
                    </div>
                </>
            )}
        </>
    );
}

/**
 * TopBar notification dot styles
 * Add to studio.css or use inline
 */
export const topBarStyles = `
.notification-dot {
  animation: pulse-glow 1.5s ease-in-out infinite;
}

.top-bar {
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
`;
