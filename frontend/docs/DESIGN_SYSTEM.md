# Deal or No Deal – TV Studio Design System

A comprehensive design system for the Deal or No Deal UK Multiplayer game, featuring a dark TV studio aesthetic with glow effects, glass panels, and premium animations.

## Project Structure

This project uses Next.js with the `src/` directory structure:

```
frontend/
├── src/
│   └── app/
│       ├── layout.tsx      # Root layout (imports studio.css)
│       ├── page.tsx        # Demo page
│       ├── globals.css     # Tailwind imports
│       └── studio.css      # TV studio utilities
├── public/
│   └── svg/                # SVG assets
├── docs/
│   └── DESIGN_SYSTEM.md    # This file
└── tailwind.config.js      # Theme tokens & animations
```

> [!NOTE]
> The Tailwind config supports both `src/app/` and root-level `app/` paths for flexibility.

## Colour Palette

### Studio Backgrounds (Navy/Black)
| Token | Hex | Usage |
|-------|-----|-------|
| `studio-900` | `#0a0b14` | Deepest background |
| `studio-800` | `#0d0f1a` | Primary background |
| `studio-700` | `#121525` | Elevated surfaces |
| `studio-600` | `#1a1d30` | Cards/panels |
| `studio-500` | `#242840` | Subtle borders |

### Primary (Royal Blue)
| Token | Hex | Usage |
|-------|-----|-------|
| `primary-600` | `#2563eb` | Primary actions |
| `primary-700` | `#1d4ed8` | Hover states |
| `primary-800` | `#1e40af` | Box backgrounds |

### Accent (Metallic Gold)
| Token | Hex | Usage |
|-------|-----|-------|
| `gold-DEFAULT` | `#d4af37` | Highlights, borders |
| `gold-300` | `#fde047` | Light accents |
| `gold-700` | `#9a7d25` | Dark accents |

### Secondary (Red/Green)
| Token | Hex | Usage |
|-------|-----|-------|
| `danger-600` | `#dc2626` | Deal button, warnings |
| `success-600` | `#16a34a` | No Deal button, success |

---

## Typography

### Font Stacks

| Font | Variable | Tailwind Class | Usage |
|------|----------|----------------|-------|
| **Outfit** | `--font-display` | `font-display` | Headings, titles, money values |
| **Inter** | `--font-body` | `font-body` | Body text, UI elements |
| **System Mono** | — | `font-mono` | Numbers, codes |

### Usage Examples

```tsx
// Headings use display font automatically
<h1 className="text-4xl font-bold">Deal or No Deal</h1>

// Explicit display font for money values
<span className="font-display text-3xl font-extrabold">£250,000</span>

// Body text (default)
<p className="font-body text-base">Choose your box wisely...</p>

// Monospace for technical values
<span className="font-mono text-sm">Room: ABC123</span>
```

### Typography Scale

| Class | Size | Usage |
|-------|------|-------|
| `text-xs` | 0.75rem | Labels, hints |
| `text-sm` | 0.875rem | Secondary text |
| `text-base` | 1rem | Body text |
| `text-lg` | 1.125rem | Emphasized body |
| `text-xl` | 1.25rem | Small headings |
| `text-2xl` | 1.5rem | Section headings |
| `text-3xl` | 1.875rem | Page titles |
| `text-4xl` | 2.25rem | Hero text |
| `text-5xl` | 3rem | Impact displays |

---

## CSS Utilities

### Background Classes
```html
<!-- Full studio background with spotlight -->
<div class="studio-bg">Content</div>
```

### Glass Panels
```html
<!-- Standard glass panel -->
<div class="glass">Panel content</div>

<!-- Darker glass -->
<div class="glass-dark">Dark panel</div>

<!-- Gold-tinted glass -->
<div class="glass-gold">Special panel</div>
```

### Glow Effects
```html
<!-- Box shadow glows -->
<div class="glow-gold">Gold glow</div>
<div class="glow-blue">Blue glow</div>
<div class="glow-red">Red glow</div>
<div class="glow-green">Green glow</div>

<!-- Animated gold pulse -->
<div class="glow-gold-pulse">Pulsing glow</div>

<!-- Text glows -->
<span class="text-glow-gold">Golden text</span>
<span class="text-glow-blue">Blue text</span>
```

