"use client";

import { useState, useEffect } from "react";
import { CountdownRingFromExpiry } from "@/components/CountdownRing";

export default function CountdownTestPage() {
    const [expiresAt, setExpiresAt] = useState<number>(0);
    const [duration, setDuration] = useState(30);
    const [currentTime, setCurrentTime] = useState<number>(Date.now());
    const [drift, setDrift] = useState<number>(0);

    // Initial setup
    useEffect(() => {
        resetTimer();

        // Update current time display every 100ms
        const interval = setInterval(() => {
            setCurrentTime(Date.now());
        }, 100);

        return () => clearInterval(interval);
    }, []);

    const resetTimer = () => {
        setExpiresAt(Date.now() + duration * 1000);
    };

    // Calculate strict wall-clock remaining time
    const wallClockRemaining = Math.max(0, Math.ceil((expiresAt - currentTime) / 1000));

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
            <h1 className="text-3xl font-bold mb-8 text-gold-400">Countdown Logic Verification</h1>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Control Panel */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h2 className="text-xl font-semibold mb-4">Controls</h2>

                    <div className="flex gap-4 mb-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm text-gray-400">Duration (s)</label>
                            <input
                                type="number"
                                value={duration}
                                onChange={(e) => setDuration(Number(e.target.value))}
                                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 w-24"
                            />
                        </div>
                        <button
                            onClick={resetTimer}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded mt-auto h-[42px]"
                        >
                            Reset Timer
                        </button>
                    </div>

                    <div className="bg-gray-900 p-4 rounded-lg font-mono text-sm space-y-2">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Expires At:</span>
                            <span>{new Date(expiresAt).toLocaleTimeString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Current Time:</span>
                            <span>{new Date(currentTime).toLocaleTimeString()}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-green-400 border-t border-gray-700 pt-2 mt-2">
                            <span>Wall Clock Remaining:</span>
                            <span>{wallClockRemaining}s</span>
                        </div>
                    </div>
                </div>

                {/* Test Area */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col items-center justify-center">
                    <h2 className="text-xl font-semibold mb-6">Component Instance</h2>

                    <div className="p-8 bg-gray-900 rounded-lg border border-gray-700 mb-6">
                        {expiresAt > 0 && (
                            <CountdownRingFromExpiry
                                expiresAt={expiresAt}
                                totalDuration={duration}
                                size={160}
                                strokeWidth={8}
                            />
                        )}
                    </div>

                    <p className="text-center text-gray-400 max-w-sm">
                        The visual ring above uses <code>useCountdownFromExpiry</code>.
                    </p>
                </div>
            </div>

            {/* Instructions */}
            <div className="mt-8 bg-gray-800 p-6 rounded-xl border border-orange-500/30">
                <h3 className="text-lg font-bold text-orange-400 mb-2">Verification Steps</h3>
                <ol className="list-decimal pl-5 space-y-2 text-gray-300">
                    <li>Set duration to 30s and click <strong>Reset Timer</strong>.</li>
                    <li>Verify both "Wall Clock Remaining" and the Ring show the same 30s count.</li>
                    <li><strong>Minimize this window</strong> or switch tabs for 10-15 seconds.</li>
                    <li>Restore the window.</li>
                    <li><strong>Observation:</strong> The ring should <em>instantaneously</em> jump to the correct remaining time (e.g. 15s) rather than counting down from where it paused (e.g. 29s).</li>
                    <li>This confirms <code>useCountdownFromExpiry</code> is using <code>Date.now()</code> correctly and handling the paused interval.</li>
                </ol>
            </div>
        </div>
    );
}
