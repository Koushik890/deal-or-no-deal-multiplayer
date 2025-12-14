"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { StageGrid } from "@/layouts/StageGrid";
import { RemainingBoard } from "@/components/RemainingBoard";
import { PlayerPanel } from "@/components/PlayerPanel";
import { BoxGrid } from "@/components/BoxGrid";
import { OfferZone } from "@/components/OfferZone";
import { BankerScreen } from "@/components/BankerScreen";
import { ChatPopup, ChatMessage } from "@/components/ChatPopup";
import { LeaderboardOverlay, LeaderboardScore } from "@/components/LeaderboardOverlay";
import { useGame } from "@/context/GameContext";
import { CountdownRingFromExpiry } from "@/components/CountdownRing";

import { useFeedbackOptional } from "@/context/FeedbackContext";

/**
 * Room Play Page
 * 
 * Main game page with StageGrid layout.
 * Uses turn-based single box opening system.
 * Shows remaining values, banker offers, players, and box grid.
 * All state comes from WebSocket via GameContext.
 */
export default function PlayPage() {
    const params = useParams();
    const router = useRouter();
    const roomCode = (params.code as string)?.toUpperCase() || "";

    const {
        state,
        openBox,
        respondToDeal,
        sendChatMessage
    } = useGame();

    const { playSound } = useFeedbackOptional();

    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
    const [hasResponded, setHasResponded] = useState(false);
    const [offerChoice, setOfferChoice] = useState<"deal" | "no-deal" | null>(null);

    // Redirect if not in correct room
    useEffect(() => {
        if (!state.roomCode && state.isConnected) {
            const timer = setTimeout(() => {
                if (!state.roomCode) {
                    router.push("/");
                }
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [state.roomCode, state.isConnected, router]);

    // Reset response state when offer starts/ends
    useEffect(() => {
        if (state.phase !== "offer" || state.currentOffer === null) {
            setHasResponded(false);
            setOfferChoice(null);
            return;
        }
        // New offer started
        setHasResponded(false);
        setOfferChoice(null);
    }, [state.phase, state.currentOffer]);

    // Show leaderboard when game finishes
    useEffect(() => {
        if (state.phase === "finished" && state.leaderboard.length > 0) {
            playSound('victory');
            setTimeout(() => setIsLeaderboardOpen(true), 1000);
        }
    }, [state.phase, state.leaderboard, playSound]);

    // Find current player
    const currentPlayer = state.players.find((p) => p.id === state.playerId);
    const isHost = currentPlayer?.isHost || false;
    const isSpectator = currentPlayer?.role === "spectator";
    const playerBoxNumber = currentPlayer?.boxNumber || null;
    const hasDealt = !isSpectator && (currentPlayer?.hasDealt || false);

    // Turn system
    const isMyTurn = state.isMyTurn;
    const currentTurnPlayer = state.players.find((p) => p.id === state.currentTurnPlayerId);
    const currentTurnPlayerName = currentTurnPlayer?.name || "Unknown";

    // Check if in offer phase
    const hasActiveOffer = state.phase === "offer" && state.currentOffer !== null;
    const bankerOfferAmount = state.currentOffer || 0;

    // Boxes opened and remaining this round
    const boxesToOpenThisRound = state.boxesToOpenThisRound;
    const boxesOpenedThisRound = state.boxesOpenedThisRound.length;
    const boxesRemainingThisRound = boxesToOpenThisRound - boxesOpenedThisRound;

    // Handle single box click - opens immediately if it's your turn
    const handleBoxClick = useCallback((boxNumber: number) => {
        if (hasActiveOffer || hasDealt || !isMyTurn) return;

        const box = state.boxes.find((b) => b.number === boxNumber);
        if (!box || box.isOpened || box.ownerId !== null) return;

        // Open the box immediately (single box per turn)
        openBox(boxNumber);
        playSound('box-open');
    }, [hasActiveOffer, hasDealt, isMyTurn, state.boxes, openBox, playSound]);

    const handleDeal = useCallback(() => {
        if (isSpectator) return;
        setHasResponded(true);
        setOfferChoice("deal");
        respondToDeal(true);
    }, [respondToDeal, isSpectator]);

    const handleNoDeal = useCallback(() => {
        if (isSpectator) return;
        setHasResponded(true);
        setOfferChoice("no-deal");
        respondToDeal(false);
    }, [respondToDeal, isSpectator]);

    const handleSendMessage = useCallback((content: string) => {
        if (isSpectator) return;
        sendChatMessage(content);
    }, [sendChatMessage, isSpectator]);

    // Convert state to component props - highlight current turn player
    const panelPlayers = state.players
        .filter((p) => p.role === "player")
        .map((p) => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
        isActive: !p.hasDealt && p.id === state.currentTurnPlayerId, // Active = current turn
        isReady: p.isReady,
        boxNumber: p.boxNumber || undefined,
        hasDealt: p.hasDealt,
        finalAmount: p.dealAmount || undefined,
    }));

    const gridBoxes = state.boxes.map((box) => ({
        number: box.number,
        isOpened: box.isOpened,
        isSelected: false, // No multi-select in turn-based system
        isPlayerBox: box.isPlayerBox,
        ownerId: box.ownerId,
        value: box.value || undefined,
    }));

    const chatMessages: ChatMessage[] = state.chatMessages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        senderName: m.senderName,
        content: m.content,
        timestamp: new Date(m.timestamp),
        isOwn: m.senderId === state.playerId,
    }));

    const leaderboardScores: LeaderboardScore[] = state.leaderboard.map((entry) => ({
        id: entry.playerId,
        playerName: entry.playerName,
        amount: entry.amount,
        points: entry.points,
        rank: entry.rank,
        isCurrentPlayer: entry.playerId === state.playerId,
    }));

    // Recently eliminated value for scorch animation
    const recentlyEliminatedValue = state.recentlyOpenedBox?.value;

    // Find deal amount for subtitle
    const myLeaderboardEntry = state.playerId
        ? state.leaderboard.find((e) => e.playerId === state.playerId)
        : undefined;

    const subtitle = (() => {
        if (!myLeaderboardEntry) return undefined;
        if (myLeaderboardEntry.amount <= 0) return undefined;
        if (myLeaderboardEntry.wasBoxValue) {
            return `Your box contained £${myLeaderboardEntry.amount.toLocaleString("en-GB")}`;
        }
        return `You accepted £${myLeaderboardEntry.amount.toLocaleString("en-GB")}`;
    })();

    // Get status message for the bottom panel
    const getStatusMessage = () => {
        if (hasDealt) return "Watching...";
        if (hasActiveOffer) return "Respond to the Banker's Offer";
        if (state.phase !== "playing") return "Waiting...";

        // During the brief pause between finishing a round and the banker offer appearing,
        // the server clears `currentTurnPlayerId` to prevent extra box opens.
        if (!state.currentTurnPlayerId) return "Awaiting the Banker's Offer...";
        
        if (isMyTurn) {
            return `Your Turn! Pick a box (${boxesRemainingThisRound} left this round)`;
        } else {
            return `${currentTurnPlayerName}'s turn (${boxesRemainingThisRound} boxes left this round)`;
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <TopBar
                roomCode={roomCode}
                playerName={state.playerName || "Player"}
                isHost={isHost}
                hasActiveOffer={hasActiveOffer}
            />

            <StageGrid
                className="flex-1"
                leftPanel={
                    <RemainingBoard
                        eliminatedValues={state.eliminatedValues}
                        showScorchAnimation
                        recentlyEliminated={recentlyEliminatedValue}
                    />
                }
                centre={
                    <div className="relative h-full">
                        {/* BankerScreen background layer */}
                        <div className="absolute inset-0 opacity-30 pointer-events-none">
                            <BankerScreen
                                isCallIncoming={hasActiveOffer}
                                isActive={hasActiveOffer}
                                showPhoneAnimation={hasActiveOffer && !hasResponded}
                            />
                        </div>

                        {/* OfferZone foreground */}
                        {!hasDealt ? (
                            <OfferZone
                                amount={hasActiveOffer ? bankerOfferAmount : undefined}
                                expiresAt={state.offerExpiresAt || undefined}
                                totalDuration={20}
                                onDeal={isSpectator ? undefined : handleDeal}
                                onNoDeal={isSpectator ? undefined : handleNoDeal}
                                hasResponded={hasResponded}
                                choseDeal={offerChoice === "deal"}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <div className="glass p-6 text-center">
                                    <p className="text-gold-400 font-display text-xl mb-2">
                                        {state.phase === "finished" && myLeaderboardEntry?.wasBoxValue
                                            ? "Your Box Was Revealed!"
                                            : "You've Dealt!"}
                                    </p>
                                    <p className="text-3xl font-bold text-white">
                                        £{(currentPlayer?.dealAmount || 0).toLocaleString("en-GB")}
                                    </p>
                                    <p className="text-gray-400 text-sm mt-2">
                                        {state.phase === "finished" && myLeaderboardEntry?.wasBoxValue
                                            ? "That’s what you would have won."
                                            : "Watch the remaining players..."}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                }
                rightPanel={
                    <div className="space-y-4">
                        <PlayerPanel
                            players={panelPlayers}
                            currentPlayerId={state.playerId || ""}
                            showReadyStatus={false}
                        />

                        {/* Small "This Game" leaderboard while playing */}
                        {state.phase !== "finished" && state.leaderboard.length > 0 && (
                            <div className="leaderboard-panel">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                                    <h3 className="text-xs font-bold text-gold-400 uppercase tracking-widest">
                                        This Game
                                    </h3>
                                    <button
                                        onClick={() => setIsLeaderboardOpen(true)}
                                        className="text-xs font-bold text-gray-300 hover:text-white transition-colors"
                                        aria-label="Open leaderboard"
                                    >
                                        View
                                    </button>
                                </div>
                                <div>
                                    {state.leaderboard.slice(0, 3).map((entry) => (
                                        <div key={entry.playerId} className={`leaderboard-row ${entry.rank <= 3 ? "top-3" : ""}`}>
                                            <div
                                                className={`leaderboard-rank ${entry.rank === 1 ? "gold" : entry.rank === 2 ? "silver" : "bronze"}`}
                                                aria-hidden="true"
                                            >
                                                {entry.rank}
                                            </div>
                                            <div className="ml-3 flex-1 min-w-0">
                                                <div className="text-sm font-bold text-gray-100 truncate">{entry.playerName}</div>
                                                <div className="text-[10px] text-gray-500 uppercase tracking-widest">Points</div>
                                            </div>
                                            <div className="text-sm font-mono font-bold text-gold-300">
                                                {entry.points}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                }
                bottomPanel={
                    <div>
                        {/* Turn Status Banner */}
                        <div className="mb-4">
                            <div className={`text-center py-3 px-4 rounded-xl ${
                                isMyTurn && state.phase === "playing" && !hasDealt
                                    ? "bg-gradient-to-r from-gold-600/30 via-gold-500/20 to-gold-600/30 border border-gold-500/50 animate-pulse"
                                    : "bg-studio-800/50 border border-white/10"
                            }`}>
                                <h3 className={`text-lg font-display font-semibold ${
                                    isMyTurn && state.phase === "playing" && !hasDealt
                                        ? "text-gold-300"
                                        : "text-gray-300"
                                }`}>
                                    {getStatusMessage()}
                                </h3>
                                
                                {/* Turn Timer */}
                                {state.phase === "playing" && state.turnExpiresAt && !hasDealt && (
                                    <div className="mt-2 flex justify-center">
                                        <CountdownRingFromExpiry
                                            expiresAt={state.turnExpiresAt}
                                            totalDuration={20}
                                            size={60}
                                            strokeWidth={4}
                                            color={isMyTurn ? "gold" : "blue"}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Round Progress */}
                        <div className="flex justify-center gap-2 mb-4">
                            <span className="text-sm text-gray-500">Round {state.currentRound}</span>
                            <span className="text-sm text-gray-600">•</span>
                            <span className="text-sm text-gray-400">
                                {boxesOpenedThisRound}/{boxesToOpenThisRound} boxes opened
                            </span>
                        </div>

                        <BoxGrid
                            boxes={gridBoxes}
                            onBoxClick={handleBoxClick}
                            canOpenBoxes={!hasActiveOffer && !hasDealt && state.phase === "playing" && isMyTurn}
                            boxesToOpen={1}
                            selectedThisRound={[]}
                        />
                    </div>
                }
                playerBoxArea={
                    isSpectator ? (
                        <div className="flex items-center justify-center gap-3">
                            <span className="text-sm text-gray-400">Mode:</span>
                            <span className="px-3 py-1 rounded-full bg-studio-800/60 border border-white/10 text-gold-300 text-xs font-bold uppercase tracking-widest">
                                Spectator
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-4">
                            <span className="text-sm text-gray-400">Your Box:</span>
                            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-gold-600 to-gold-700 border-2 border-gold-400 glow-gold flex items-center justify-center">
                                <span className="text-2xl font-display font-bold text-studio-900">
                                    {playerBoxNumber || "?"}
                                </span>
                            </div>
                            <span className="text-xs text-gray-500">Keep it safe!</span>
                        </div>
                    )
                }
            />

            {/* Chat Toggle Button */}
            <button
                onClick={() => setIsChatOpen(true)}
                className="fixed bottom-4 right-4 w-14 h-14 rounded-full bg-gold-500/20 hover:bg-gold-500/30 border border-gold-500/30 flex items-center justify-center text-gold-400 transition-all hover:scale-105 z-50"
                aria-label="Open chat"
                style={{ display: isChatOpen ? 'none' : 'flex' }}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                </svg>
                {chatMessages.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
                        {Math.min(chatMessages.length, 99)}
                    </span>
                )}
            </button>

            {/* Chat Popup */}
            <ChatPopup
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                messages={chatMessages}
                onSendMessage={isSpectator ? undefined : handleSendMessage}
                currentPlayerName={state.playerName || "Player"}
            />

            {/* Leaderboard Overlay */}
            <LeaderboardOverlay
                isOpen={isLeaderboardOpen}
                onClose={() => {
                    setIsLeaderboardOpen(false);
                    if (state.phase === "finished") {
                        router.push("/");
                    }
                }}
                scores={leaderboardScores}
                title={state.phase === "finished" ? "Game Finished" : "This Game"}
                subtitle={subtitle}
            />

            {/* Footer Disclaimer */}
            <footer className="px-4 pb-6 text-center">
                <p className="text-xs text-gray-500 opacity-70">
                    For entertainment only. No real money or gambling.
                </p>
            </footer>
        </div>
    );
}