### Spotlight Overlays
```html
<div class="spotlight">Standard spotlight</div>
<div class="spotlight spotlight-gold">Gold spotlight</div>
<div class="spotlight spotlight-blue">Blue spotlight</div>
```

### Shimmer Text
```html
<span class="shimmer-text">£250,000</span>
```

### Sweep Overlay
```html
<div class="sweep-overlay">Sweeping highlight effect</div>
```

---

## Component Classes

### Box Podium
```html
<div class="box-podium">1</div>
<div class="box-podium selected">2</div>
<div class="box-podium opened">3</div>
```

### Value Chips
```html
<span class="value-chip active high">£250,000</span>
<span class="value-chip active low">£0.01</span>
<span class="value-chip eliminated">£50,000</span>
```

### Banker Offer
```html
<div class="banker-offer">
  <p>The Banker Offers</p>
  <span class="banker-amount">£42,500</span>
</div>
```

### Deal/No Deal Buttons
```html
<button class="btn-deal">Deal</button>
<button class="btn-no-deal">No Deal</button>
```

### Leaderboard
```html
<div class="leaderboard-panel">
  <div class="leaderboard-row top-3">
    <span class="leaderboard-rank gold">1</span>
    <span>PlayerName</span>
    <span>£250,000</span>
  </div>
  <div class="leaderboard-row top-3">
    <span class="leaderboard-rank silver">2</span>
    ...
  </div>
  <div class="leaderboard-row top-3">
    <span class="leaderboard-rank bronze">3</span>
    ...
  </div>
</div>
```

### Countdown Ring

The countdown ring uses a React hook for real-time progress updates. Two approaches are available:

**Option 1: Duration-based (local timer)**
```tsx
import { CountdownRing } from "@/components/CountdownRing";

<CountdownRing 
  duration={30} 
  autoStart 
  onComplete={() => console.log('Time up!')} 
/>
```

**Option 2: Expiry-based (server sync)**
```tsx
import { CountdownRingFromExpiry } from "@/components/CountdownRing";

// expiresAt comes from server (e.g., banker offer deadline)
const offerExpiresAt = Date.now() + 30000;

<CountdownRingFromExpiry 
  expiresAt={offerExpiresAt} 
  totalDuration={30}
  onComplete={() => handleOfferExpired()} 
/>
```

**Using the hook directly:**
```tsx
import { useCountdown } from "@/hooks/useCountdown";

const { timeRemaining, strokeDashoffset, start, pause, reset } = useCountdown({
  duration: 30,
  autoStart: true,
});

// Apply strokeDashoffset to SVG circle (0 = full, 283 = empty)
<circle 
  strokeDasharray="283" 
  strokeDashoffset={strokeDashoffset} 
/>
```

---

## Animations

### Tailwind Animation Utilities

All animations are defined in both `tailwind.config.js` (via `theme.extend.keyframes`) and `studio.css` (explicit `@keyframes`) to ensure they survive CSS purging.

| Tailwind Class | CSS Class Alternative | Effect | Duration |
|----------------|----------------------|--------|----------|
| `animate-pulse-glow` | `.glow-gold-pulse` | Pulsing gold glow | 2s infinite |
| `animate-sweep` | `.sweep-overlay::before` | Horizontal sweep | 3s infinite |
| `animate-scorch` | — | Brightness fluctuation | 1.5s infinite |
| `animate-fade-in` | — | Fade in from below | 0.3s |
| `animate-fade-out` | — | Fade out upward | 0.3s |
| `animate-shimmer` | `.shimmer-text` | Gradient shimmer | 2s infinite |
| `animate-box-reveal` | `.box-podium.revealed` | Box flip reveal | 0.6s |
| `animate-float` | — | Gentle floating | 3s infinite |
| `animate-spin-slow` | — | Slow rotation | 8s infinite |

### Keyframe Sources

