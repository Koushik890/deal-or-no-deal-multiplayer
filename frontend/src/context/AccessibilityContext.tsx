"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

/**
 * AccessibilityContext - Provides app-wide accessibility controls
 * 
 * Features:
 * - High-contrast mode toggle
 * - Reduced-motion mode toggle
 * - Persists preferences to localStorage
 * - Respects system preferences as defaults
 * - Applies CSS classes to document body
 */

interface AccessibilityContextValue {
    /** Whether high-contrast mode is enabled */
    highContrast: boolean;
    /** Whether reduced-motion mode is enabled */
    reducedMotion: boolean;
    /** Toggle high-contrast mode */
    setHighContrast: (value: boolean) => void;
    /** Toggle reduced-motion mode */
    setReducedMotion: (value: boolean) => void;
    /** Toggle high-contrast mode (convenience) */
    toggleHighContrast: () => void;
    /** Toggle reduced-motion mode (convenience) */
    toggleReducedMotion: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | undefined>(undefined);

const STORAGE_KEY_HIGH_CONTRAST = "dond-high-contrast";
const STORAGE_KEY_REDUCED_MOTION = "dond-reduced-motion";

interface AccessibilityProviderProps {
    children: ReactNode;
}

/**
 * AccessibilityProvider - Wraps children with accessibility context
 * 
 * Add to root layout to enable accessibility toggles app-wide:
 * ```tsx
 * <AccessibilityProvider>
 *   {children}
 * </AccessibilityProvider>
 * ```
 */
export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
    // Initialize with null to detect SSR vs client
    const [highContrast, setHighContrastState] = useState(false);
    const [reducedMotion, setReducedMotionState] = useState(false);
    const [isClient, setIsClient] = useState(false);

    // Detect system preferences and load stored values on mount
    useEffect(() => {
        setIsClient(true);

        // Check system preferences
        const prefersHighContrast = window.matchMedia("(prefers-contrast: more)").matches;
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        // Load from localStorage or fall back to system preference
        const storedHighContrast = localStorage.getItem(STORAGE_KEY_HIGH_CONTRAST);
        const storedReducedMotion = localStorage.getItem(STORAGE_KEY_REDUCED_MOTION);

        setHighContrastState(
            storedHighContrast !== null
                ? storedHighContrast === "true"
                : prefersHighContrast
        );
        setReducedMotionState(
            storedReducedMotion !== null
                ? storedReducedMotion === "true"
                : prefersReducedMotion
        );

        // Listen for system preference changes
        const highContrastQuery = window.matchMedia("(prefers-contrast: more)");
        const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

        const handleHighContrastChange = (e: MediaQueryListEvent) => {
            // Only update if no stored preference
            if (localStorage.getItem(STORAGE_KEY_HIGH_CONTRAST) === null) {
                setHighContrastState(e.matches);
            }
        };

        const handleReducedMotionChange = (e: MediaQueryListEvent) => {
            // Only update if no stored preference
            if (localStorage.getItem(STORAGE_KEY_REDUCED_MOTION) === null) {
                setReducedMotionState(e.matches);
            }
        };

        highContrastQuery.addEventListener("change", handleHighContrastChange);
        reducedMotionQuery.addEventListener("change", handleReducedMotionChange);

        return () => {
            highContrastQuery.removeEventListener("change", handleHighContrastChange);
            reducedMotionQuery.removeEventListener("change", handleReducedMotionChange);
        };
    }, []);

    // Apply CSS classes to body when preferences change
    useEffect(() => {
        if (!isClient) return;

        // Apply high-contrast class
        document.body.classList.toggle("high-contrast", highContrast);

        // Apply reduced-motion class
        document.body.classList.toggle("reduced-motion", reducedMotion);

        // Persist to localStorage
        localStorage.setItem(STORAGE_KEY_HIGH_CONTRAST, String(highContrast));
        localStorage.setItem(STORAGE_KEY_REDUCED_MOTION, String(reducedMotion));
    }, [highContrast, reducedMotion, isClient]);

    const setHighContrast = useCallback((value: boolean) => {
        setHighContrastState(value);
    }, []);

    const setReducedMotion = useCallback((value: boolean) => {
        setReducedMotionState(value);
    }, []);

    const toggleHighContrast = useCallback(() => {
        setHighContrastState(prev => !prev);
    }, []);

    const toggleReducedMotion = useCallback(() => {
        setReducedMotionState(prev => !prev);
    }, []);

    const value: AccessibilityContextValue = {
        highContrast,
        reducedMotion,
        setHighContrast,
        setReducedMotion,
        toggleHighContrast,
        toggleReducedMotion,
    };

    return (
        <AccessibilityContext.Provider value={value}>
            {children}
        </AccessibilityContext.Provider>
    );
}

/**
 * useAccessibility - Hook to access accessibility context
 * 
 * @throws Error if used outside of AccessibilityProvider
 * 
 * @example
 * ```tsx
 * function SettingsPanel() {
 *   const { highContrast, toggleHighContrast, reducedMotion, toggleReducedMotion } = useAccessibility();
 *   
 *   return (
 *     <div>
 *       <button onClick={toggleHighContrast}>
 *         High Contrast: {highContrast ? "ON" : "OFF"}
 *       </button>
 *       <button onClick={toggleReducedMotion}>
 *         Reduced Motion: {reducedMotion ? "ON" : "OFF"}
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAccessibility(): AccessibilityContextValue {
    const context = useContext(AccessibilityContext);
    if (context === undefined) {
        throw new Error("useAccessibility must be used within an AccessibilityProvider");
    }
    return context;
}

export default AccessibilityProvider;
