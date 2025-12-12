"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { OfferZone } from "@/components/OfferZone";

/**
 * Test harness for OfferZone component - used by Playwright tests.
 * 
 * Query params:
 * - active: "true" | "false" - whether offer is active (default: false)
 * - amount: number - offer amount in pounds (default: 10000)
 * - duration: number - offer duration in seconds (default: 30)
 */
function OfferZoneTestHarness() {
    const searchParams = useSearchParams();

    // Parse query params
    const isActive = searchParams.get("active") === "true";
    const amount = parseInt(searchParams.get("amount") ?? "10000", 10);
    const duration = parseInt(searchParams.get("duration") ?? "30", 10);

    // State for tracking user response
    const [hasResponded, setHasResponded] = useState(false);
    const [choseDeal, setChoseDeal] = useState<boolean | undefined>(undefined);

    // Calculate expiresAt after mount to avoid hydration mismatch
    const [expiresAt, setExpiresAt] = useState<number | undefined>(undefined);

    useEffect(() => {
        if (isActive) {
            setExpiresAt(Date.now() + duration * 1000);
        } else {
            setExpiresAt(undefined);
        }
    }, [isActive, duration]);

    // If active, we only pass amount once expiresAt is calculated (after mount)
    // This ensures both are defined together for the active state
    const showActive = isActive && expiresAt !== undefined;

    const handleDeal = () => {
        setHasResponded(true);
        setChoseDeal(true);
        console.log("Deal clicked");
    };

    const handleNoDeal = () => {
        setHasResponded(true);
        setChoseDeal(false);
        console.log("No Deal clicked");
    };

    return (
        <div className="min-h-screen bg-studio-900 flex items-center justify-center p-8">
            <div className="w-full max-w-xl bg-studio-800 border border-studio-700 rounded-2xl p-8">
                <OfferZone
                    amount={showActive ? amount : undefined}
                    expiresAt={showActive ? expiresAt : undefined}
                    totalDuration={duration}
                    onDeal={handleDeal}
                    onNoDeal={handleNoDeal}
                    hasResponded={hasResponded}
                    choseDeal={choseDeal}
                />
            </div>
        </div>
    );
}

/**
 * Test page wrapper with Suspense for useSearchParams
 */
export default function OfferZoneTestPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-studio-900 flex items-center justify-center text-white">Loading...</div>}>
            <OfferZoneTestHarness />
        </Suspense>
    );
}