**Tailwind Config (`tailwind.config.js`):**
```js
theme: {
  extend: {
    keyframes: {
      'pulse-glow': { /* ... */ },
      'sweep': { /* ... */ },
      'scorch': { /* ... */ },
      'shimmer': { /* ... */ },
      // ... all keyframes defined here
    },
    animation: {
      'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      'sweep': 'sweep 3s ease-in-out infinite',
      // ... mapped to animate-* utilities
    }
  }
}
```

**CSS Fallback (`studio.css`):**
```css
/* Explicit @keyframes for custom CSS animations */
@keyframes pulse-glow { /* ... */ }
@keyframes sweep { /* ... */ }
@keyframes shimmer { /* ... */ }
@keyframes countdown-ring { /* ... */ }
@keyframes box-reveal { /* ... */ }
@keyframes float { /* ... */ }
@keyframes scorch { /* ... */ }
```

> [!TIP]
> Use Tailwind `animate-*` classes when possible. CSS class alternatives (`.glow-gold-pulse`, `.shimmer-text`) are provided for components that need specific animation styling.

---

## Accessibility

### High Contrast Mode

Automatically triggered via `prefers-contrast: more`. All glass effects become solid, borders thicken, and shimmer animations are disabled.

**Runtime Toggle (React):**
```tsx
"use client";
import { useState, useEffect } from "react";

export function useHighContrast() {
  const [isHighContrast, setIsHighContrast] = useState(false);
  
  useEffect(() => {
    // Apply/remove class on body
    document.body.classList.toggle("high-contrast", isHighContrast);
  }, [isHighContrast]);
  
  return { isHighContrast, setIsHighContrast };
}

// Usage in settings component
function AccessibilitySettings() {
  const { isHighContrast, setIsHighContrast } = useHighContrast();
  
  return (
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={isHighContrast}
        onChange={(e) => setIsHighContrast(e.target.checked)}
      />
      High Contrast Mode
    </label>
  );
}
```

---

### Reduced Motion

Automatically triggered via `prefers-reduced-motion: reduce`. All animations are disabled.

**Runtime Toggle (React):**
```tsx
"use client";
import { useState, useEffect } from "react";

export function useReducedMotion() {
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  
  useEffect(() => {
    // Apply/remove class on body
    document.body.classList.toggle("no-motion", isReducedMotion);
  }, [isReducedMotion]);
  
  return { isReducedMotion, setIsReducedMotion };
}

// Usage in settings component
function AccessibilitySettings() {
  const { isReducedMotion, setIsReducedMotion } = useReducedMotion();
  
  return (
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={isReducedMotion}
        onChange={(e) => setIsReducedMotion(e.target.checked)}
      />
      Reduce Motion
    </label>
  );
}
```

---

### Combined Accessibility Hook

```tsx
"use client";
import { useState, useEffect } from "react";

interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
}

export function useAccessibility() {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    reducedMotion: false,
  });
  
  useEffect(() => {
    document.body.classList.toggle("high-contrast", settings.highContrast);
    document.body.classList.toggle("no-motion", settings.reducedMotion);
  }, [settings]);
  
  const toggleHighContrast = () => 
    setSettings(s => ({ ...s, highContrast: !s.highContrast }));
  
  const toggleReducedMotion = () => 
    setSettings(s => ({ ...s, reducedMotion: !s.reducedMotion }));
  
  return { settings, toggleHighContrast, toggleReducedMotion };
}
```

---

## SVG Assets

Located in `/public/svg/`:

| File | Description |
|------|-------------|
| `banker-screen.svg` | Banker display panel with phone icon |
| `box-podium.svg` | Game box on pedestal |
| `leaderboard-panel.svg` | Ranking panel template |

Usage:
```tsx
<img src="/svg/box-podium.svg" alt="Box" className="w-16 h-20" />
```

---

## Example Page Structure

```tsx
export default function GamePage() {
  return (
    <main className="studio-bg min-h-screen p-4">
      {/* Header */}
      <header className="glass p-4 mb-6">
        <h1 className="text-2xl font-bold shimmer-text">
          Deal or No Deal
        </h1>
      </header>

      {/* Box Grid */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {boxes.map((box) => (
          <div key={box.id} className="box-podium">
            {box.number}
          </div>
        ))}
      </div>

      {/* Banker Offer */}
      <div className="banker-offer spotlight-gold mb-6">
        <p className="text-gold-300 mb-2">The Banker Offers</p>
        <span className="banker-amount">£42,500</span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <button className="btn-deal">Deal</button>
        <button className="btn-no-deal">No Deal</button>
      </div>
    </main>
  );
}
```

