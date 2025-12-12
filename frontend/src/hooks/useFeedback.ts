"use client";

import { useCallback, useRef, useEffect } from "react";

/**
 * Feedback hooks for audio and haptic feedback
 * 
 * Design-ready hooks that provide:
 * - Audio cues via Web Audio API (placeholder tones until real assets provided)
 * - Haptic feedback via Navigator.vibrate()
 * - Graceful degradation when features unavailable
 * - Respects reduced-motion preference
 */

interface FeedbackHooks {
    /** Play box open sound - short click/thunk */
    playBoxOpen: () => void;
    /** Play banker chime - phone ring sound */
    playBankerChime: () => void;
    /** Play offer appear - bass whoosh for offer display */
    playOfferAppear: () => void;
    /** Play victory sound - celebration flourish */
    playVictory: () => void;
    /** Trigger haptic vibration (pattern in ms) */
    vibrate: (pattern?: number | number[]) => void;
    /** Whether audio is available and initialized */
    audioReady: boolean;
    /** Whether haptics are available on this device */
    hapticsAvailable: boolean;
}

/**
 * Create a simple tone using Web Audio API
 * Placeholder until real audio assets are provided
 */
function createTone(
    audioContext: AudioContext,
    frequency: number,
    duration: number,
    type: OscillatorType = "sine",
    gain: number = 0.3
): void {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

    // Fade in/out to avoid clicks
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(gain, audioContext.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

/**
 * useFeedback - Hook for audio and haptic feedback
 * 
 * @example
 * ```tsx
 * function BoxComponent({ onOpen }) {
 *   const { playBoxOpen, vibrate } = useFeedback();
 *   
 *   const handleClick = () => {
 *     playBoxOpen();
 *     vibrate(50);
 *     onOpen();
 *   };
 *   
 *   return <button onClick={handleClick}>Open Box</button>;
 * }
 * ```
 */
export function useFeedback(): FeedbackHooks {
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioReadyRef = useRef(false);
    const reducedMotionRef = useRef(false);

    // Check for reduced motion preference
    useEffect(() => {
        const query = window.matchMedia("(prefers-reduced-motion: reduce)");
        reducedMotionRef.current = query.matches;

        // Also check if the app has the .reduced-motion class
        const checkAppClass = () => {
            reducedMotionRef.current =
                query.matches ||
                document.body.classList.contains("reduced-motion");
        };

        const observer = new MutationObserver(checkAppClass);
        observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });

        const handleChange = (e: MediaQueryListEvent) => {
            reducedMotionRef.current = e.matches || document.body.classList.contains("reduced-motion");
        };

        query.addEventListener("change", handleChange);
        checkAppClass();

        return () => {
            query.removeEventListener("change", handleChange);
            observer.disconnect();
        };
    }, []);

    // Initialize audio context on first user interaction
    const initAudio = useCallback(() => {
        if (audioContextRef.current) return true;

        try {
            const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (!AudioContextClass) {
                console.warn("[useFeedback] Web Audio API not supported");
                return false;
            }
            audioContextRef.current = new AudioContextClass();
            audioReadyRef.current = true;
            return true;
        } catch (error) {
            console.warn("[useFeedback] Failed to initialize AudioContext:", error);
            return false;
        }
    }, []);

    // Resume audio context if suspended (required after user interaction)
    const resumeAudio = useCallback(async () => {
        if (!audioContextRef.current) return false;

        if (audioContextRef.current.state === "suspended") {
            try {
                await audioContextRef.current.resume();
            } catch (error) {
                console.warn("[useFeedback] Failed to resume AudioContext:", error);
                return false;
            }
        }
        return true;
    }, []);

    /**
     * Play box open sound - short click/thunk
     * Placeholder: 80Hz square wave, 50ms
     */
    const playBoxOpen = useCallback(async () => {
        if (!initAudio()) return;
        if (!await resumeAudio()) return;
        if (!audioContextRef.current) return;

        try {
            // Short percussive thunk
            createTone(audioContextRef.current, 80, 0.05, "square", 0.2);
            createTone(audioContextRef.current, 120, 0.03, "triangle", 0.15);
        } catch (error) {
            console.warn("[useFeedback] playBoxOpen failed:", error);
        }
    }, [initAudio, resumeAudio]);

    /**
     * Play banker chime - phone ring sound
     * Placeholder: Two-tone chime (440Hz + 554Hz)
     */
    const playBankerChime = useCallback(async () => {
        if (!initAudio()) return;
        if (!await resumeAudio()) return;
        if (!audioContextRef.current) return;

        try {
            // Two-tone phone chime
            const ctx = audioContextRef.current;
            createTone(ctx, 440, 0.15, "sine", 0.25);
            setTimeout(() => {
                if (audioContextRef.current) {
                    createTone(audioContextRef.current, 554, 0.15, "sine", 0.25);
                }
            }, 150);
        } catch (error) {
            console.warn("[useFeedback] playBankerChime failed:", error);
        }
    }, [initAudio, resumeAudio]);

    /**
     * Play offer appear sound - bass whoosh
     * Placeholder: Rising bass sweep from 60Hz to 120Hz
     */
    const playOfferAppear = useCallback(async () => {
        if (!initAudio()) return;
        if (!await resumeAudio()) return;
        if (!audioContextRef.current) return;

        try {
            const ctx = audioContextRef.current;
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(60, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.3);

            gainNode.gain.setValueAtTime(0, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.1);
            gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.4);
        } catch (error) {
            console.warn("[useFeedback] playOfferAppear failed:", error);
        }
    }, [initAudio, resumeAudio]);

    /**
     * Play victory sound - celebration flourish
     * Placeholder: Rising arpeggio (C-E-G-C)
     */
    const playVictory = useCallback(async () => {
        if (!initAudio()) return;
        if (!await resumeAudio()) return;
        if (!audioContextRef.current) return;

        try {
            const ctx = audioContextRef.current;
            // Arpeggio: C4-E4-G4-C5
            const notes = [261.63, 329.63, 392.00, 523.25];
            const duration = 0.15;

            notes.forEach((freq, i) => {
                setTimeout(() => {
                    if (audioContextRef.current) {
                        createTone(audioContextRef.current, freq, duration * 1.5, "triangle", 0.3);
                    }
                }, i * (duration * 1000));
            });
        } catch (error) {
            console.warn("[useFeedback] playVictory failed:", error);
        }
    }, [initAudio, resumeAudio]);

    /**
     * Trigger haptic vibration
     * @param pattern - Duration in ms, or array of durations [vibrate, pause, vibrate, ...]
     */
    const vibrate = useCallback((pattern: number | number[] = 50) => {
        // Skip haptics if reduced motion is enabled
        if (reducedMotionRef.current) return;

        if (!("vibrate" in navigator)) {
            // Silently skip - haptics not available
            return;
        }

        try {
            navigator.vibrate(pattern);
        } catch (error) {
            // Some browsers throw on vibrate, silently ignore
        }
    }, []);

    // Check haptics availability
    const hapticsAvailable = typeof navigator !== "undefined" && "vibrate" in navigator;

    return {
        playBoxOpen,
        playBankerChime,
        playOfferAppear,
        playVictory,
        vibrate,
        audioReady: audioReadyRef.current,
        hapticsAvailable,
    };
}

/**
 * Default vibration patterns for common feedback types
 */
export const VIBRATION_PATTERNS = {
    /** Single short pulse for button taps */
    TAP: 50,
    /** Double pulse for confirmations */
    CONFIRM: [50, 50, 100],
    /** Triple pulse for errors/warnings */
    ERROR: [100, 50, 100, 50, 100],
    /** Long pulse for victory/celebration */
    VICTORY: [50, 50, 50, 50, 200],
    /** Short buzz for box open */
    BOX_OPEN: [30, 20, 50],
} as const;

export default useFeedback;
