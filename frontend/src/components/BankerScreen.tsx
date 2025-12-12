"use client";

import { useRef, useEffect, useState } from "react";

interface BankerScreenProps {
    /** Whether the banker is currently calling */
    isCallIncoming?: boolean;
    /** Whether the screen should show active/flicker state */
    isActive?: boolean;
    /** Custom SVG or component to display as banker avatar */
    bankerAvatar?: React.ReactNode;
    /** Whether to show the "calling" phone animation */
    showPhoneAnimation?: boolean;
    /** Additional classNames */
    className?: string;
}

/**
 * BankerScreen - Display component for the banker's podium/screen
 * 
 * Features:
 * - Flicker animation on screen
 * - Call-incoming glow sweep effect
 * - SVG placeholder for banker display
 * - Reduced-motion preference support
 */
export function BankerScreen({
    isCallIncoming = false,
    isActive = true,
    bankerAvatar,
    showPhoneAnimation = false,
    className = "",
}: BankerScreenProps) {
    const screenRef = useRef<HTMLDivElement>(null);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    // Check for reduced motion preference
    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        setPrefersReducedMotion(mediaQuery.matches);

        const handler = (e: MediaQueryListEvent) => {
            setPrefersReducedMotion(e.matches);
        };

        mediaQuery.addEventListener("change", handler);
        return () => mediaQuery.removeEventListener("change", handler);
    }, []);

    return (
        <div
            ref={screenRef}
            className={`banker-screen-container relative ${className}`}
            role="img"
            aria-label={isCallIncoming ? "Banker is calling" : "Banker screen"}
        >
            {/* Main screen panel */}
            <div
                className={`
                    banker-screen relative overflow-hidden
                    w-full aspect-[4/3] max-w-md mx-auto
                    rounded-xl border-4 border-studio-600
                    bg-gradient-to-b from-studio-800 to-studio-900
                    shadow-2xl
                    ${isActive && !prefersReducedMotion ? "banker-screen-flicker" : ""}
                    ${isCallIncoming ? "banker-screen-incoming" : ""}
                `}
            >
                {/* Screen glass effect */}
                <div
                    className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"
                    aria-hidden="true"
                />

                {/* Screen scan lines effect */}
                {isActive && !prefersReducedMotion && (
                    <div
                        className="absolute inset-0 banker-scanlines pointer-events-none"
                        aria-hidden="true"
                    />
                )}

                {/* Call incoming glow sweep */}
                {isCallIncoming && !prefersReducedMotion && (
                    <div
                        className="absolute inset-0 banker-glow-sweep pointer-events-none"
                        aria-hidden="true"
                    />
                )}

                {/* Banker avatar placeholder */}
                <div className="absolute inset-0 flex items-center justify-center">
                    {bankerAvatar || <BankerSVGPlaceholder isActive={isActive} />}
                </div>

                {/* Phone animation for incoming call */}
                {showPhoneAnimation && isCallIncoming && (
                    <div
                        className="absolute top-4 right-4 z-10"
                        aria-hidden="true"
                    >
                        <PhoneRingingIcon />
                    </div>
                )}

                {/* Screen edge glow on incoming call */}
                {isCallIncoming && (
                    <div
                        className={`
                            absolute inset-0 rounded-xl pointer-events-none
                            ${prefersReducedMotion
                                ? "ring-4 ring-gold-500/50"
                                : "banker-edge-glow"
                            }
                        `}
                        aria-hidden="true"
                    />
                )}
            </div>

            {/* Screen stand/podium base */}
            <div
                className="relative mx-auto w-1/2 h-4 bg-gradient-to-b from-studio-600 to-studio-700 rounded-b-lg"
                aria-hidden="true"
            />
            <div
                className="relative mx-auto w-3/4 h-2 bg-gradient-to-b from-studio-700 to-studio-800 rounded-b-xl"
                aria-hidden="true"
            />
        </div>
    );
}

/**
 * Default banker silhouette SVG placeholder
 */
function BankerSVGPlaceholder({ isActive }: { isActive?: boolean }) {
    return (
        <svg
            viewBox="0 0 100 100"
            className={`w-2/3 h-2/3 ${isActive ? "text-gold-600/80" : "text-studio-600"}`}
            fill="currentColor"
            aria-hidden="true"
        >
            {/* Banker silhouette */}
            <ellipse cx="50" cy="35" rx="20" ry="22" /> {/* Head */}
            <path
                d="M20 95 Q20 60 50 55 Q80 60 80 95 Z"
                fill="currentColor"
            /> {/* Body/shoulders */}

            {/* Desk/table suggestion */}
            <rect x="15" y="85" width="70" height="10" rx="2" opacity="0.5" />

            {/* Mysterious shadow effect */}
            <ellipse cx="50" cy="45" rx="35" ry="5" fill="black" opacity="0.3" />
        </svg>
    );
}

