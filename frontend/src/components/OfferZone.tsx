"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { CountdownRingFromExpiry } from "./CountdownRing";

interface OfferZoneProps {
    /** The offer amount in pounds (undefined = no active offer) */
    amount?: number;
    /** Unix timestamp (ms) when the offer expires */
    expiresAt?: number;
    /** Total duration of the offer in seconds (for progress calculation) */
    totalDuration?: number;
    /** Callback when Deal is clicked */
    onDeal?: () => void;
    /** Callback when No Deal is clicked */
    onNoDeal?: () => void;
    /** Whether the current player has already responded */
    hasResponded?: boolean;
    /** Whether player chose Deal (for display after responding) */
    choseDeal?: boolean;
    /** Additional classNames */
    className?: string;
}

/**
 * Format currency for display
 */
function formatCurrency(value: number): string {
    return `£${value.toLocaleString("en-GB", {
        minimumFractionDigits: value % 1 !== 0 ? 2 : 0,
        maximumFractionDigits: 2,
    })}`;
}

/**
 * OfferZone - Central offer display with Deal/No Deal buttons
 * 
 * Features:
 * - Large glowing amount display
 * - Countdown ring animation from expiry timestamp
 * - Deal (green/gold gradient) and No Deal (red) buttons
 * - Shimmer effect every 3 seconds
 * - Disabled state when no offer is active
 * - Full accessibility with focus trap and ARIA
 */
import { useFeedbackOptional } from "@/context/FeedbackContext";

