"use client";

import { useEffect, useRef, useCallback } from "react";

export interface GlobalLeaderboardEntry {
  rank: number;
  publicId: string;
  playerName: string;
  totalPoints: number;
  gamesPlayed: number;
}

interface GlobalLeaderboardOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  entries: GlobalLeaderboardEntry[];
  title?: string;
  subtitle?: string;
  ariaLabel?: string;
}

/**
 * GlobalLeaderboardOverlay - Runtime (in-memory) top 100 leaderboard.
 * Shows total points accumulated across games (server lifetime).
 */
export function GlobalLeaderboardOverlay({
  isOpen,
  onClose,
  entries,
  title = "Global Leaderboard",
  subtitle = "Runtime (server lifetime)",
  ariaLabel = "Global leaderboard",
}: GlobalLeaderboardOverlayProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) triggerRef.current = document.activeElement as HTMLElement;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => closeButtonRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen && triggerRef.current) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll while overlay is open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const medalClass = (rank: number) => {
    if (rank === 1) return "medal-gold";
    if (rank === 2) return "medal-silver";
    if (rank === 3) return "medal-bronze";
    return "";
  };

  return (
    <div className="leaderboard-overlay" role="dialog" aria-modal="true" aria-label={ariaLabel} ref={dialogRef}>
      <div className="leaderboard-overlay-backdrop" onClick={onClose} aria-hidden="true" />

      <div className="leaderboard-overlay-content glass-dark rounded-2xl overflow-hidden border border-gold-500/30">
        <div className="relative h-24 bg-gradient-to-b from-gold-500/10 to-transparent overflow-hidden">
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold shimmer-text font-display">{title}</h2>
            <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
          </div>

          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 transition-colors text-gray-400 hover:text-white"
            aria-label="Close global leaderboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 max-h-[400px] overflow-y-auto">
          {entries.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No global scores yet.</p>
          ) : (
            <div className="space-y-3">
              {entries.map((e) => {
                const isTop3 = e.rank <= 3;
                return (
                  <div
                    key={e.publicId}
                    className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${
                      isTop3 ? "bg-gold-500/5 border border-gold-500/20" : "bg-white/5 border border-white/5"
                    }`}
                  >
                    {isTop3 ? (
                      <div className={`medal-badge ${medalClass(e.rank)}`}>{e.rank}</div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-studio-700/50 flex items-center justify-center text-gray-400 font-semibold">
                        {e.rank}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${isTop3 ? "text-gold-300" : "text-white"}`}>
                        {e.playerName} <span className="text-xs text-gray-500 ml-2">{e.publicId}</span>
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                        {e.gamesPlayed} {e.gamesPlayed === 1 ? "game" : "games"}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className={`font-mono font-bold text-lg ${isTop3 ? "text-gold-400" : "text-gray-300"}`}>
                        {e.totalPoints.toLocaleString("en-GB")}
                      </div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest">Points</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

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

export default GlobalLeaderboardOverlay;