/**
 * Phone ringing animation icon
 */
function PhoneRingingIcon() {
    return (
        <div className="phone-ringing-container relative">
            {/* Ringing waves */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="phone-ring-wave w-16 h-16 rounded-full border-2 border-gold-400/50" />
                <div className="phone-ring-wave phone-ring-wave-delayed w-16 h-16 rounded-full border-2 border-gold-400/30 absolute" />
            </div>

            {/* Phone icon */}
            <div className="relative w-12 h-12 rounded-full bg-gold-500 flex items-center justify-center phone-shake">
                <svg
                    className="w-6 h-6 text-studio-900"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                </svg>
            </div>
        </div>
    );
}

/**
 * CSS styles for BankerScreen animations
 * These should be added to studio.css or imported
 */
export const bankerScreenStyles = `
/* Screen flicker effect */
.banker-screen-flicker {
    animation: banker-flicker 4s ease-in-out infinite;
}

@keyframes banker-flicker {
    0%, 100% {
        opacity: 1;
        filter: brightness(1);
    }
    2% {
        opacity: 0.95;
        filter: brightness(1.1);
    }
    4% {
        opacity: 1;
        filter: brightness(1);
    }
    50% {
        opacity: 1;
        filter: brightness(1.02);
    }
    52% {
        opacity: 0.97;
        filter: brightness(0.98);
    }
    54% {
        opacity: 1;
        filter: brightness(1);
    }
}

/* Scan lines effect */
.banker-scanlines {
    background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0, 0, 0, 0.1) 2px,
        rgba(0, 0, 0, 0.1) 4px
    );
    animation: banker-scanline-move 8s linear infinite;
}

@keyframes banker-scanline-move {
    0% {
        background-position: 0 0;
    }
    100% {
        background-position: 0 100%;
    }
}

/* Incoming call glow sweep */
.banker-glow-sweep {
    background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(212, 175, 55, 0.3) 50%,
        transparent 100%
    );
    animation: banker-sweep 1.5s ease-in-out infinite;
}

@keyframes banker-sweep {
    0% {
        transform: translateX(-100%);
    }
    100% {
        transform: translateX(100%);
    }
}

/* Edge glow animation for incoming call */
.banker-edge-glow {
    box-shadow: 
        inset 0 0 30px rgba(212, 175, 55, 0.3),
        0 0 20px rgba(212, 175, 55, 0.5),
        0 0 40px rgba(212, 175, 55, 0.3);
    animation: banker-edge-pulse 1s ease-in-out infinite;
}

@keyframes banker-edge-pulse {
    0%, 100% {
        box-shadow: 
            inset 0 0 30px rgba(212, 175, 55, 0.3),
            0 0 20px rgba(212, 175, 55, 0.5),
            0 0 40px rgba(212, 175, 55, 0.3);
    }
    50% {
        box-shadow: 
            inset 0 0 40px rgba(212, 175, 55, 0.5),
            0 0 30px rgba(212, 175, 55, 0.7),
            0 0 60px rgba(212, 175, 55, 0.4);
    }
}

/* Incoming call state */
.banker-screen-incoming {
    border-color: rgba(212, 175, 55, 0.6) !important;
}

/* Phone shake animation */
.phone-shake {
    animation: phone-shake 0.5s ease-in-out infinite;
}

@keyframes phone-shake {
    0%, 100% {
        transform: rotate(0deg);
    }
    25% {
        transform: rotate(-15deg);
    }
    75% {
        transform: rotate(15deg);
    }
}

/* Phone ring wave animation */
.phone-ring-wave {
    animation: phone-ring-expand 1.5s ease-out infinite;
}

.phone-ring-wave-delayed {
    animation-delay: 0.5s;
}

@keyframes phone-ring-expand {
    0% {
        transform: scale(0.5);
        opacity: 1;
    }
    100% {
        transform: scale(2);
        opacity: 0;
    }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
    .banker-screen-flicker,
    .banker-scanlines,
    .banker-glow-sweep,
    .banker-edge-glow,
    .phone-shake,
    .phone-ring-wave {
        animation: none !important;
    }
    
    .banker-edge-glow {
        box-shadow: 
            inset 0 0 30px rgba(212, 175, 55, 0.3),
            0 0 20px rgba(212, 175, 55, 0.5);
    }
}
`;

export default BankerScreen;
