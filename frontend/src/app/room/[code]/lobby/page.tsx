"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { PlayerPanel } from "@/components/PlayerPanel";
import { BoxGrid } from "@/components/BoxGrid";
import { useGame } from "@/context/GameContext";

import { LogoMark } from "@/components/Logo";

/**
 * Room Lobby Page
 * 
 * Players wait here before the game starts.
 * Host can start the game when all players are ready.
 * Players select their personal box.
 */
export default function LobbyPage() {
    const params = useParams();
    const router = useRouter();
    const roomCode = (params.code as string)?.toUpperCase() || "";

    const { state, selectBox, setReady, startGame, setRoomPassword } = useGame();

    // Redirect if not in a room
    useEffect(() => {
        if (!state.roomCode && state.isConnected) {
            // Give a moment for state to sync
            const timer = setTimeout(() => {
                if (!state.roomCode) {
                    router.push("/");
                }
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [state.roomCode, state.isConnected, router]);

    // Navigate to play page when game starts
    useEffect(() => {
        if (state.phase === "playing" || state.phase === "offer") {
            router.push(`/room/${roomCode}/play`);
        }
    }, [state.phase, roomCode, router]);

    // Find current player
    const currentPlayer = state.players.find((p) => p.id === state.playerId);
    const isHost = currentPlayer?.isHost || false;
    const isSpectator = currentPlayer?.role === "spectator";
    const selectedBox = currentPlayer?.boxNumber || null;
    const isReady = currentPlayer?.isReady || false;

    // Check if all (non-spectator) players are ready
    const playerContestants = state.players.filter((p) => p.role === "player");
    const allPlayersReady = playerContestants.length >= 2 &&
        playerContestants.every((p) => p.isReady && p.boxNumber !== null);

    const handleBoxClick = (boxNumber: number) => {
        if (!isReady && !isSpectator) {
            selectBox(boxNumber);
        }
    };

    const handleReady = () => {
        if (selectedBox && !isReady && !isSpectator) {
            setReady();
        }
    };

    const handleStartGame = () => {
        if (isHost && allPlayersReady) {
            startGame();
        }
    };

    // Copy room code to clipboard with feedback
    const [copied, setCopied] = useState(false);

    const handleCopyCode = async () => {
        const codeToShare = state.roomCode || roomCode;

        try {
            // Try modern clipboard API first
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(codeToShare);
            } else {
                // Fallback for older browsers or non-secure contexts
                const textArea = document.createElement('textarea');
                textArea.value = codeToShare;
                textArea.style.position = 'fixed';
                textArea.style.left = '-9999px';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }

            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Create boxes array for display
    const boxes = Array.from({ length: 20 }, (_, i) => {
        const boxNumber = i + 1;
        // Check if this box is taken by any player
        const owner = state.players.find((p) => p.boxNumber === boxNumber);
        return {
            number: boxNumber,
            isOpened: false,
            isSelected: owner !== undefined,
            isPlayerBox: owner?.id === state.playerId,
            ownerId: owner?.id || null,
            value: undefined,
        };
    });

    // Convert players for PlayerPanel
    const panelPlayers = state.players
        .filter((p) => p.role === "player")
        .map((p) => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
        isActive: false, // No one is active in lobby phase
        boxNumber: p.boxNumber || undefined,
        isReady: p.isReady,
        hasDealt: false,
    }));

    // Host-only password controls (optional)
    const [passwordDraft, setPasswordDraft] = useState("");
    const [passwordStatus, setPasswordStatus] = useState<string | null>(null);

    const handleSetPassword = async () => {
        setPasswordStatus(null);
        const value = passwordDraft.trim();
        const res = await setRoomPassword(value.length ? value : null);
        if (res.success) {
            setPasswordStatus(value.length ? "Password set" : "Password cleared");
        } else {
            setPasswordStatus(res.error || "Could not update password");
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <TopBar
                roomCode={roomCode}
                playerName={state.playerName || "Player"}
                isHost={isHost}
            />

            <main
                id="main-content"
                className="flex-1 px-4 py-8 max-w-5xl mx-auto w-full flex flex-col items-center"
            >
                {/* Room Header with LogoMark */}
                <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="flex justify-center mb-4">
                        <LogoMark size="md" className="scale-125 shadow-2xl shadow-gold-500/10" />
                    </div>
                    <div className="inline-block px-4 py-1 rounded-full border border-gold-500/20 bg-gold-500/5 backdrop-blur-md mb-2">
                        <span className="text-gold-400 text-xs font-bold tracking-[0.3em] uppercase">
                            Room Lobby
                        </span>
                    </div>
                    <h1 className="text-4xl font-display font-bold text-white mb-2 tracking-tight">
                        Prepare for the Game
                    </h1>
                    <p className="text-gray-400">
                        {isSpectator
                            ? "You are spectating. You can watch live, but you cannot pick boxes or start the game."
                            : isHost
                                ? "Waiting for contestants to take their positions..."
                                : "Choose your lucky box to begin!"}
                    </p>
                </div>

                <div className="grid lg:grid-cols-[1fr_350px] gap-8 w-full">
                    {/* Box Selection - Main Stage */}
                    <section id="game-boxes" className="relative group h-full">
                        <div className="absolute -inset-1 bg-gradient-to-r from-gold-500/10 to-blue-600/10 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
                        <div
                            className="relative glass-dark p-6 sm:p-8 rounded-2xl border border-white/5 shadow-2xl h-full flex flex-col justify-center overflow-hidden"
                            style={{
                                backgroundImage: "url('/images/lobby_card_bg.png')",
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                            }}
                        >
                            {/* Dark Overlay for contrast */}
                            <div className="absolute inset-0 bg-studio-950/80 pointer-events-none" />

                            <div className="relative z-10 w-full">
                                <h2 className="text-xl font-display font-semibold text-white mb-6 flex items-center justify-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gold-500/20 text-gold-400 text-sm border border-gold-500/30">1</span>
                                    {isSpectator
                                        ? "Box Selection (Spectator View)"
                                        : selectedBox
                                            ? `Your Lucky Box: #${selectedBox}`
                                            : "Select Your Box"}
                                </h2>

                                <BoxGrid
                                    boxes={boxes}
                                    onBoxClick={handleBoxClick}
                                    isSelectionPhase={!isReady && !isSpectator}
                                />

                                {/* Ready Button */}
                                {selectedBox && !isReady && !isSpectator && (
                                    <div className="mt-8 text-center animate-in zoom-in duration-300">
                                        <button
                                            onClick={handleReady}
                                            className="btn-deal min-h-[64px] px-12 text-xl shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:shadow-[0_0_50px_rgba(220,38,38,0.6)] animate-pulse"
                                        >
                                            I&apos;m Ready!
                                        </button>
                                    </div>
                                )}

                                {isReady && !isSpectator && (
                                    <div className="mt-8 text-center p-4 rounded-xl bg-success-950/30 border border-success-500/30 animate-in fade-in">
                                        <p className="text-success-400 font-bold text-lg flex items-center justify-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-success-500 flex items-center justify-center text-black text-sm">✓</span>
                                            You are locked in!
                                        </p>
                                        <p className="text-success-400/70 text-sm mt-1">Waiting for other players...</p>
                                    </div>
                                )}

                                {isSpectator && (
                                    <div className="mt-8 text-center p-4 rounded-xl bg-studio-900/40 border border-white/10 animate-in fade-in">
                                        <p className="text-gray-300 font-medium">
                                            Spectators can watch the box board and the players, but cannot take actions.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Sidebar: Players & Controls */}
                    <aside className="space-y-6">
                        {/* Golden Ticket / Share Code */}
                        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gold-600 to-yellow-500 p-[1px] shadow-lg shadow-gold-900/20">
                            <div className="bg-studio-900 rounded-xl p-5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-10">
                                    <LogoMark size="lg" />
                                </div>
                                <p className="text-gold-200 text-xs font-bold uppercase tracking-widest mb-3 opacity-80">
                                    Room Access Pass
                                </p>
                                <div className="flex items-center justify-between bg-black/40 rounded-lg p-3 border border-gold-500/20 mb-3">
                                    <code className="text-2xl font-mono font-bold text-gold-400 tracking-wider">
                                        {roomCode}
                                    </code>
                                    <button
                                        onClick={handleCopyCode}
                                        className="text-gold-500 hover:text-white transition-colors p-2 hover:bg-gold-500/20 rounded-md"
                                        title="Copy Code"
                                    >
                                        {copied ? "✓" : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                        )}
                                    </button>
                                </div>
                                <p className="text-center text-[10px] text-gold-500/60 uppercase tracking-widest">
                                    Share with friends
                                </p>
                            </div>
                        </div>

                        {/* Players Panel */}
                        <div id="players" className="glass p-5">
                            <PlayerPanel
                                players={panelPlayers}
                                currentPlayerId={state.playerId || ""}
                                maxPlayers={6}
                            />

                            {/* Host Controls */}
                            {isHost && !isSpectator && (
                                <div className="mt-6 pt-6 border-t border-white/10">
                                    <button
                                        onClick={handleStartGame}
                                        disabled={!allPlayersReady}
                                        className={`w-full min-h-[60px] rounded-xl font-bold text-lg transition-all shadow-lg ${allPlayersReady
                                            ? "bg-gradient-to-r from-gold-500 via-yellow-400 to-gold-600 text-studio-950 hover:scale-[1.02] hover:shadow-gold-500/20"
                                            : "bg-studio-800 text-gray-600 cursor-not-allowed border border-white/5"
                                            }`}
                                    >
                                        {allPlayersReady ? "START THE GAME" : "Waiting for Players..."}
                                    </button>
                                </div>
                            )}

                            {/* Host: Optional room password */}
                            {isHost && !isSpectator && (
                                <div className="mt-6 pt-6 border-t border-white/10">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                                        Room Password (optional)
                                    </h3>
                                    <div className="flex gap-2">
                                        <input
                                            type="password"
                                            value={passwordDraft}
                                            onChange={(e) => setPasswordDraft(e.target.value)}
                                            placeholder="Set a password"
                                            maxLength={64}
                                            className="flex-1 min-h-[44px] rounded-lg bg-studio-950/50 border border-white/10 px-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold-500/40"
                                            aria-label="Room password"
                                        />
                                        <button
                                            onClick={handleSetPassword}
                                            className="min-h-[44px] px-4 rounded-lg bg-gold-500/20 hover:bg-gold-500/30 border border-gold-500/30 text-gold-300 font-bold text-sm"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                    {passwordStatus && (
                                        <p className="text-xs text-gray-400 mt-2">{passwordStatus}</p>
                                    )}
                                    <p className="text-[10px] text-gray-500 mt-2">
                                        If set, players must enter the password to join. Spectators can still join with the password.
                                    </p>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}
