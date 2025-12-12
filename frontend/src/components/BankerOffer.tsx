"use client";

import { useRef, useEffect } from "react";
import { CountdownRing } from "./CountdownRing";

interface BankerOfferProps {
    /** The offer amount in pounds */
    amount: number;
    /** Whether the offer is currently active */
    isActive?: boolean;
    /** Seconds remaining to respond */
    timeRemaining?: number;
    /** Total time for the offer */
    totalTime?: number;
    /** Callback when Deal is clicked */
    onDeal?: () => void;
    /** Callback when No Deal is clicked */
    onNoDeal?: () => void;
    /** Whether the current player has already responded */
    hasResponded?: boolean;
    /** Whether player chose Deal */
    choseDeal?: boolean;
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
 * BankerOffer - Displays the banker's offer with Deal/No Deal buttons
 * 
 * Uses spotlight styling, shimmer text for amount, and countdown timer.
 * 
 * @deprecated Use OfferZone component instead.
 */
export function BankerOffer({
    amount,
    isActive = true,
    timeRemaining = 30,
    totalTime = 30,
    onDeal,
    onNoDeal,
    hasResponded = false,
    choseDeal,
}: BankerOfferProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);
    const dealButtonRef = useRef<HTMLButtonElement>(null);
    const noDealButtonRef = useRef<HTMLButtonElement>(null);

    // Focus management: move focus into modal when active, restore on close
    useEffect(() => {
        if (isActive && !hasResponded) {
            // Store the previously focused element (exact triggering control)
            previousFocusRef.current = document.activeElement as HTMLElement;
            // Focus the first interactive element (Deal button)
            setTimeout(() => dealButtonRef.current?.focus(), 100);
        } else if (!isActive && previousFocusRef.current) {
            // Restore focus to exact triggering control when modal closes
            previousFocusRef.current.focus();
            previousFocusRef.current = null;
        }
    }, [isActive, hasResponded]);

    // Focus trap: handle Tab and Shift+Tab cycling within modal
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key !== "Tab" || !isActive || hasResponded) return;

        const focusableElements = [dealButtonRef.current, noDealButtonRef.current].filter(Boolean);
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            // Shift+Tab: if on first element, wrap to last
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement?.focus();
            }
        } else {
            // Tab: if on last element, wrap to first
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement?.focus();
            }
        }
    };

    return (
        <div
            ref={containerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="banker-offer-title"
            aria-describedby="banker-offer-amount"
            tabIndex={-1}
            onKeyDown={handleKeyDown}
            className="banker-offer-container flex flex-col items-center justify-center h-full gap-6 focus:outline-none"
        >
            {/* Screen Reader Live Region for Offer Updates */}
            <div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
            >
                {isActive && !hasResponded
                    ? `The banker offers ${formatCurrency(amount)}. Deal or No Deal?`
                    : hasResponded
                        ? choseDeal
                            ? "You chose Deal. Waiting for other players."
                            : "You chose No Deal. Waiting for other players."
                        : "Waiting for banker offer."
                }
            </div>

            {/* Banker Phone Icon */}
            <div className="banker-phone w-20 h-20 rounded-full bg-studio-700 border-2 border-gold-500/30 flex items-center justify-center">
                <svg
                    className="w-10 h-10 text-gold-400"
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

            {/* Offer Label */}
            <p id="banker-offer-title" className="text-gold-300 text-sm uppercase tracking-widest font-display">
                The Banker Offers
            </p>

            {/* Offer Amount */}
            <div className="banker-amount-display">
                <span id="banker-offer-amount" className="banker-amount text-4xl sm:text-5xl lg:text-6xl">
                    {formatCurrency(amount)}
                </span>
            </div>

            {/* Response Status or Buttons */}
            {hasResponded ? (
                <div className="response-status text-center">
                    <p className="text-lg font-semibold mb-2">
                        {choseDeal ? (
                            <span className="text-danger-400">You chose DEAL</span>
                        ) : (
                            <span className="text-success-400">You chose NO DEAL</span>
                        )}
                    </p>
                    <p className="text-sm text-gray-500">Waiting for other players...</p>
                </div>
            ) : isActive ? (
                <>
                    {/* Countdown Timer */}
                    <div className="countdown-section">
                        <CountdownRing duration={totalTime} autoStart />
                    </div>

                    {/* Deal / No Deal Buttons */}
                    <div className="flex gap-4 w-full max-w-xs">
                        <button
                            ref={dealButtonRef}
                            onClick={onDeal}
                            disabled={!onDeal}
                            className="btn-deal flex-1 min-h-[56px] text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                            aria-label="Accept the deal"
                        >
                            Deal
                        </button>
                        <button
                            ref={noDealButtonRef}
                            onClick={onNoDeal}
                            disabled={!onNoDeal}
                            className="btn-no-deal flex-1 min-h-[56px] text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                            aria-label="Reject the deal"
                        >
                            No Deal
                        </button>
                    </div>
                </>
            ) : (
                <p className="text-gray-500 text-sm">Waiting for banker...</p>
            )}
        </div>
    );
}

/**
 * BankerOffer placeholder when no offer is active
 * 
 * @deprecated Use OfferZone inactive state instead.
 */
export function BankerWaiting() {
    return (
        <div className="banker-waiting flex flex-col items-center justify-center h-full gap-4">
            <div className="banker-phone w-16 h-16 rounded-full bg-studio-700 border-2 border-studio-500 flex items-center justify-center opacity-50">
                <svg
                    className="w-8 h-8 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                </svg>
            </div>
            <p className="text-gray-500 text-sm text-center">
                Open boxes to receive<br />a banker offer
            </p>
        </div>
    );
}
