"use client";

import { useCountdown, useCountdownFromExpiry } from "@/hooks/useCountdown";

interface CountdownRingProps {
    /** Size in pixels */
    size?: number;
    /** Stroke width */
    strokeWidth?: number;
    /** Ring colour (default: gold) */
    color?: "gold" | "blue" | "red" | "green";
}

interface CountdownRingWithDurationProps extends CountdownRingProps {
    /** Duration in seconds */
    duration: number;
    /** Auto-start the countdown */
    autoStart?: boolean;
    /** Callback when countdown completes */
    onComplete?: () => void;
}

interface CountdownRingWithExpiryProps extends CountdownRingProps {
    /** Unix timestamp (ms) when the countdown expires */
    expiresAt: number;
    /** Total duration in seconds (for calculating progress) */
    totalDuration: number;
    /** Callback when countdown completes */
    onComplete?: () => void;
}

const colorMap = {
    gold: "#d4af37",
    blue: "#3b82f6",
    red: "#dc2626",
    green: "#16a34a",
};

/**
 * CountdownRing - A visual countdown timer ring
 * 
 * Uses the useCountdown hook to provide a real-time animated countdown ring.
 * 
 * @example
 * ```tsx
 * <CountdownRing duration={30} autoStart onComplete={() => alert('Done!')} />
 * ```
 */
export function CountdownRing({
    duration,
    size = 80,
    strokeWidth = 4,
    color = "gold",
    autoStart = false,
    onComplete,
}: CountdownRingWithDurationProps) {
    const { timeRemaining, strokeDashoffset, isRunning } = useCountdown({
        duration,
        autoStart,
        onComplete,
    });

    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const normalizedOffset = (strokeDashoffset / 283) * circumference;

    return (
        <div className="countdown-container inline-flex flex-col items-center">
            <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
                <svg
                    viewBox={`0 0 ${size} ${size}`}
                    width={size}
                    height={size}
                    className="countdown-svg absolute inset-0"
                >
                    {/* Background ring */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="transparent"
                        stroke="#1a1d30"
                        strokeWidth={strokeWidth}
                    />
                    {/* Progress ring */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="transparent"
                        stroke={colorMap[color]}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={normalizedOffset}
                        style={{
                            transform: "rotate(-90deg)",
                            transformOrigin: "center",
                            transition: "stroke-dashoffset 0.1s linear",
                        }}
                    />
                </svg>
                <span className="text-2xl font-bold text-white z-10">
                    {timeRemaining}
                </span>
            </div>
            <span className="text-xs text-gray-500 mt-1">
                {isRunning ? "seconds remaining" : "paused"}
            </span>
        </div>
    );
}

/**
 * CountdownRingFromExpiry - Countdown ring that syncs with a server timestamp
 * 
 * Use this when you have an expiry timestamp from the server (e.g., banker offer expires).
 * 
 * @example
 * ```tsx
 * const offerExpiresAt = Date.now() + 30000; // From server
 * <CountdownRingFromExpiry expiresAt={offerExpiresAt} totalDuration={30} />
 * ```
 */
export function CountdownRingFromExpiry({
    expiresAt,
    totalDuration,
    size = 80,
    strokeWidth = 4,
    color = "gold",
    onComplete,
}: CountdownRingWithExpiryProps) {
    const { timeRemaining, strokeDashoffset, isRunning } = useCountdownFromExpiry({
        expiresAt,
        totalDuration,
        onComplete,
    });

    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const normalizedOffset = (strokeDashoffset / 283) * circumference;

    return (
        <div className="countdown-container inline-flex flex-col items-center">
            <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
                <svg
                    viewBox={`0 0 ${size} ${size}`}
                    width={size}
                    height={size}
                    className="countdown-svg absolute inset-0"
                >
                    {/* Background ring */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="transparent"
                        stroke="#1a1d30"
                        strokeWidth={strokeWidth}
                    />
                    {/* Progress ring */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="transparent"
                        stroke={colorMap[color]}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={normalizedOffset}
                        style={{
                            transform: "rotate(-90deg)",
                            transformOrigin: "center",
                            transition: "stroke-dashoffset 0.1s linear",
                        }}
                    />
                </svg>
                <span className="text-2xl font-bold text-white z-10">
                    {timeRemaining}
                </span>
            </div>
            <span className="text-xs text-gray-500 mt-1">
                {isRunning ? "seconds remaining" : "expired"}
            </span>
        </div>
    );
}
