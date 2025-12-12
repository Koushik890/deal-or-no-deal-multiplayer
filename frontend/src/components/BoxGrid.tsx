"use client";

interface Box {
    number: number;
    isOpened: boolean;
    isSelected: boolean;
    isPlayerBox: boolean;
    value?: number; // Only revealed when opened
    ownerId?: string | null; // If set, this box is reserved as someone's personal box
}

interface BoxGridProps {
    /** Array of 20 boxes */
    boxes: Box[];
    /** Callback when a box is clicked */
    onBoxClick?: (boxNumber: number) => void;
    /** Whether boxes are selectable (during selection phase) */
    isSelectionPhase?: boolean;
    /** Whether boxes can be opened (during game phase) */
    canOpenBoxes?: boolean;
    /** Number of boxes to open this round */
    boxesToOpen?: number;
    /** Currently selected boxes this round (for multi-select) */
    selectedThisRound?: number[];
}

/**
 * Format currency for box reveal
 */
function formatCurrency(value: number): string {
    if (value < 1) {
        return `${(value * 100).toFixed(0)}p`;
    }
    return `£${value.toLocaleString("en-GB")}`;
}

/**
 * BoxGrid - Displays the 20 game boxes
 * 
 * Responsive grid with large tap targets (min 44x44).
 * Shows selection state, opened state, and player's box.
 */
export function BoxGrid({
    boxes,
    onBoxClick,
    isSelectionPhase = false,
    canOpenBoxes = false,
    boxesToOpen = 0,
    selectedThisRound = [],
}: BoxGridProps) {
    const handleClick = (box: Box) => {
        if (!onBoxClick) return;

        // Can't click opened boxes
        if (box.isOpened) return;

        // Can't click other players' reserved boxes (personal boxes are protected)
        if (box.ownerId && !box.isPlayerBox) return;

        // Can't click player's own box during game
        if (!isSelectionPhase && box.isPlayerBox) return;

        // Check if in valid phase
        if (!isSelectionPhase && !canOpenBoxes) return;

        onBoxClick(box.number);
    };

    return (
        <div className="box-grid">
            {boxesToOpen > 0 && (
                <div className="text-center mb-4">
                    <span className="text-sm text-gray-400">
                        Select{" "}
                        <span className="text-gold-400 font-bold">
                            {boxesToOpen - selectedThisRound.length}
                        </span>{" "}
                        {boxesToOpen - selectedThisRound.length === 1 ? "box" : "boxes"} to open
                    </span>
                </div>
            )}

            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3">
                {boxes.map((box) => (
                    <BoxItem
                        key={box.number}
                        box={box}
                        onClick={() => handleClick(box)}
                        isClickable={
                            !box.isOpened &&
                            !(box.ownerId && !box.isPlayerBox) &&
                            (isSelectionPhase || (canOpenBoxes && !box.isPlayerBox))
                        }
                        isSelectedThisRound={selectedThisRound.includes(box.number)}
                    />
                ))}
            </div>
        </div>
    );
}

interface BoxItemProps {
    box: Box;
    onClick: () => void;
    isClickable: boolean;
    isSelectedThisRound: boolean;
}

function BoxItem({ box, onClick, isClickable, isSelectedThisRound }: BoxItemProps) {
    // Determine box state styling
    const getBoxClasses = () => {
        const base = [
            "box-item relative flex items-center justify-center",
            "min-h-[56px] min-w-[56px] sm:min-h-[64px] sm:min-w-[64px]", // 44px+ tap targets
            "rounded-lg font-display font-bold text-lg sm:text-xl",
            "transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 focus:ring-offset-studio-900",
        ];

        if (box.isOpened) {
            // Opened box - show value or grey out
            return [
                ...base,
                "bg-studio-700/50 border-2 border-studio-600",
                "text-gray-500 cursor-default",
            ].join(" ");
        }

        if (box.ownerId && !box.isPlayerBox) {
            // Reserved by another player - protected box
            return [
                ...base,
                "bg-studio-800/40 border-2 border-white/10",
                "text-gray-500 cursor-not-allowed opacity-75",
            ].join(" ");
        }

        if (box.isPlayerBox) {
            // Player's own box - Premium Gold Shimmer
            return [
                ...base,
                "bg-gradient-to-br from-gold-500 via-yellow-400 to-gold-600", // Richer gradient
                "gold-shimmer", // Animated background
                "border-2 border-white/40 shadow-[0_0_20px_rgba(234,179,8,0.4)]",
                "text-studio-950",
                isClickable ? "cursor-pointer hover:scale-105 active:animate-pop-select" : "cursor-default",
            ].join(" ");
        }

        if (box.isSelected || isSelectedThisRound) {
            // Play Page Selection: Hazard Mode
            if (isSelectedThisRound) {
                return [
                    ...base,
                    "hazard-stripes", // Animated diagonal stripes
                    "border-2 border-red-500",
                    "text-white font-bold",
                    "cursor-pointer active:animate-pop-select",
                ].join(" ");
            }

            // Lobby Selection (Ownerless but selected): Danger Pulse
            return [
                ...base,
                "bg-gradient-to-br from-danger-600 to-danger-700",
                "border-2 border-danger-400",
                "text-white animate-pulse",
                "cursor-pointer active:animate-pop-select",
            ].join(" ");
        }

        // Default box
        return [
            ...base,
            "bg-gradient-to-br from-primary-700 to-primary-800",
            "border-2 border-gold-500/30",
            "text-white",
            isClickable
                ? "cursor-pointer hover:border-gold-500/60 hover:scale-105 hover:shadow-lg active:animate-pop-select"
                : "cursor-default opacity-75",
        ].join(" ");
    };

    return (
        <button
            onClick={onClick}
            disabled={!isClickable}
            className={getBoxClasses()}
            aria-label={`Box ${box.number}${box.isOpened ? ", opened" : ""}${box.isPlayerBox ? ", your box" : ""
                }`}
        >
            {box.isOpened && box.value !== undefined ? (
                <span className="text-xs sm:text-sm font-mono">
                    {formatCurrency(box.value)}
                </span>
            ) : (
                <span>{box.number}</span>
            )}

            {/* Player box indicator */}
            {box.isPlayerBox && !box.isOpened && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gold-400 border-2 border-studio-900 flex items-center justify-center">
                    <span className="text-[8px] font-bold text-studio-900">★</span>
                </div>
            )}

            {/* Reserved indicator */}
            {box.ownerId && !box.isPlayerBox && !box.isOpened && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-studio-950 border-2 border-white/10 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-gray-400">🔒</span>
                </div>
            )}
        </button>
    );
}

/**
 * BoxGrid CSS additions
 */
export const boxGridStyles = `
.box-grid .box-item {
  aspect-ratio: 1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.box-grid .box-item:not(:disabled):hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4), 0 0 15px rgba(212, 175, 55, 0.2);
}

.box-grid .box-item:not(:disabled):active {
  transform: scale(0.95);
}

/* Opened box reveal animation */
.box-grid .box-item.revealing {
  animation: box-reveal 0.6s ease-in-out;
}
`;
