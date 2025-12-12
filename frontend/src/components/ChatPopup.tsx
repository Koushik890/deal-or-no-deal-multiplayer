"use client";

import { useEffect, useRef, useCallback, useState } from "react";

export interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    timestamp: Date;
    isOwn?: boolean;
}

interface ChatPopupProps {
    /** Whether the chat popup is open */
    isOpen: boolean;
    /** Callback to close the popup */
    onClose: () => void;
    /** Array of chat messages */
    messages: ChatMessage[];
    /** Callback when user sends a message */
    onSendMessage?: (content: string) => void;
    /** Current player name (for distinguishing own messages) */
    currentPlayerName?: string;
    /** Aria label for the dialog */
    ariaLabel?: string;
}

/**
 * ChatPopup - Floating chat dialog with dark glass styling
 * 
 * Features:
 * - Dark glass background
 * - Slide-in animations for messages
 * - Focus management (trap focus when open, restore on close)
 * - Auto-scroll to latest message
 */
export function ChatPopup({
    isOpen,
    onClose,
    messages,
    onSendMessage,
    currentPlayerName,
    ariaLabel = "Game Chat",
}: ChatPopupProps) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLElement | null>(null);
    const [inputValue, setInputValue] = useState("");

    // Store the element that triggered the dialog open
    useEffect(() => {
        if (isOpen) {
            triggerRef.current = document.activeElement as HTMLElement;
        }
    }, [isOpen]);

    // Focus management: move focus into dialog when opened
    useEffect(() => {
        if (!isOpen) return;

        // Prefer focusing the input when sending is enabled, otherwise focus Close
        const target = onSendMessage ? inputRef.current : closeButtonRef.current;
        if (target) {
            // Small delay to ensure animation starts before focus
            const timer = setTimeout(() => {
                target?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen, onSendMessage]);

    // Restore focus when closed
    useEffect(() => {
        if (!isOpen && triggerRef.current) {
            triggerRef.current.focus();
            triggerRef.current = null;
        }
    }, [isOpen]);

    // Auto-scroll to latest message
    useEffect(() => {
        if (isOpen && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    // Handle Escape key to close
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === "Escape" && isOpen) {
            onClose();
        }
    }, [isOpen, onClose]);

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    // Focus trap
    useEffect(() => {
        if (!isOpen || !dialogRef.current) return;

        const dialog = dialogRef.current;
        const focusableElements = dialog.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleTabKey = (e: KeyboardEvent) => {
            if (e.key !== "Tab") return;

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
        };

        dialog.addEventListener("keydown", handleTabKey);
        return () => dialog.removeEventListener("keydown", handleTabKey);
    }, [isOpen]);

    const handleSendMessage = () => {
        if (inputValue.trim() && onSendMessage) {
            onSendMessage(inputValue.trim());
            setInputValue("");
        }
    };

    const handleInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="chat-popup animate-slideUp"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
        >
            <div className="chat-popup-container glass-dark rounded-xl overflow-hidden shadow-2xl border border-gold-500/20">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <h2 className="text-sm font-semibold text-gold-400 font-display">
                        Game Chat
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                        aria-label="Close chat"
                        ref={closeButtonRef}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Messages - role='log' for screen reader announcements */}
                <div
                    className="chat-messages px-4 py-3 space-y-3 max-h-[280px] overflow-y-auto"
                    role="log"
                    aria-live="polite"
                    aria-label="Chat messages"
                    aria-relevant="additions"
                >
                    {messages.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4">
                            No messages yet. Start the conversation!
                        </p>
                    ) : (
                        messages.map((message, index) => {
                            const isOwn = message.isOwn || message.senderName === currentPlayerName;
                            return (
                                <div
                                    key={message.id}
                                    className={`chat-message ${isOwn ? "outgoing" : ""}`}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div
                                        className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
                                    >
                                        {!isOwn && (
                                            <span className="text-xs text-gold-400 font-medium mb-1">
                                                {message.senderName}
                                            </span>
                                        )}
                                        <div
                                            className={`px-3 py-2 rounded-lg max-w-[85%] ${isOwn
                                                ? "bg-primary-600/50 text-white"
                                                : "bg-studio-700/70 text-gray-200"
                                                }`}
                                        >
                                            <p className="text-sm">{message.content}</p>
                                        </div>
                                        <time
                                            className="text-[10px] text-gray-600 mt-0.5"
                                            dateTime={message.timestamp.toISOString()}
                                            aria-label={formatAccessibleTime(message.timestamp)}
                                        >
                                            {formatTime(message.timestamp)}
                                        </time>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="px-4 py-3 border-t border-white/10">
                    {onSendMessage ? (
                        <div className="flex gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleInputKeyDown}
                                placeholder="Type a message..."
                                className="flex-1 bg-studio-700/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30"
                                aria-label="Chat message input"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!inputValue.trim()}
                                className="px-4 py-2 bg-gold-500/20 hover:bg-gold-500/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-gold-400 text-sm font-medium transition-colors"
                                aria-label="Send message"
                            >
                                Send
                            </button>
                        </div>
                    ) : (
                        <p className="text-xs text-gray-500">
                            Spectators can read chat, but sending messages is disabled.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

function formatTime(date: Date): string {
    return date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatAccessibleTime(date: Date): string {
    return date.toLocaleTimeString("en-GB", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}