---

## Tailwind Config Reference

Key theme extensions in `tailwind.config.js`:
- **colours**: `studio-*`, `primary-*`, `gold-*`, `danger-*`, `success-*`
- **boxShadow**: `glow-*`, `studio-card`, `studio-elevated`
- **backgroundImage**: `studio-radial`, `studio-spotlight`, `gold-shine`, `box-gradient`
- **keyframes/animation**: `pulse-glow`, `sweep`, `scorch`, `shimmer`, `box-reveal`, `countdown`, `float`

---

## Keyboard Navigation

### Skip Links

The `<SkipLinks />` component provides keyboard shortcuts for efficient navigation:

```tsx
import { SkipLinks } from "@/components/SkipLinks";

// Add to root layout or page
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SkipLinks />
        {children}
      </body>
    </html>
  );
}
```

**Available skip links:**
- Skip to main content
- Skip to banker offer
- Skip to game boxes
- Skip to players

Links are visually hidden until focused (Tab key).

---

## Modal Focus Trap (BankerOffer)

The `BankerOffer` component implements proper modal accessibility:

### Focus Management Behaviour

1. **On modal open:**
   - Stores reference to the triggering control
   - Moves focus to the first interactive element (Deal button)

2. **During modal:**
   - Tab cycles forward through interactive elements
   - Shift+Tab cycles backward through interactive elements
   - Focus stays trapped within the modal

3. **On modal close:**
   - Focus returns to the exact triggering control

### Implementation Details

```tsx
// Focus trap handles Tab and Shift+Tab cycling
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key !== "Tab") return;

  if (e.shiftKey) {
    // Shift+Tab: wrap from first to last
    if (document.activeElement === firstElement) {
      e.preventDefault();
      lastElement?.focus();
    }
  } else {
    // Tab: wrap from last to first
    if (document.activeElement === lastElement) {
      e.preventDefault();
      firstElement?.focus();
    }
  }
};
```

### ARIA Attributes

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="banker-offer-title"
  aria-describedby="banker-offer-amount"
  tabIndex={-1}
  onKeyDown={handleKeyDown}
