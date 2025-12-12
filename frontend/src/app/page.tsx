"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import { LogoMark } from "@/components/Logo";
import { getAvatarForName } from "@/lib/avatar";

/**
 * Home Page - Entry point for the game
 * 
 * Premium "Game Show" aesthetic redesign.
 */
export default function Home() {
  const router = useRouter();
  const { state, createRoom, joinRoom } = useGame();

  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [joinAsSpectator, setJoinAsSpectator] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showJoinForm, setShowJoinForm] = useState(false);

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setError("Please enter your name");
      return;
    }

    setError(null);
    setIsCreating(true);

    try {
      const result = await createRoom(playerName.trim());
      if (result.success && result.roomCode) {
        router.push(`/room/${result.roomCode}/lobby`);
      } else {
        setError(result.error || "Failed to create room");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!roomCode.trim()) {
      setError("Please enter a room code");
      return;
    }

    setError(null);
    setIsJoining(true);

    try {
      const result = await joinRoom(roomCode.trim().toUpperCase(), playerName.trim(), {
        password: roomPassword.trim() ? roomPassword.trim() : undefined,
        asSpectator: joinAsSpectator,
      });
      if (result.success) {
        router.push(`/room/${roomCode.trim().toUpperCase()}/lobby`);
      } else {
        setError(result.error || "Failed to join room");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <main
      id="main-content"
      className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-studio-800 to-studio-950"
    >

      {/* Main Card */}
      <div className="relative glass p-8 sm:p-12 max-w-lg w-full text-center shadow-2xl border-t border-white/10 overflow-hidden group">

        {/* Ambient Glow Effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gold-500/10 blur-[60px] rounded-full pointer-events-none" />

        {/* Hero Section */}
        <div className="relative z-10 mb-10">
          <div className="flex justify-center mb-6">
            <div className="relative group-hover:scale-105 transition-transform duration-500">
              <LogoMark size="lg" className="scale-125 shadow-gold-500/20 shadow-2xl" />
            </div>
          </div>

          <h1 className="text-5xl sm:text-6xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-sm mb-2 tracking-tight">
            DEAL <span className="text-gold-500 font-serif italic text-3xl align-middle mx-1">or</span> NO DEAL
          </h1>

          <div className="mb-6">
            <span className="inline-block px-3 py-1 rounded-md border border-gold-500/30 bg-gold-500/10 text-gold-400 text-[10px] font-bold tracking-[0.2em] uppercase shadow-sm">
              UK Edition
            </span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-studio-800/50 border border-white/5 backdrop-blur-md">
            <span className={`w-1.5 h-1.5 rounded-full ${state.isConnected ? 'bg-success-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-danger-400 animate-pulse'}`} />
            <span className="text-[10px] font-bold tracking-widest uppercase text-gray-500">
              {state.isConnected ? 'Server Online' : 'Connecting...'}
            </span>
          </div>
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-danger-950/40 border border-danger-500/30 text-danger-200 text-sm font-medium flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            {error}
          </div>
        )}

        {/* Input Section */}
        <div className="space-y-6 relative z-10">
          <div className="group/input text-left">
            <label htmlFor="playerName" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1 group-focus-within/input:text-gold-400 transition-colors">
              Enter Your Name
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/input:text-gold-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              </div>
              <input
                id="playerName"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="e.g. The Banker"
                maxLength={16}
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-studio-950/50 border-2 border-white/5 text-white placeholder-gray-600 focus:outline-none focus:border-gold-500/50 focus:bg-studio-900/80 focus:shadow-[0_0_20px_rgba(234,179,8,0.1)] transition-all font-medium text-lg"
              />
            </div>
          </div>

          {!showJoinForm ? (
            <div className="space-y-4 pt-2">
              <button
                onClick={handleCreateRoom}
                disabled={isCreating || !state.isConnected}
                className="w-full py-6 rounded-2xl font-display font-black text-2xl tracking-widest uppercase bg-gradient-to-b from-gold-300 via-gold-500 to-gold-700 text-studio-950 shadow-[0_0_30px_rgba(234,179,8,0.3)] border-t border-white/50 border-b border-gold-900/50 hover:shadow-[0_0_50px_rgba(234,179,8,0.6)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300 relative overflow-hidden group/btn"
              >
                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-in-out skew-x-12" />

                <span className="relative flex items-center justify-center gap-3 drop-shadow-sm">
                  {isCreating ? (
                    <>
                      <span className="w-6 h-6 border-4 border-studio-900 border-t-transparent rounded-full animate-spin" />
                      CREATING...
                    </>
                  ) : (
                    <>
                      CREATE ROOM
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover/btn:translate-x-1 transition-transform"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                    </>
                  )}
                </span>
              </button>

              <button
                onClick={() => setShowJoinForm(true)}
                className="w-full py-4 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2 group/join"
              >
                Have a code? <span className="text-white group-hover/join:underline decoration-gold-500 underline-offset-4 decoration-2">Join a Room</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-bottom-4">
              <div className="group/input text-left">
                <label htmlFor="roomCode" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1 group-focus-within/input:text-primary-400 transition-colors">
                  Room Code
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/input:text-primary-400 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>
                  </div>
                  <input
                    id="roomCode"
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="ABCD12"
                    maxLength={6}
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-studio-950/50 border-2 border-white/5 text-white placeholder-gray-600 focus:outline-none focus:border-primary-500/50 focus:bg-studio-900/80 focus:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all font-mono font-bold text-xl tracking-[0.2em] uppercase"
                  />
                </div>
              </div>

              {/* Optional Password */}
              <div className="group/input text-left">
                <label htmlFor="roomPassword" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1 group-focus-within/input:text-primary-400 transition-colors">
                  Password (optional)
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/input:text-primary-400 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  </div>
                  <input
                    id="roomPassword"
                    type="password"
                    value={roomPassword}
                    onChange={(e) => setRoomPassword(e.target.value)}
                    placeholder="If the host set one"
                    maxLength={64}
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-studio-950/50 border-2 border-white/5 text-white placeholder-gray-600 focus:outline-none focus:border-primary-500/50 focus:bg-studio-900/80 focus:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all font-medium text-lg"
                  />
                </div>
              </div>

              {/* Spectator Toggle */}
              <label className="flex items-start gap-3 rounded-xl border border-white/5 bg-black/20 p-4 cursor-pointer hover:bg-white/5 transition-colors">
                <input
                  type="checkbox"
                  checked={joinAsSpectator}
                  onChange={(e) => setJoinAsSpectator(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-2 border-white/20 bg-studio-950 text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-studio-900"
                />
                <span className="flex flex-col">
                  <span className="text-sm font-bold text-gray-200">Join as spectator</span>
                  <span className="text-xs text-gray-500">Watch the game live (no box picks and chat is read-only).</span>
                </span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowJoinForm(false)}
                  className="py-4 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinRoom}
                  disabled={isJoining || !state.isConnected}
                  className="py-4 rounded-xl font-bold text-white bg-primary-600 hover:bg-primary-500 hover:shadow-lg hover:shadow-primary-600/20 active:scale-95 disabled:opacity-50 disabled:transform-none transition-all"
                >
                  {isJoining ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </span>
                  ) : (
                    "JOIN ROOM"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Value Props */}
      <div className="mt-8 flex flex-wrap justify-center gap-4 sm:gap-8 opacity-60 hover:opacity-100 transition-opacity duration-500">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/20 backdrop-blur-sm border border-white/5">
          <span className="text-xl">👥</span>
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">Multiplayer</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/20 backdrop-blur-sm border border-white/5">
          <span className="text-xl">🇬🇧</span>
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">UK Values</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/20 backdrop-blur-sm border border-white/5">
          <span className="text-xl">⚡</span>
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">Real-time</span>
        </div>
      </div>

      {/* Disclaimer */}
      <footer className="mt-8 text-center">
        <p className="text-xs text-gray-500 opacity-70">
          For entertainment only. No real money or gambling.
        </p>
      </footer>
    </main>
  );
}

