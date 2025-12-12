"use client";

import { useRef, useEffect, useCallback } from "react";

export type BoxPodiumState = "closed" | "selectable" | "opened" | "revealing";

interface BoxPodiumProps {
    /** Box number to display */
    boxNumber: number;
    /** Current state of the box */
    state?: BoxPodiumState;
    /** Whether this box belongs to the current player */
    isOwner?: boolean;
    /** The revealed value (only shown when opened) */
    revealedValue?: number;
    /** Callback when box is clicked */
    onClick?: () => void;
    /** Whether the box is disabled for interaction */
    disabled?: boolean;
    /** Callback when reveal animation completes */
    onRevealComplete?: () => void;
}

/**
 * Format currency for display
 */
function formatCurrency(value: number): string {
    if (value < 1) {
        return `${Math.round(value * 100)}p`;
    }
    return `£${value.toLocaleString("en-GB")}`;
}

/**
 * BoxPodium - Individual box with podium styling
 * 
 * Features:
 * - Illuminated look with gold trim
 * - Selectable pulse animation
 * - Opened dark state
 * - Explosion reveal animation hook
 * - Full accessibility attributes
 */
import { useFeedbackOptional } from "@/context/FeedbackContext";

export function BoxPodium({
    boxNumber,
    state = "closed",
    isOwner = false,
    revealedValue,
    onClick,
    disabled = false,
    onRevealComplete,
}: BoxPodiumProps) {
    const boxRef = useRef<HTMLButtonElement>(null);
    const animationRef = useRef<Animation | null>(null);
    const { playSound, vibrate } = useFeedbackOptional();

    // Handle reveal animation completion
    useEffect(() => {
        if (state === "revealing" && boxRef.current) {
            // Play open sound and vibrate
            playSound('box-open');
            vibrate(50); // Short tick

            // Create explosion reveal animation
            const keyframes = [
                {
                    transform: "scale(1) rotateY(0deg)",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                    filter: "brightness(1)"
                },
                {
                    transform: "scale(1.15) rotateY(90deg)",
                    boxShadow: "0 0 40px rgba(212, 175, 55, 0.8), 0 0 60px rgba(255, 215, 0, 0.6)",
                    filter: "brightness(1.5)",
                    offset: 0.4
                },
                {
                    transform: "scale(1.2) rotateY(90deg)",
                    boxShadow: "0 0 60px rgba(255, 255, 255, 0.9), 0 0 80px rgba(212, 175, 55, 1)",
                    filter: "brightness(2)",
                    offset: 0.5
                },
                {
                    transform: "scale(1.1) rotateY(180deg)",
                    boxShadow: "0 0 30px rgba(212, 175, 55, 0.5)",
                    filter: "brightness(1.2)",
                    offset: 0.7
                },
                {
                    transform: "scale(1) rotateY(180deg)",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                    filter: "brightness(1)"
                },
            ];

            const timing: KeyframeAnimationOptions = {
                duration: 800,
                easing: "cubic-bezier(0.4, 0, 0.2, 1)",
                fill: "forwards",
            };

            // Check for reduced motion preference (media query OR app-level toggle)
            const prefersReducedMotion =
                window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
                document.body.classList.contains("reduced-motion");

            if (prefersReducedMotion) {
                // Skip animation for reduced motion
                onRevealComplete?.();
            } else if (boxRef.current.animate) {
                // Use Web Animations API if available
                animationRef.current = boxRef.current.animate(keyframes, timing);
                animationRef.current.onfinish = () => {
                    onRevealComplete?.();
                };
            } else {
                // Fallback for browsers without WAAPI directly
                // We add a class that triggers the CSS animation
                boxRef.current.classList.add('box-podium-reveal-fallback');

                const handleAnimationEnd = () => {
                    boxRef.current?.classList.remove('box-podium-reveal-fallback');
                    boxRef.current?.removeEventListener('animationend', handleAnimationEnd);
                    onRevealComplete?.();
                };

                boxRef.current.addEventListener('animationend', handleAnimationEnd);
            }
        }

        return () => {
            animationRef.current?.cancel();
        };
    }, [state, onRevealComplete]);

    // Generate class names based on state
    const getClassNames = useCallback(() => {
        const base = [
            "box-podium-component",
            "relative flex items-center justify-center",
            "w-16 h-20 sm:w-20 sm:h-24 lg:w-24 lg:h-28",
            "rounded-lg font-display font-bold text-xl sm:text-2xl",
            "transition-all duration-300",
            "focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 focus:ring-offset-studio-900",
            "perspective-1000",
        ];

        if (disabled) {
            base.push("cursor-not-allowed opacity-50");
        } else if (onClick) {
            base.push("cursor-pointer");
        } else {
            base.push("cursor-default");
        }

        // State-based styling
        switch (state) {
            case "selectable":
                base.push(
                    "bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800",
                    "border-2 border-gold-400",
                    "text-white",
                    "box-podium-selectable", // Animation class
                    "hover:scale-105 hover:border-gold-300",
                    "shadow-lg shadow-gold-900/30"
                );
                break;

            case "opened":
                base.push(
                    "bg-gradient-to-br from-studio-700 to-studio-800",
                    "border-2 border-studio-600",
                    "text-gray-500",
                    "opacity-70"
                );
                break;

            case "revealing":
                base.push(
                    "bg-gradient-to-br from-gold-500 via-gold-600 to-gold-700",
                    "border-2 border-gold-300",
                    "text-studio-900",
                    "transform-style-preserve-3d"
                );
                break;

            case "closed":
            default:
                base.push(
                    "bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900",
                    "border-2 border-gold-500/30",
                    "text-white",
                    "hover:border-gold-500/60 hover:scale-105 hover:shadow-lg"
                );
                break;
        }

        // Owner styling (gold trim enhancement)
        if (isOwner && state !== "opened") {
            base.push(
                "ring-2 ring-gold-400 ring-offset-2 ring-offset-studio-900",
                "box-podium-owner"
            );
        }

        return base.join(" ");
    }, [state, isOwner, disabled, onClick]);

    // Generate aria-label
    const getAriaLabel = () => {
        let label = `Box ${boxNumber}`;

        if (isOwner) label += ", your box";

        switch (state) {
            case "opened":
                label += revealedValue !== undefined
                    ? `, opened, contains ${formatCurrency(revealedValue)}`
                    : ", opened";
                break;
            case "selectable":
                label += ", available to select";
                break;
            case "revealing":
                label += ", revealing";
                break;
        }

        if (disabled) label += ", disabled";

        return label;
    };

    return (
        <button
            ref={boxRef}
            onClick={disabled ? undefined : onClick}
            disabled={disabled || state === "opened"}
            className={getClassNames()}
            aria-label={getAriaLabel()}
            aria-pressed={state === "selectable" ? false : undefined}
            aria-disabled={disabled || state === "opened"}
            data-state={state}
            data-owner={isOwner}
        >
            {/* Illuminated background glow */}
            <div
                className="absolute inset-0 rounded-lg bg-gradient-to-t from-transparent via-white/5 to-white/10 pointer-events-none"
                aria-hidden="true"
            />

            {/* Gold trim highlight */}
            <div
                className="absolute inset-0 rounded-lg border border-gold-500/20 pointer-events-none"
                aria-hidden="true"
            />

            {/* Selectable sweep/pulse animation overlay */}
            {state === "selectable" && (
                <div
                    className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none"
                    aria-hidden="true"
                >
                    <div className="box-podium-sweep absolute inset-0" />
                </div>
            )}

            {/* Reveal explosion effect */}
            {state === "revealing" && (
                <div
                    className="absolute inset-0 rounded-lg box-podium-explosion pointer-events-none"
                    aria-hidden="true"
                />
            )}

            {/* Content */}
            <span className="relative z-10">
                {state === "opened" && revealedValue !== undefined ? (
                    <span className="text-sm sm:text-base font-mono">
                        {formatCurrency(revealedValue)}
                    </span>
                ) : (
                    boxNumber
                )}
            </span>

            {/* Owner indicator star */}
            {isOwner && state !== "opened" && (
                <div
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gold-400 border-2 border-studio-900 flex items-center justify-center z-20"
                    aria-hidden="true"
                >
                    <span className="text-[10px] font-bold text-studio-900">★</span>
                </div>
            )}

            {/* Podium base shadow */}
            <div
                className="absolute -bottom-1 left-1 right-1 h-2 bg-black/30 rounded-b-lg blur-sm pointer-events-none"
                aria-hidden="true"
            />
        </button>
    );
}

