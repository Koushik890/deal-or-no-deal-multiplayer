"use client";

import { useAccessibility } from "@/context/AccessibilityContext";
import { useFeedbackOptional } from "@/context/FeedbackContext";
import { useGame } from "@/context/GameContext";
import { GlobalLeaderboardOverlay } from "@/components/GlobalLeaderboardOverlay";
import { useState } from "react";

/**
 * SettingsPanel - Audio, Haptics, and Accessibility settings
 * 
 * Provides user-facing controls for:
 * - Sound effects On/Off
 * - Haptics/Vibration On/Off (if supported)
 * - High Contrast mode (enhanced borders, solid backgrounds)
 * - Reduced Motion mode (disables animations, uses fade fallbacks)
 * 
 * Uses the AccessibilityContext and FeedbackContext to persist settings.
 */
export function SettingsPanel() {
    const {
        highContrast,
        reducedMotion,
        toggleHighContrast,
        toggleReducedMotion,
    } = useAccessibility();

    const {
        soundEnabled,
        hapticsEnabled,
        setSoundEnabled,
        setHapticsEnabled,
        supportsHaptics,
    } = useFeedbackOptional();

    const { getGlobalLeaderboard } = useGame();
    const [isGlobalOpen, setIsGlobalOpen] = useState(false);
    const [globalLoading, setGlobalLoading] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [globalEntries, setGlobalEntries] = useState<
        Array<{
            rank: number;
            publicId: string;
            playerName: string;
            totalPoints: number;
            gamesPlayed: number;
        }>
    >([]);

    const openGlobalLeaderboard = async () => {
        setGlobalError(null);
        setGlobalLoading(true);
        const res = await getGlobalLeaderboard();
        setGlobalLoading(false);
        if (res.success && res.leaderboard) {
            setGlobalEntries(res.leaderboard);
            setIsGlobalOpen(true);
        } else {
            setGlobalError(res.error || "Could not load global leaderboard.");
        }
    };

    return (
        <>
            <div className="settings-panel glass p-4 rounded-lg space-y-4" role="region" aria-label="Settings">
            <h3 className="text-lg font-display font-bold text-gold-400 mb-3">
                Settings
            </h3>

            {/* Audio/Haptics Section */}
            <div className="space-y-3 pb-3 border-b border-white/10">
                <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
                    Audio & Feedback
                </h4>

                {/* Sound Toggle */}
                <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                        type="checkbox"
                        checked={soundEnabled}
                        onChange={(e) => setSoundEnabled(e.target.checked)}
                        className="
                            w-5 h-5 rounded
                            border-2 border-gold-500/50
                            bg-studio-800
                            text-gold-500
                            focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 focus:ring-offset-studio-900
                            checked:bg-gold-500 checked:border-gold-500
                            cursor-pointer
                        "
                        aria-describedby="sound-desc"
                    />
                    <span className="flex flex-col">
                        <span className="text-white font-medium group-hover:text-gold-300 transition-colors">
                            Sound Effects
                        </span>
                        <span id="sound-desc" className="text-sm text-gray-400">
                            Box opens, banker calls, and victory sounds
                        </span>
                    </span>
                </label>

                {/* Haptics Toggle (only show if supported) */}
                {supportsHaptics && (
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={hapticsEnabled}
                            onChange={(e) => setHapticsEnabled(e.target.checked)}
                            className="
                                w-5 h-5 rounded
                                border-2 border-gold-500/50
                                bg-studio-800
                                text-gold-500
                                focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 focus:ring-offset-studio-900
                                checked:bg-gold-500 checked:border-gold-500
                                cursor-pointer
                            "
                            aria-describedby="haptics-desc"
                        />
                        <span className="flex flex-col">
                            <span className="text-white font-medium group-hover:text-gold-300 transition-colors">
                                Vibration / Haptics
                            </span>
                            <span id="haptics-desc" className="text-sm text-gray-400">
                                Gentle vibration on banker offers
                            </span>
                        </span>
                    </label>
                )}
            </div>

            {/* Accessibility Section */}
            <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
                    Accessibility
                </h4>

                {/* High Contrast Toggle */}
                <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                        type="checkbox"
                        checked={highContrast}
                        onChange={toggleHighContrast}
                        className="
                            w-5 h-5 rounded
                            border-2 border-gold-500/50
                            bg-studio-800
                            text-gold-500
                            focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 focus:ring-offset-studio-900
                            checked:bg-gold-500 checked:border-gold-500
                            cursor-pointer
                        "
                        aria-describedby="high-contrast-desc"
                    />
                    <span className="flex flex-col">
                        <span className="text-white font-medium group-hover:text-gold-300 transition-colors">
                            High Contrast
                        </span>
                        <span id="high-contrast-desc" className="text-sm text-gray-400">
                            Enhanced borders and solid backgrounds
                        </span>
                    </span>
                </label>

                {/* Reduced Motion Toggle */}
                <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                        type="checkbox"
                        checked={reducedMotion}
                        onChange={toggleReducedMotion}
                        className="
                            w-5 h-5 rounded
                            border-2 border-gold-500/50
                            bg-studio-800
                            text-gold-500
                            focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 focus:ring-offset-studio-900
                            checked:bg-gold-500 checked:border-gold-500
                            cursor-pointer
                        "
                        aria-describedby="reduced-motion-desc"
                    />
                    <span className="flex flex-col">
                        <span className="text-white font-medium group-hover:text-gold-300 transition-colors">
                            Reduced Motion
                        </span>
                        <span id="reduced-motion-desc" className="text-sm text-gray-400">
                            Disable animations and use subtle fades
                        </span>
                    </span>
                </label>
            </div>

            {/* Leaderboards */}
            <div className="space-y-3 pt-3 border-t border-white/10">
                <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
                    Leaderboards
                </h4>

                <button
                    onClick={openGlobalLeaderboard}
                    className="w-full min-h-[44px] rounded-lg bg-studio-800/60 hover:bg-studio-700/70 border border-white/10 hover:border-gold-500/30 text-gray-200 font-bold text-sm transition-all"
                    aria-label="Open global leaderboard"
                >
                    {globalLoading ? "Loading..." : "Global Leaderboard"}
                </button>

                {globalError && (
                    <p className="text-xs text-danger-300">{globalError}</p>
                )}
            </div>

            <p className="text-xs text-gray-500 mt-4 pt-3 border-t border-white/10">
                Settings are saved automatically and persist across sessions.
            </p>
            </div>

            <GlobalLeaderboardOverlay
                isOpen={isGlobalOpen}
                onClose={() => setIsGlobalOpen(false)}
                entries={globalEntries}
            />
        </>
    );
}

export default SettingsPanel;

