# Feedback Hooks - Audio & Haptic

This document describes the design-ready feedback hooks system for providing audio cues and haptic feedback in the Deal or No Deal game.

## Quick Start

```tsx
import { useFeedback, VIBRATION_PATTERNS } from "@/hooks/useFeedback";

function BoxComponent({ onOpen }) {
  const { playBoxOpen, vibrate } = useFeedback();
  
  const handleClick = () => {
    playBoxOpen();
    vibrate(VIBRATION_PATTERNS.BOX_OPEN);
    onOpen();
  };
  
  return <button onClick={handleClick}>Open Box</button>;
}
```

## Available Hooks

### `useFeedback()`

Returns an object with the following methods:

| Method | Description | Placeholder Sound |
|--------|-------------|-------------------|
| `playBoxOpen()` | Short click/thunk for box opening | 80Hz square + 120Hz triangle, 50ms |
| `playBankerChime()` | Phone ring/chime when banker calls | 440Hz + 554Hz two-tone chime |
| `playOfferAppear()` | Bass whoosh when offer is displayed | 60Hz→120Hz rising bass sweep |
| `playVictory()` | Celebration flourish for wins | C-E-G-C arpeggio |
| `vibrate(pattern)` | Trigger haptic feedback | N/A |
| `audioReady` | Boolean: audio context initialized | N/A |
| `hapticsAvailable` | Boolean: device supports vibration | N/A |

## Vibration Patterns

Pre-defined patterns available via `VIBRATION_PATTERNS`:

```typescript
import { VIBRATION_PATTERNS } from "@/hooks/useFeedback";

// Available patterns (values in milliseconds)
VIBRATION_PATTERNS.TAP          // 50 - Single short pulse
VIBRATION_PATTERNS.CONFIRM      // [50, 50, 100] - Double pulse
VIBRATION_PATTERNS.ERROR        // [100, 50, 100, 50, 100] - Triple pulse
VIBRATION_PATTERNS.VICTORY      // [50, 50, 50, 50, 200] - Celebration
VIBRATION_PATTERNS.BOX_OPEN     // [30, 20, 50] - Short buzz
```

## Audio Asset Requirements

When replacing placeholder tones with real audio assets:

### File Formats
- **Primary**: MP3 (best compression, widest support)
- **Fallback**: OGG Vorbis (better quality, some iOS issues)
- **Alternative**: WebM (modern browsers)

### Recommended Specifications
| Sound | Duration | Frequency Range | Notes |
|-------|----------|-----------------|-------|
| Box Open | 50-100ms | 60-200Hz | Percussive thunk |
| Banker Chime | 300-500ms | 400-600Hz | Two-tone phone ring |
| Offer Appear | 300-500ms | 50-150Hz | Rising bass sweep |
| Victory | 600-1000ms | 250-600Hz | Ascending arpeggio |

### Volume Levels
- All sounds should be normalized to -12dB peak
- Avoid clipping
- Consider dynamic range for mobile speakers

## Replacing Placeholder Sounds

To replace the Web Audio API placeholders with real audio files:

### Expected Filenames

> [!IMPORTANT]
> Place audio files in `public/sfx/` with these exact filenames:

| Filename | Purpose | Duration | Notes |
|----------|---------|----------|-------|
| `box-open.mp3` | Box opening sound | 50-100ms | Short percussive thunk/click |
| `banker-chime.mp3` | Banker phone ring | 300-500ms | Two-tone phone chime |
| `offer-thump.mp3` | Offer appears | 300-500ms | Low bass whoosh/impact |
| `victory.mp3` | Win celebration | 600-1000ms | Ascending flourish/fanfare |

### Directory Structure
```
public/
  sfx/
    box-open.mp3
    banker-chime.mp3
    offer-thump.mp3
    victory.mp3
```

