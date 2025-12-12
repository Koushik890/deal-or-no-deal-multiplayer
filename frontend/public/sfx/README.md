# Sound Effects Directory

This directory contains audio assets for game feedback sounds.

## Expected Files

| Filename | Purpose | Duration | Notes |
|----------|---------|----------|-------|
| `box-open.mp3` | Box opening sound | 50-100ms | Short percussive thunk/click |
| `banker-chime.mp3` | Banker phone ring | 300-500ms | Two-tone phone chime |
| `offer-thump.mp3` | Offer appears | 300-500ms | Low bass whoosh/impact |
| `victory.mp3` | Win celebration | 600-1000ms | Ascending flourish/fanfare |

## Audio Specifications

- **Format**: MP3 (44.1kHz, 128-192kbps)
- **Peak Level**: Normalize to -12dB
- **Bit Depth**: 16-bit
- **Channels**: Mono (to reduce file size)

## Current Status

> **Note**: This directory currently contains no audio files.
> The application uses Web Audio API placeholder tones until real
> audio assets are provided.

See `docs/FEEDBACK.md` for full documentation on the feedback hooks system.
