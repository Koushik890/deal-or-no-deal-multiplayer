"use client";

import { useAnimationPause } from "@/hooks/useVisibility";

/**
 * AnimationPauseProvider - Pauses animations when tab is hidden
 * 
 * Add to root layout to automatically pause all animations when the
 * browser tab is hidden. This saves battery on mobile devices during
 * long game sessions.
 */
export function AnimationPauseProvider() {
    useAnimationPause();
    return null;
}