### Audio Specifications
- **Format**: MP3 (44.1kHz, 128-192kbps)
- **Peak Level**: Normalize to -12dB
- **Bit Depth**: 16-bit
- **Channels**: Mono (to reduce file size)


2. Modify the hook to preload and play audio files:
```typescript
// Example: Replace playBoxOpen with audio file
const boxOpenSound = useRef<HTMLAudioElement | null>(null);

useEffect(() => {
  boxOpenSound.current = new Audio('/audio/box-open.mp3');
  boxOpenSound.current.preload = 'auto';
}, []);

const playBoxOpen = useCallback(() => {
  if (boxOpenSound.current) {
    boxOpenSound.current.currentTime = 0;
    boxOpenSound.current.play().catch(console.warn);
  }
}, []);
```

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge | iOS Safari | Android Chrome |
|---------|--------|---------|--------|------|------------|----------------|
| Web Audio API | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Navigator.vibrate | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |

> [!NOTE]
> iOS Safari and desktop Safari do not support the Vibration API. The hook silently skips haptic feedback on unsupported devices.

## Accessibility Considerations

### Reduced Motion
The feedback hooks automatically respect the user's reduced-motion preference:
- When `prefers-reduced-motion: reduce` is set, or
- When the app's `.reduced-motion` class is on the body

**Haptic feedback is skipped** when reduced motion is enabled.

Audio feedback is NOT affected by reduced-motion as it provides important gameplay cues for users who cannot see animations.

### User Activation
Audio playback requires user interaction (gesture) due to browser autoplay policies. The hook automatically:
1. Initializes AudioContext on first user interaction
2. Resumes suspended audio context when needed
3. Silently fails if audio cannot play (no error thrown)

## Event Integration

### Box Opening
```tsx
const { playBoxOpen, vibrate } = useFeedback();

const handleReveal = async (boxNumber: number) => {
  playBoxOpen();
  vibrate(VIBRATION_PATTERNS.BOX_OPEN);
  await revealBox(boxNumber);
};
```

### Banker Phone Ringing
```tsx
// In BankerScreen component when state changes to 'incoming'
useEffect(() => {
  if (state === 'incoming') {
    playBankerChime();
    vibrate(VIBRATION_PATTERNS.CONFIRM);
  }
}, [state, playBankerChime, vibrate]);
```

### Offer Display
```tsx
// In OfferZone when offer becomes active
useEffect(() => {
  if (isActive && !hasResponded) {
    playOfferAppear();
    vibrate(VIBRATION_PATTERNS.TAP);
  }
}, [isActive, hasResponded, playOfferAppear, vibrate]);
```

### Victory/Celebration
```tsx
const { playVictory, vibrate } = useFeedback();

const handleGameEnd = (result: 'win' | 'lose') => {
  if (result === 'win') {
    playVictory();
    vibrate(VIBRATION_PATTERNS.VICTORY);
  }
};
```

## Testing

### Manual Testing
1. Open the app in a browser
2. Click any interactive element to trigger user activation
3. Open browser console and run:
```javascript
// Access the feedback hooks from a component or global
// These placeholder sounds should play:
window.__feedbackTest?.playBoxOpen();
window.__feedbackTest?.playBankerChime();
window.__feedbackTest?.playOfferAppear();
window.__feedbackTest?.playVictory();
window.__feedbackTest?.vibrate(100);
```

### Verify Reduced Motion
1. Enable reduced motion in OS settings or toggle in app
2. Call `vibrate()` - should be skipped (no vibration)
3. Call `playBoxOpen()` - should still play (audio not affected)

### Check for Errors
- Open browser console
- Trigger all feedback hooks
- Verify no errors are thrown on unsupported devices
- Check for `[useFeedback]` warning messages if features unavailable

## Future Enhancements

- [ ] Add volume control setting
- [ ] Add individual sound enable/disable toggles
- [ ] Preload audio files on app start
- [ ] Add sound sprite support for faster loading
- [ ] iOS Web Audio unlock pattern
