"use client";

import { useEffect, useState, useCallback } from "react";

/**
 * useVisibilityPause - Pause non-essential operations when tab is hidden
 * 
 * Saves battery on mobile by pausing animations and timers when the user
 * switches to another tab or minimizes the browser.
 * 
 * @returns {boolean} isVisible - Whether the tab is currently visible
 * 
 * @example
 * function AnimatedComponent() {
 *   const isVisible = useVisibilityPause();
 *   
 *   return (
 *     <div className={isVisible ? "animate-pulse" : ""}>
 *       Content
 *     </div>
 *   );
 * }
 */
export function useVisibilityPause(): boolean {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Check initial visibility
        setIsVisible(!document.hidden);

        const handleVisibilityChange = () => {
            setIsVisible(!document.hidden);
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    return isVisible;
}

/**
 * useAnimationPause - Apply/remove pause class based on tab visibility
 * 
 * Automatically adds `.animations-paused` class to body when tab is hidden.
 * Use with CSS: `.animations-paused * { animation-play-state: paused !important; }`
 */
export function useAnimationPause(): void {
    useEffect(() => {
        const handleVisibilityChange = () => {
            document.body.classList.toggle("animations-paused", document.hidden);
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            document.body.classList.remove("animations-paused");
        };
    }, []);
}

/**
 * usePausableInterval - Interval that pauses when tab is hidden
 * 
 * @param callback - Function to call on each interval
 * @param delay - Interval delay in milliseconds (null to pause)
 * 
 * @example
 * usePausableInterval(() => {
 *   setSeconds(s => s - 1);
 * }, isVisible ? 1000 : null);
 */
export function usePausableInterval(
    callback: () => void,
    delay: number | null
): void {
    useEffect(() => {
        if (delay === null) return;

        const id = setInterval(callback, delay);
        return () => clearInterval(id);
    }, [callback, delay]);
}