>
```

---

## Notification Animation Settings

### User-Facing Toggle

To reduce visual fatigue in long sessions, provide a toggle to mute notification animations:

```tsx
function NotificationSettings() {
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("notifications-muted", isMuted);
  }, [isMuted]);

  return (
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={isMuted}
        onChange={(e) => setIsMuted(e.target.checked)}
      />
      Mute notification animations
    </label>
  );
}
```

### CSS Classes

| Class | Effect |
|-------|--------|
| `.notifications-muted` | Stops ping/pulse animations, adds static glow |
| `.no-motion` | Stops all animations (reduced motion) |

> [!TIP]
> The `.notifications-muted` class only affects notification-specific animations while allowing other UI animations to continue. Use `.no-motion` to disable all animations.

---

## Cross-Browser Testing Notes

> [!IMPORTANT]
> Test the following features across browsers to ensure graceful fallbacks.

### Glass / Backdrop-Blur Effects

| Browser | Support | Fallback |
|---------|---------|----------|
| Chrome/Edge | ✅ Full | — |
| Safari 14+ | ✅ Full (with `-webkit-` prefix) | — |
| Safari iOS 12-13 | ⚠️ Partial | May need explicit `background-color` |
| Firefox | ✅ Full (v103+) | Older versions need solid background |

**Fallback Strategy:**
```css
.glass {
  /* Fallback solid background for older browsers */
  background: rgba(26, 29, 48, 0.95);
  /* Modern browsers use backdrop-filter */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

/* Feature detection fallback */
@supports not (backdrop-filter: blur(12px)) {
  .glass {
    background: rgba(26, 29, 48, 0.98);
  }
}
```

### Countdown Ring (Conic-Gradient)

The countdown ring uses `stroke-dashoffset` animation which is well-supported. If using `conic-gradient` for alternative countdown displays:

| Browser | Support |
|---------|---------|
| Chrome 69+ | ✅ Full |
| Safari 12.1+ | ✅ Full |
| Firefox 83+ | ✅ Full |
| iOS Safari 12.2+ | ✅ Full |

**Fallback for older browsers:**
```css
/* Use stroke-dasharray animation instead of conic-gradient */
.countdown-ring {
  stroke-dasharray: 283; /* 2πr where r=45 */
  stroke-dashoffset: 0;
}
```

### Testing Checklist

- [ ] **Safari iOS**: Test glass panels, check blur renders correctly
- [ ] **Firefox**: Verify backdrop-filter works (v103+), check fallback on older
- [ ] **Safari macOS**: Confirm `-webkit-backdrop-filter` prefix is applied
- [ ] **Low-power mode (iOS)**: Animations may be reduced automatically
- [ ] **Reduced motion**: `prefers-reduced-motion` disables animations

---

## Performance: Animation Pause on Tab Hidden

To save battery on mobile devices during long game sessions, use the `useAnimationPause` hook:

```tsx
import { useAnimationPause } from "@/hooks/useVisibility";

export default function GameLayout({ children }) {
  // Automatically pauses animations when tab is hidden
  useAnimationPause();

  return <>{children}</>;
}
```

**How it works:**
1. Hook listens to `visibilitychange` event
2. Adds `.animations-paused` class to `<body>` when tab is hidden
3. CSS pauses all animations via `animation-play-state: paused`
4. Animations resume automatically when tab becomes visible

> [!TIP]
> For critical timers (e.g., banker offer countdown), use `useVisibilityPause()` to pause the interval itself rather than just the visual animation. This prevents timing drift.

```tsx
import { useVisibilityPause, usePausableInterval } from "@/hooks/useVisibility";

function BankerCountdown({ onExpire }) {
  const isVisible = useVisibilityPause();
  const [seconds, setSeconds] = useState(30);

  usePausableInterval(
    () => setSeconds(s => s - 1),
    isVisible ? 1000 : null // Pauses when tab hidden
  );

  // ...
}
```

---

## Heading Hierarchy Guidelines

> [!IMPORTANT]
> Maintain consistent heading hierarchy (H1 → H2 → H3) for screen reader outline navigation.

### Expected Heading Structure

| Page | H1 | H2 | H3 |
|------|----|----|-----|
| **Home (demo)** | "Deal or No Deal" | Section titles (Select a Box, Game Assets, Glow Effects) | Panel headers |
| **Lobby** | "Game Lobby" | "Select Your Box", "Players" | — |
| **Play** | — (TopBar serves visual header) | — | Panel headers (Remaining Values, Players) |

### Rules for Contributors

1. **One H1 per page** – Main page title only
2. **H2 for sections** – Major content areas (StageGrid panels)
3. **H3 for sub-sections** – Panel headers, cards, modals
4. **Never skip levels** – Don't jump from H1 to H3

### Linting Guidance

Add to ESLint config for automated checking:

```js
// eslint.config.mjs
{
  "rules": {
    // Consider using eslint-plugin-jsx-a11y
    "jsx-a11y/heading-has-content": "error",
    // Custom rule or manual review for hierarchy
  }
}
```

**Manual Review Checklist:**
- [ ] Page has exactly one `<h1>` element
- [ ] Headings follow sequential order (h1 → h2 → h3)
- [ ] Modal titles use appropriate level (usually H2 or aria-labelledby)
- [ ] TopBar logo is NOT a heading element

### Modal Heading Pattern

```tsx
// BankerOffer modal uses aria-labelledby instead of heading
<div role="dialog" aria-labelledby="banker-offer-title">
  <p id="banker-offer-title">The Banker Offers</p>
  <!-- Not a heading - uses styling only -->
</div>
```

---

## Legacy Browser Fallbacks (Enhanced)

### Backdrop-Filter Support Matrix

| Browser | Version | Support | Notes |
|---------|---------|---------|-------|
| Chrome | 76+ | ✅ Full | — |
| Edge | 79+ | ✅ Full | — |
| Safari | 14+ | ✅ Full | Requires `-webkit-` prefix |
| Safari iOS | 12.2+ | ⚠️ Partial | May have performance issues |
| Firefox | 103+ | ✅ Full | Earlier versions unsupported |
| **Android WebView** | 76+ | ⚠️ Varies | Depends on device Chrome version |
| Samsung Internet | 12+ | ✅ Full | — |

### Readable Contrast Fallback

> [!CAUTION]
> When `backdrop-filter` is unsupported, ensure text remains readable against the opaque fallback background.

```css
.glass {
  /* Fallback: near-opaque background for readability */
  background: rgba(26, 29, 48, 0.95);
  color: #e5e7eb; /* Ensures 4.5:1 contrast on fallback */
  
  /* Modern browsers use blur */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

/* Enhanced fallback for unsupported browsers */
@supports not (backdrop-filter: blur(12px)) {
  .glass {
    background: rgba(26, 29, 48, 0.98);
    /* Slightly increase text contrast */
    color: #f3f4f6;
  }
  
  .glass-dark {
    background: rgba(10, 11, 20, 0.98);
  }
  
  .glass-gold {
    background: rgba(42, 35, 15, 0.95);
    border-color: rgba(212, 175, 55, 0.4);
  }
}
```

### Android WebView Testing

```bash
# Test on older Android WebView versions using Chrome DevTools
# Device Mode → Select "Android" → Throttle to 3G
# Check if glass panels remain readable without blur
```

**Fallback Verification:**
1. Open DevTools → More Tools → Rendering
2. Disable "backdrop-filter" in CSS features
3. Verify all text remains readable (4.5:1 contrast minimum)
4. Check gold text against dark backgrounds

---

## Landmark ID Uniqueness Guidelines

> [!WARNING]
> Landmark IDs used by SkipLinks must be unique per page. Duplicate IDs break keyboard navigation.

### Reserved Landmark IDs

| ID | Used By | Location |
|----|---------|----------|
| `main-content` | StageGrid | Main container |
| `banker-offer` | StageGrid | Centre panel (main) |
| `game-boxes` | StageGrid | Bottom section |
| `players` | StageGrid | Right panel |

### Contributor Checklist: New Pages/Sections

When creating new pages or nested layouts, follow this checklist:

- [ ] **Check for ID conflicts** – Search codebase for existing uses of your proposed ID
- [ ] **Don't duplicate landmark IDs** – Each ID must appear exactly once per page
- [ ] **Nested layouts** – Child layouts should NOT re-declare parent landmark IDs
- [ ] **Test with Tab key** – Verify skip links navigate to correct sections
- [ ] **Run dev mode health check** – Console will warn about missing/duplicate IDs

### Safe Patterns

```tsx
// ✅ GOOD: Unique IDs per page
<main id="main-content">
  <section id="game-boxes">...</section>
</main>

// ❌ BAD: Nested layout duplicates parent ID
<Layout>
  <main id="main-content"> {/* Already in Layout! */}
    ...
  </main>
</Layout>

// ✅ GOOD: Use different IDs for nested sections
<main id="main-content">
  <section id="round-info">...</section>
  <section id="game-boxes">...</section>
</main>
```

### Adding New Skip Links

If adding new skip links for a new section:

1. Add the ID to `SKIP_LINK_TARGETS` in `SkipLinks.tsx`
2. Add the skip link anchor in the component
3. Add the `id` attribute to the target element
4. Test in dev mode – health check will verify

```tsx
// SkipLinks.tsx
const SKIP_LINK_TARGETS = [
  { id: "main-content", label: "Skip to main content" },
  { id: "banker-offer", label: "Skip to banker offer" },
  { id: "game-boxes", label: "Skip to game boxes" },
  { id: "players", label: "Skip to players" },
  // Add new entries here
] as const;
```

### Debugging Duplicate IDs

```tsx
// Add to browser console to find duplicates
Array.from(document.querySelectorAll('[id]'))
  .map(el => el.id)
  .filter((id, i, arr) => arr.indexOf(id) !== i);
```

