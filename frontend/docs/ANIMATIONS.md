# Animation Strategy & Visual Effects

This document outlines the animation strategies used in the frontend application, specifically focusing on complex visual effects and accessibility support.

## Key Components

### 1. BoxPodium Reveal
The `BoxPodium` component uses a hybrid animation approach to potential "explosion" reveal effects while ensuring broad compatibility.

#### Strategy
1.  **Primary**: Web Animations API (WAAPI). This provides the highest fidelity, GPU-accelerated keyframe animations for the 3D rotation and glow effects.
2.  **Fallback**: CSS Animation (`.box-podium-reveal-fallback`). Used if `element.animate` is undefined (e.g., older environments or some test runners).
3.  **Accessibility**: Fully respects `prefers-reduced-motion`. If enabled, all animations are skipped.

#### Control Logic
```typescript
// BoxPodium.tsx
if (prefersReducedMotion) {
    // 1. Accessibility: Skip
    onRevealComplete?.();
} else if (boxRef.current.animate) {
    // 2. Modern: WAAPI
    animationRef.current = boxRef.current.animate(keyframes, timing);
    // ...
} else {
    // 3. Legacy/Fallback: CSS Class
    boxRef.current.classList.add('box-podium-reveal-fallback');
    // ...
}
```

### 2. Countdown Timer Precision
The countdown animations (e.g., `OfferZone`, `BankerScreen`) need to remain accurate even if the user backgrounds the tab.

#### Drift Prevention
-   **Hook**: `useCountdownFromExpiry`
-   **Mechanism**: Instead of decrementing a counter every second (which pauses when backgrounded), we calculate `remaining = expiresAt - Date.now()` on every frame/tick.
-   **Resource Saving**: The interval loop checks `document.hidden`. If true, it returns early to save CPU cycles. When the tab becomes visible again, the very next tick recalculates using `Date.now()`, instantly syncing the visual state to the correct "wall clock" time.

### 3. Feature Detection
To feature-detect WAAPI support in other components, use:
```typescript
const supportsWAAPI = typeof Element !== 'undefined' && typeof Element.prototype.animate === 'function';
```

## Reduced Motion
All visual components must check the media query:
```typescript
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
```

If true:
-   Skip entrance/exit animations.
-   Disable continuous pulsing/shimmering.
-   Use static high-contrast states instead of subtle gradients.

## Component Imports

Use canonical imports from the components barrel file to reduce integration friction:

```typescript
import { OfferZone, BankerScreen, BoxPodium } from '@/components';
```

All animation-enabled components are exported from this barrel file, including:
- `OfferZone` - Banker offer display with countdown
- `BankerScreen` - Phone ringing animation background
- `BoxPodium` - Box reveal with 3D rotation effects
- `CountdownRing`, `CountdownRingFromExpiry` - Timer animations
