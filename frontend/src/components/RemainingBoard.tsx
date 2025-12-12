"use client";

import { useMemo } from "react";
import { formatBoxValue } from "@/lib/currency";

// UK Box Values in pounds
export const BOX_VALUES: number[] = [
    0.01, 1, 5, 10, 50, 100, 250, 500, 750, 1000,
    3000, 5000, 10000, 15000, 20000, 35000, 50000, 75000, 100000, 250000,
];

interface RemainingBoardProps {
    /** Array of eliminated value amounts */
    eliminatedValues?: number[];
    /** Whether to show scorch animation on recently eliminated */
    showScorchAnimation?: boolean;
    /** Recently eliminated value (for scorch animation) */
    recentlyEliminated?: number;
}

/**
 * RemainingBoard - Displays remaining money values
 * 
 * Shows all 20 box values with eliminated values crossed out.
 * Uses scorch animation for recently eliminated values.
 * Split into low (blue) and high (gold) value columns.
 */
export function RemainingBoard({
    eliminatedValues = [],
    showScorchAnimation = true,
    recentlyEliminated,
}: RemainingBoardProps) {
    // Split values into low and high
    const { lowValues, highValues } = useMemo(() => {
        const midpoint = Math.floor(BOX_VALUES.length / 2);
        return {
            lowValues: BOX_VALUES.slice(0, midpoint),
            highValues: BOX_VALUES.slice(midpoint),
        };
    }, []);

    const isEliminated = (value: number) => eliminatedValues.includes(value);
    const isRecentlyEliminated = (value: number) =>
        showScorchAnimation && recentlyEliminated === value;

    return (
        <div className="remaining-board relative overflow-hidden rounded-xl border-2 border-slate-800 bg-black/80 shadow-2xl">
            {/* Monitor Glare/Scanline Effect */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] opacity-20" />
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_20px_rgba(0,0,0,1)] z-20" />

            <div className="relative z-30 p-3">
                <div className="border-b border-slate-700/50 pb-2 mb-2 space-y-1">
                    <h3 className="text-center text-[10px] font-display font-bold text-slate-500 uppercase tracking-[0.3em] opacity-80">
                        Money Board
                    </h3>
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-bold tracking-widest text-blue-400/90 uppercase border-b border-blue-500/30 pb-0.5">Low</span>
                        <span className="text-[10px] font-bold tracking-widest text-gold-400/90 uppercase border-b border-gold-500/30 pb-0.5">High</span>
                    </div>
                </div>

                <div className="flex gap-2">
                    {/* Low Values Column (Blue) */}
                    <div className="flex-1 space-y-1">
                        {lowValues.map((value) => (
                            <ValueChip
                                key={value}
                                value={value}
                                isLow
                                isEliminated={isEliminated(value)}
                                isScorching={isRecentlyEliminated(value)}
                            />
                        ))}
                    </div>

                    {/* High Values Column (Gold) */}
                    <div className="flex-1 space-y-1">
                        {highValues.map((value) => (
                            <ValueChip
                                key={value}
                                value={value}
                                isLow={false}
                                isEliminated={isEliminated(value)}
                                isScorching={isRecentlyEliminated(value)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

interface ValueChipProps {
    value: number;
    isLow: boolean;
    isEliminated: boolean;
    isScorching: boolean;
}

function ValueChip({ value, isLow, isEliminated, isScorching }: ValueChipProps) {
    const baseClasses = "relative w-full h-8 sm:h-9 flex items-center justify-center font-display font-bold text-sm sm:text-base tracking-wide transition-all duration-500 rounded-sm overflow-hidden";

    // Dynamic classes based on state
    let bgClasses = "";
    let textClasses = "";
    let borderClasses = "";
    let effectClasses = "";

    if (isEliminated) {
        bgClasses = "bg-slate-900/40";
        textClasses = "text-slate-600 line-through opacity-40 blur-[0.5px]";
        borderClasses = "border border-transparent";
    } else {
        if (isLow) {
            bgClasses = "bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900";
            textClasses = "text-blue-100 text-shadow-blue";
            borderClasses = "border-l-2 border-r-2 border-blue-500/50";
            effectClasses = "shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]";
        } else {
            bgClasses = "bg-gradient-to-r from-red-900 via-red-800 to-red-900";
            textClasses = "text-red-100 text-shadow-red";
            borderClasses = "border-l-2 border-r-2 border-red-500/50";
            effectClasses = "shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]";
        }
    }

    const scorchClasses = isScorching ? "animate-scorch z-50 scale-110" : "";

    return (
        <div className={`${baseClasses} ${bgClasses} ${borderClasses} ${scorchClasses}`}>
            {/* Inner Glare for "Active" chips */}
            {!isEliminated && (
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
            )}

            <span className={`relative z-10 ${textClasses}`}>
                {formatBoxValue(value)}
            </span>
        </div>
    );
}