/**
 * CSS styles for BoxPodium animations
 * These should be added to studio.css or imported
 */
export const boxPodiumStyles = `
/* Selectable box pulse animation */
.box-podium-selectable {
    animation: box-podium-pulse 2s ease-in-out infinite;
}

@keyframes box-podium-pulse {
    0%, 100% {
        box-shadow: 0 0 15px rgba(212, 175, 55, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3);
    }
    50% {
        box-shadow: 0 0 30px rgba(212, 175, 55, 0.7), 0 0 50px rgba(212, 175, 55, 0.4), 0 4px 16px rgba(0, 0, 0, 0.4);
    }
}

/* Sweep light animation for selectable state */
.box-podium-sweep {
    background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(255, 255, 255, 0.2) 50%,
        transparent 100%
    );
    animation: box-podium-sweep-move 2s ease-in-out infinite;
}

@keyframes box-podium-sweep-move {
    0% {
        transform: translateX(-100%);
    }
    100% {
        transform: translateX(100%);
    }
}

/* Explosion effect during reveal */
.box-podium-explosion {
    background: radial-gradient(circle, rgba(255, 215, 0, 0.6) 0%, transparent 70%);
    animation: box-podium-explode 0.8s ease-out forwards;
}

@keyframes box-podium-explode {
    0% {
        transform: scale(0);
        opacity: 1;
    }
    50% {
        transform: scale(1.5);
        opacity: 0.8;
    }
    100% {
        transform: scale(2);
        opacity: 0;
    }
}

/* Owner box special glow */
.box-podium-owner {
    box-shadow: 0 0 20px rgba(212, 175, 55, 0.5), 0 0 40px rgba(212, 175, 55, 0.2);
}

/* Perspective for 3D transforms */
.perspective-1000 {
    perspective: 1000px;
}

.transform-style-preserve-3d {
    transform-style: preserve-3d;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
    .box-podium-selectable,
    .box-podium-sweep,
    .box-podium-explosion {
        animation: none !important;
    }
    
    .box-podium-selectable {
        box-shadow: 0 0 20px rgba(212, 175, 55, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3);
    }
}
`;

export default BoxPodium;
