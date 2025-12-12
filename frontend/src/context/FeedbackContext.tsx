/**
 * Feedback Context - Audio and Haptics management
 * 
 * Centralised audio/haptic feedback with user preferences
 */

'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

type SoundType = 'box-open' | 'banker-chime' | 'offer-thump' | 'victory';

interface FeedbackContextValue {
    soundEnabled: boolean;
    hapticsEnabled: boolean;
    setSoundEnabled: (enabled: boolean) => void;
    setHapticsEnabled: (enabled: boolean) => void;
    playSound: (sound: SoundType) => void;
    vibrate: (pattern?: number | number[]) => void;
    supportsHaptics: boolean;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

// Audio cache to prevent reloading
const audioCache: Map<string, HTMLAudioElement> = new Map();

function getAudio(sound: SoundType): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null;

    const cached = audioCache.get(sound);
    if (cached) return cached;

    // Audio files expected in /public/sfx/
    // box-open.mp3, banker-chime.mp3, offer-thump.mp3, victory.mp3
    const audio = new Audio(`/sfx/${sound}.mp3`);
    audio.preload = 'auto';
    audio.volume = 0.5;
    audioCache.set(sound, audio);

    return audio;
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
    const [soundEnabled, setSoundEnabledState] = useState(true);
    const [hapticsEnabled, setHapticsEnabledState] = useState(true);
    const [supportsHaptics, setSupportsHaptics] = useState(false);

    // Load preferences from localStorage on mount
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const storedSound = localStorage.getItem('dealornodeal_sound');
        const storedHaptics = localStorage.getItem('dealornodeal_haptics');

        if (storedSound !== null) {
            setSoundEnabledState(storedSound === 'true');
        }
        if (storedHaptics !== null) {
            setHapticsEnabledState(storedHaptics === 'true');
        }

        // Check haptics support
        setSupportsHaptics('vibrate' in navigator);

        // Preload common sounds
        ['box-open', 'banker-chime'].forEach(sound => {
            getAudio(sound as SoundType);
        });
    }, []);

    const setSoundEnabled = useCallback((enabled: boolean) => {
        setSoundEnabledState(enabled);
        if (typeof window !== 'undefined') {
            localStorage.setItem('dealornodeal_sound', String(enabled));
        }
    }, []);

    const setHapticsEnabled = useCallback((enabled: boolean) => {
        setHapticsEnabledState(enabled);
        if (typeof window !== 'undefined') {
            localStorage.setItem('dealornodeal_haptics', String(enabled));
        }
    }, []);

    const playSound = useCallback((sound: SoundType) => {
        if (!soundEnabled) return;

        const audio = getAudio(sound);
        if (!audio) return;

        // Clone and play to allow overlapping sounds
        audio.currentTime = 0;
        audio.play().catch((err) => {
            // Silently fail - user hasn't interacted yet
            console.debug(`[Feedback] Could not play sound ${sound}:`, err.message);
        });
    }, [soundEnabled]);

    const vibrate = useCallback((pattern?: number | number[]) => {
        if (!hapticsEnabled || !supportsHaptics) return;

        try {
            navigator.vibrate(pattern || 50);
        } catch (err) {
            // Haptics not supported or blocked
        }
    }, [hapticsEnabled, supportsHaptics]);

    return (
        <FeedbackContext.Provider value={{
            soundEnabled,
            hapticsEnabled,
            setSoundEnabled,
            setHapticsEnabled,
            playSound,
            vibrate,
            supportsHaptics,
        }}>
            {children}
        </FeedbackContext.Provider>
    );
}

export function useFeedback(): FeedbackContextValue {
    const ctx = useContext(FeedbackContext);
    if (!ctx) {
        throw new Error('useFeedback must be used within FeedbackProvider');
    }
    return ctx;
}

// Optional hook that returns no-ops if not within provider (for components that may be used outside)
export function useFeedbackOptional(): FeedbackContextValue {
    const ctx = useContext(FeedbackContext);
    if (!ctx) {
        return {
            soundEnabled: false,
            hapticsEnabled: false,
            setSoundEnabled: () => { },
            setHapticsEnabled: () => { },
            playSound: () => { },
            vibrate: () => { },
            supportsHaptics: false,
        };
    }
    return ctx;
}