export function OfferZone({
    amount,
    expiresAt,
    totalDuration = 30,
    onDeal,
    onNoDeal,
    hasResponded = false,
    choseDeal,
    className = "",
}: OfferZoneProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);
    const dealButtonRef = useRef<HTMLButtonElement>(null);
    const noDealButtonRef = useRef<HTMLButtonElement>(null);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
    const [shimmerTrigger, setShimmerTrigger] = useState(0);

    const { playSound, vibrate } = useFeedbackOptional();

    const isActive = amount !== undefined && expiresAt !== undefined;

    // Play sounds on new offer
    useEffect(() => {
        if (isActive && !hasResponded) {
            playSound('banker-chime');
            vibrate([200, 100, 200]); // Phone ring vibration pattern

            // Play thump when amount visually stabilizes/appears
            setTimeout(() => {
                playSound('offer-thump');
            }, 500);
        }
    }, [isActive, hasResponded, playSound, vibrate, amount]);

    // Check for reduced motion preference (media query OR app-level toggle)
    useEffect(() => {
        const checkReducedMotion = () => {
            const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
            const hasClass = document.body.classList.contains("reduced-motion");
            setPrefersReducedMotion(mediaQuery.matches || hasClass);
        };

        // Initial check
        checkReducedMotion();

        // Listen for media query changes
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        const handleMediaChange = () => checkReducedMotion();
        mediaQuery.addEventListener("change", handleMediaChange);

        // Observe body class changes for app-level toggle
        const observer = new MutationObserver(checkReducedMotion);
        observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });

        return () => {
            mediaQuery.removeEventListener("change", handleMediaChange);
            observer.disconnect();
        };
    }, []);

    // Trigger shimmer every 3 seconds
    useEffect(() => {
        if (!isActive || hasResponded || prefersReducedMotion) return;

        const interval = setInterval(() => {
            setShimmerTrigger(prev => prev + 1);
        }, 3000);

        return () => clearInterval(interval);
    }, [isActive, hasResponded, prefersReducedMotion]);

    // Focus management: move focus into modal when active
    useEffect(() => {
        if (isActive && !hasResponded) {
            previousFocusRef.current = document.activeElement as HTMLElement;
            setTimeout(() => dealButtonRef.current?.focus(), 100);
        } else if (!isActive && previousFocusRef.current) {
            previousFocusRef.current.focus();
            previousFocusRef.current = null;
        }
    }, [isActive, hasResponded]);

    // Focus trap handler
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key !== "Tab" || !isActive || hasResponded) return;

        const focusableElements = [dealButtonRef.current, noDealButtonRef.current].filter(Boolean);
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement?.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement?.focus();
            }
        }
    }, [isActive, hasResponded]);

    return (
        <div
            ref={containerRef}
            role={isActive ? "dialog" : "region"}
            aria-modal={isActive}
            aria-labelledby="offer-zone-title"
            aria-describedby={isActive ? "offer-zone-amount" : undefined}
            tabIndex={-1}
            onKeyDown={handleKeyDown}
            className={`offer-zone flex flex-col items-center justify-center h-full gap-6 focus:outline-none ${className}`}
        >
            {/* Screen Reader Live Region */}
            <div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
            >
                {isActive && !hasResponded
                    ? `The banker offers ${formatCurrency(amount!)}. Deal or No Deal?`
                    : hasResponded
                        ? choseDeal
                            ? "You chose Deal. Waiting for other players."
                            : "You chose No Deal. Waiting for other players."
                        : "Waiting for banker offer."
                }
            </div>

            {isActive ? (
                <>
                    {/* Offer Title */}
                    <h2
                        id="offer-zone-title"
                        className="text-gold-300 text-sm uppercase tracking-widest font-display"
                    >
                        The Banker Offers
                    </h2>

                    {/* Large Glowing Amount */}
                    <div className="offer-amount-container relative">
                        {/* Glow effect behind amount */}
                        <div
                            className="absolute inset-0 blur-2xl bg-gold-500/30 rounded-full scale-150 pointer-events-none"
                            aria-hidden="true"
                        />

                        {/* Amount with shimmer */}
                        <span
                            id="offer-zone-amount"
                            className={`
                                offer-amount relative z-10
                                text-5xl sm:text-6xl lg:text-7xl font-display font-black
                                ${!prefersReducedMotion ? "offer-amount-shimmer" : "text-gold-400"}
                            `}
                            key={shimmerTrigger} // Re-trigger animation
                        >
                            {formatCurrency(amount!)}
                        </span>
                    </div>

                    {/* Response Status or Decision UI */}
                    {hasResponded ? (
                        <div className="response-status text-center py-4">
                            <p className="text-xl font-semibold mb-2">
                                {choseDeal ? (
                                    <span className="text-green-400">You chose DEAL</span>
                                ) : (
                                    <span className="text-red-400">You chose NO DEAL</span>
                                )}
                            </p>
                            <p className="text-sm text-gray-500">Waiting for other players...</p>
                        </div>
                    ) : (
                        <>
                            {/* Countdown Ring */}
                            <div className="countdown-section my-4">
                                <CountdownRingFromExpiry
                                    expiresAt={expiresAt!}
                                    totalDuration={totalDuration}
                                    size={100}
                                    strokeWidth={6}
                                    color="gold"
                                />
                            </div>

                            {/* Deal / No Deal Buttons */}
                            <div className="flex gap-4 w-full max-w-sm">
                                <button
                                    ref={dealButtonRef}
                                    onClick={onDeal}
                                    disabled={!onDeal}
                                    className={`
                                        hit-44 focus-glow offer-btn-deal flex-1 min-h-[60px] text-xl font-bold uppercase tracking-wider
                                        bg-gradient-to-br from-green-500 via-green-600 to-emerald-700
                                        hover:from-green-400 hover:via-green-500 hover:to-emerald-600
                                        text-white rounded-xl
                                        border-2 border-gold-500/50
                                        transition-all duration-200
                                        hover:scale-105 hover:shadow-xl hover:shadow-green-900/50
                                        active:scale-95
                                        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none
                                        focus:outline-none
                                        ${!prefersReducedMotion && !hasResponded ? "offer-btn-shimmer" : ""}
                                    `}
                                    aria-label="Accept the deal"
                                    style={{ animationDelay: "0s" }}
                                >
                                    <span className="offer-btn-text">Deal</span>
                                </button>

                                <button
                                    ref={noDealButtonRef}
                                    onClick={onNoDeal}
                                    disabled={!onNoDeal}
                                    className={`
                                        hit-44 focus-glow offer-btn-no-deal flex-1 min-h-[60px] text-xl font-bold uppercase tracking-wider
                                        bg-gradient-to-br from-red-500 via-red-600 to-red-700
                                        hover:from-red-400 hover:via-red-500 hover:to-red-600
                                        text-white rounded-xl
                                        border-2 border-red-400/50
                                        transition-all duration-200
                                        hover:scale-105 hover:shadow-xl hover:shadow-red-900/50
                                        active:scale-95
                                        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none
                                        focus:outline-none
                                        ${!prefersReducedMotion && !hasResponded ? "offer-btn-shimmer" : ""}
                                    `}
                                    aria-label="Reject the deal"
                                    style={{ animationDelay: "1.5s" }}
                                >
                                    <span className="offer-btn-text">No Deal</span>
                                </button>
                            </div>
                        </>
                    )}
                </>
            ) : (
                /* Waiting State - No Active Offer */
                <div className="offer-waiting flex flex-col items-center justify-center gap-6 py-8 animate-in fade-in duration-700">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-studio-800/80 border border-gold-500/20 flex items-center justify-center shadow-2xl backdrop-blur-sm">
                            <span className="text-4xl">💼</span>
                        </div>
                        {/* Orbiting Loading Dot */}
                        <div className="absolute inset-0 animate-spin-slow">
                            <div className="w-3 h-3 bg-gold-500 rounded-full blur-[2px] absolute top-2 left-1/2 -translate-x-1/2 shadow-[0_0_10px_rgba(234,179,8,0.8)]" />
                        </div>
                    </div>

                    <div className="text-center space-y-2">
                        <h3 className="text-gold-400 font-display text-lg tracking-widest uppercase">
                            Awaiting Banker
                        </h3>
                        <p id="offer-zone-title" className="text-gray-400 font-medium">
                            Open boxes to reveal the next offer
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * CSS styles for OfferZone animations
 * These should be added to studio.css or imported
 */
export const offerZoneStyles = `
/* Amount shimmer animation */
.offer-amount-shimmer {
    background: linear-gradient(
        90deg,
        #d4af37 0%,
        #f5e6a3 25%,
        #fff7cc 50%,
        #f5e6a3 75%,
        #d4af37 100%
    );
    background-size: 200% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: offer-shimmer 3s ease-in-out infinite;
}

@keyframes offer-shimmer {
    0%, 100% {
        background-position: 0% 50%;
    }
    50% {
        background-position: 100% 50%;
    }
}

/* Button shimmer effect */
.offer-btn-shimmer {
    position: relative;
    overflow: hidden;
}

.offer-btn-shimmer::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(255, 255, 255, 0.3) 50%,
        transparent 100%
    );
    animation: offer-btn-shimmer-sweep 3s ease-in-out infinite;
}

@keyframes offer-btn-shimmer-sweep {
    0%, 80% {
        left: -100%;
    }
    100% {
        left: 100%;
    }
}

/* Deal button specific gradient enhance */
.offer-btn-deal {
    box-shadow: 0 4px 20px rgba(22, 163, 74, 0.3);
}

.offer-btn-deal:hover:not(:disabled) {
    box-shadow: 0 8px 30px rgba(22, 163, 74, 0.5), 0 0 20px rgba(212, 175, 55, 0.3);
}

/* No Deal button specific styling */
.offer-btn-no-deal {
    box-shadow: 0 4px 20px rgba(220, 38, 38, 0.3);
}

.offer-btn-no-deal:hover:not(:disabled) {
    box-shadow: 0 8px 30px rgba(220, 38, 38, 0.5);
}

/* Glow pulse for amount container */
.offer-amount-container {
    padding: 1rem 2rem;
}

/* Countdown ring enhancements */
.offer-zone .countdown-section .countdown-svg {
    filter: drop-shadow(0 0 10px rgba(212, 175, 55, 0.5));
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
    .offer-amount-shimmer {
        animation: none;
        -webkit-text-fill-color: #d4af37;
        background: none;
    }
    
    .offer-btn-shimmer::after {
        animation: none;
        display: none;
    }
}
`;

export default OfferZone;
