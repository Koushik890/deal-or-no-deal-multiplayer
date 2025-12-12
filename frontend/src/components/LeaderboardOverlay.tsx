"use client";

import { useEffect, useRef, useCallback } from "react";

export interface LeaderboardScore {
    id: string;
    playerName: string;
    amount: number;
    points?: number;
    rank?: number;
    isCurrentPlayer?: boolean;
}

interface LeaderboardOverlayProps {
    /** Whether the overlay is open */
    isOpen: boolean;
    /** Callback to close the overlay */
    onClose: () => void;
    /** Array of player scores, sorted by rank */
    scores: LeaderboardScore[];
    /** Title shown at the top of the overlay */
    title?: string;
    /** Subtitle or game info */
    subtitle?: string;
    /** Aria label for the dialog */
    ariaLabel?: string;
}

/**
 * LeaderboardOverlay - Modal overlay showing game results
 * 
 * Features:
 * - Gold/silver/bronze badges for top 3 places
 * - Slide-up animation
 * - SVG placeholder panel for decorative graphics
 * - Focus management for accessibility
 */
export function LeaderboardOverlay({
    isOpen,
    onClose,
    scores,
    title = "Game Finished",
    subtitle = "Final Results",
    ariaLabel = "Leaderboard Results",
}: LeaderboardOverlayProps) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const triggerRef = useRef<HTMLElement | null>(null);

    // Store the element that triggered the dialog open
    useEffect(() => {
        if (isOpen) {
            triggerRef.current = document.activeElement as HTMLElement;
        }
    }, [isOpen]);

    // Focus management: move focus into dialog when opened
    useEffect(() => {
        if (isOpen && closeButtonRef.current) {
            const timer = setTimeout(() => {
                closeButtonRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Restore focus when closed
    useEffect(() => {
        if (!isOpen && triggerRef.current) {
            triggerRef.current.focus();
            triggerRef.current = null;
        }
    }, [isOpen]);

    // Handle Escape key to close
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === "Escape" && isOpen) {
            onClose();
        }
    }, [isOpen, onClose]);

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    // Focus trap
    useEffect(() => {
        if (!isOpen || !dialogRef.current) return;

        const dialog = dialogRef.current;
        const focusableElements = dialog.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleTabKey = (e: KeyboardEvent) => {
            if (e.key !== "Tab") return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        };

        dialog.addEventListener("keydown", handleTabKey);
        return () => dialog.removeEventListener("keydown", handleTabKey);
    }, [isOpen]);

    // Prevent body scroll while overlay is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const getMedalClass = (rank: number): string => {
        switch (rank) {
            case 1:
                return "medal-gold";
            case 2:
                return "medal-silver";
            case 3:
                return "medal-bronze";
            default:
                return "";
        }
    };

    const formatAmount = (amount: number): string => `£${amount.toLocaleString("en-GB")}`;

    return (
        <div
            className="leaderboard-overlay"
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            ref={dialogRef}
        >
            {/* Backdrop */}
            <div
                className="leaderboard-overlay-backdrop"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Content */}
            <div className="leaderboard-overlay-content glass-dark rounded-2xl overflow-hidden border border-gold-500/30">
                {/* SVG Decorative Header */}
                <div className="relative h-24 bg-gradient-to-b from-gold-500/10 to-transparent overflow-hidden">
                    <svg
                        className="absolute inset-0 w-full h-full opacity-20"
                        viewBox="0 0 400 100"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                    >
                        {/* Decorative trophy outline */}
                        <path
                            d="M200 10 L220 30 L235 30 L235 45 L225 55 L225 70 L215 75 L215 85 L185 85 L185 75 L175 70 L175 55 L165 45 L165 30 L180 30 Z"
                            stroke="#d4af37"
                            strokeWidth="2"
                            fill="none"
                            opacity="0.6"
                        />
                        {/* Decorative stars */}
                        <circle cx="100" cy="40" r="3" fill="#d4af37" opacity="0.4" />
                        <circle cx="120" cy="25" r="2" fill="#d4af37" opacity="0.3" />
                        <circle cx="300" cy="35" r="3" fill="#d4af37" opacity="0.4" />
                        <circle cx="280" cy="50" r="2" fill="#d4af37" opacity="0.3" />
                        <circle cx="150" cy="60" r="2" fill="#d4af37" opacity="0.25" />
                        <circle cx="250" cy="20" r="2" fill="#d4af37" opacity="0.25" />
                        {/* Radial lines */}
                        <path d="M200 50 L170 20" stroke="#d4af37" strokeWidth="1" opacity="0.2" />
                        <path d="M200 50 L230 20" stroke="#d4af37" strokeWidth="1" opacity="0.2" />
                        <path d="M200 50 L160 50" stroke="#d4af37" strokeWidth="1" opacity="0.15" />
                        <path d="M200 50 L240 50" stroke="#d4af37" strokeWidth="1" opacity="0.15" />
                    </svg>

                    {/* Title */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <h2 className="text-2xl font-bold shimmer-text font-display">
                            {title}
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
                    </div>

                    {/* Close Button */}
                    <button
                        ref={closeButtonRef}
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 transition-colors text-gray-400 hover:text-white"
                        aria-label="Close leaderboard"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Scores List */}
                <div className="px-6 py-4 max-h-[400px] overflow-y-auto">
                    {scores.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">
                            No scores to display
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {scores.map((score, index) => {
                                const rank = score.rank ?? index + 1;
                                const isTop3 = rank <= 3;
                                const medalClass = getMedalClass(rank);

                                return (
                                    <div
                                        key={score.id}
                                        className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${isTop3
                                                ? "bg-gold-500/5 border border-gold-500/20"
                                                : "bg-white/5 border border-white/5"
                                            } ${score.isCurrentPlayer
                                                ? "ring-2 ring-primary-500/50"
                                                : ""
                                            }`}
                                        style={{
                                            animationDelay: `${index * 100}ms`,
                                        }}
                                    >
                                        {/* Rank Badge */}
                                        {isTop3 ? (
                                            <div className={`medal-badge ${medalClass}`}>
                                                {rank}
                                            </div>
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-studio-700/50 flex items-center justify-center text-gray-400 font-semibold">
                                                {rank}
                                            </div>
                                        )}

                                        {/* Player Info */}
                                        <div className="flex-1 min-w-0">
                                            <p
                                                className={`font-medium truncate ${isTop3 ? "text-gold-300" : "text-white"
                                                    }`}
                                            >
                                                {score.playerName}
                                                {score.isCurrentPlayer && (
                                                    <span className="text-xs text-primary-400 ml-2">
                                                        (You)
                                                    </span>
                                                )}
                                            </p>
                                        </div>

                                        {/* Amount */}
                                        <div className="text-right">
                                            <div
                                                className={`font-mono font-bold text-lg ${isTop3 ? "text-gold-400" : "text-gray-300"
                                                    }`}
                                            >
                                                {formatAmount(score.amount)}
                                            </div>
                                            {score.points !== undefined && (
                                                <div className="text-[10px] text-gray-500 uppercase tracking-widest">
                                                    {score.points.toLocaleString("en-GB")} pts
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/10 flex justify-center">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 rounded-lg font-semibold text-studio-900 transition-all hover:shadow-lg hover:shadow-gold-500/25"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
