"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseCountdownOptions {
    /** Duration in seconds */
    duration: number;
    /** Optional callback when countdown completes */
    onComplete?: () => void;
    /** Auto-start the countdown (default: false) */
    autoStart?: boolean;
}

interface UseCountdownReturn {
    /** Time remaining in seconds */
    timeRemaining: number;
    /** Progress value 0-1 (1 = full, 0 = empty) */
    progress: number;
    /** Whether countdown is currently running */
    isRunning: boolean;
    /** Start or resume the countdown */
    start: () => void;
    /** Pause the countdown */
    pause: () => void;
    /** Reset to initial duration */
    reset: () => void;
    /** CSS custom property value for stroke-dashoffset (0-283) */
    strokeDashoffset: number;
}

/**
 * useCountdown - A hook for countdown timer functionality
 * 
 * Provides countdown state and controls for the countdown ring animation.
 * The strokeDashoffset value can be applied directly to an SVG circle.
 * 
 * @example
 * ```tsx
 * const { timeRemaining, strokeDashoffset, isRunning, start } = useCountdown({
 *   duration: 30,
 *   onComplete: () => console.log('Time up!'),
 *   autoStart: true,
 * });
 * 
 * return (
 *   <svg viewBox="0 0 100 100" width="80" height="80">
 *     <circle cx="50" cy="50" r="45" fill="transparent" stroke="#1a1d30" strokeWidth="4" />
 *     <circle
 *       cx="50"
 *       cy="50"
 *       r="45"
 *       fill="transparent"
 *       stroke="#d4af37"
 *       strokeWidth="4"
 *       strokeLinecap="round"
 *       strokeDasharray="283"
 *       strokeDashoffset={strokeDashoffset}
 *       style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
 *     />
 *   </svg>
 * );
 * ```
 */
export function useCountdown({
    duration,
    onComplete,
    autoStart = false,
}: UseCountdownOptions): UseCountdownReturn {
    const [timeRemaining, setTimeRemaining] = useState(duration);
    const [isRunning, setIsRunning] = useState(autoStart);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const onCompleteRef = useRef(onComplete);

    // Keep onComplete ref updated
    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    // Clear interval on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    // Handle countdown logic
    useEffect(() => {
        if (!isRunning) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        intervalRef.current = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 0.1) {
                    setIsRunning(false);
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                    }
                    onCompleteRef.current?.();
                    return 0;
                }
                return prev - 0.1;
            });
        }, 100);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isRunning]);

    const start = useCallback(() => {
        if (timeRemaining > 0) {
            setIsRunning(true);
        }
    }, [timeRemaining]);

    const pause = useCallback(() => {
        setIsRunning(false);
    }, []);

    const reset = useCallback(() => {
        setIsRunning(false);
        setTimeRemaining(duration);
    }, [duration]);

    // Calculate progress (1 = full, 0 = empty)
    const progress = Math.max(0, Math.min(1, timeRemaining / duration));

    // SVG circle circumference for r=45 is ~283
    // strokeDashoffset: 0 = full circle, 283 = empty circle
    const strokeDashoffset = (1 - progress) * 283;

    return {
        timeRemaining: Math.ceil(timeRemaining),
        progress,
        isRunning,
        start,
        pause,
        reset,
        strokeDashoffset,
    };
}

/**
 * useCountdownFromExpiry - Calculate countdown from an expiry timestamp
 * 
 * @example
 * ```tsx
 * const expiresAt = Date.now() + 30000; // 30 seconds from now
 * const { timeRemaining, strokeDashoffset } = useCountdownFromExpiry({
 *   expiresAt,
 *   totalDuration: 30,
 * });
 * ```
 */
export function useCountdownFromExpiry({
    expiresAt,
    totalDuration,
    onComplete,
}: {
    /** Unix timestamp (ms) when the countdown expires */
    expiresAt: number;
    /** Total duration in seconds (for calculating progress) */
    totalDuration: number;
    /** Optional callback when countdown completes */
    onComplete?: () => void;
}): UseCountdownReturn {
    const [isMounted, setIsMounted] = useState(false);
    const [, forceUpdate] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const hasCompletedRef = useRef(false);

    useEffect(() => {
        setIsMounted(true);
        hasCompletedRef.current = false;

        intervalRef.current = setInterval(() => {
            if (document.hidden) return; // Pause updates when tab is hidden to save resources

            const now = Date.now();
            if (now >= expiresAt && !hasCompletedRef.current) {
                hasCompletedRef.current = true;
                onComplete?.();
            }
            forceUpdate((n) => n + 1);
        }, 100);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [expiresAt, onComplete]);

    // Initial server-side/hydration render
    if (!isMounted) {
        return {
            timeRemaining: totalDuration,
            progress: 1, // Full circle
            isRunning: false,
            start: () => { },
            pause: () => { },
            reset: () => { },
            strokeDashoffset: 0, // Full circle
        };
    }

    const now = Date.now();
    const msRemaining = Math.max(0, expiresAt - now);
    const timeRemaining = msRemaining / 1000;
    const progress = Math.max(0, Math.min(1, timeRemaining / totalDuration));
    const strokeDashoffset = (1 - progress) * 283;

    return {
        timeRemaining: Math.ceil(timeRemaining),
        progress,
        isRunning: msRemaining > 0,
        start: () => { },
        pause: () => { },
        reset: () => { },
        strokeDashoffset,
    };
}
