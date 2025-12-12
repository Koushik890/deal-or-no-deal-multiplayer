"use client";

import { ReactNode } from "react";

interface StageGridProps {
    /** Left panel content (Remaining Money Board) */
    leftPanel?: ReactNode;
    /** Centre panel content (Banker Screen/Offer Podium) */
    centre?: ReactNode;
    /** Right panel content (Player Panel) */
    rightPanel?: ReactNode;
    /** Bottom content (Box Grid) */
    bottomPanel?: ReactNode;
    /** Player's selected box area */
    playerBoxArea?: ReactNode;
    /** Additional className for the grid container */
    className?: string;
}

/**
 * StageGrid - Main game stage layout
 * 
 * Responsive CSS grid layout:
 * - Mobile: Stacked single column
 * - Tablet (md): 2 columns
 * - Desktop (lg): 3 columns with bottom spanning full width
 * 
 * Uses TV-studio spotlight styling for the centre banker area.
 */
export function StageGrid({
    leftPanel,
    centre,
    rightPanel,
    bottomPanel,
    playerBoxArea,
    className = "",
}: StageGridProps) {
    return (
        <div id="main-content" className={`stage-grid w-full max-w-7xl mx-auto px-4 py-4 ${className}`}>
            {/* Main Grid - Responsive layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[280px_1fr_280px] gap-4 lg:gap-6 items-start">

                {/* Left Panel - Remaining Money Board */}
                <aside
                    className="stage-panel order-2 md:order-1 lg:order-1 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] overflow-y-auto no-scrollbar"
                    aria-label="Remaining money values"
                >
                    <div className="glass h-full p-4 rounded-panel">
                        {leftPanel || (
                            <div className="h-full min-h-[200px] flex items-center justify-center text-gray-500 text-sm">
                                Remaining Values
                            </div>
                        )}
                    </div>
                </aside>

                {/* Centre Column - Banker Offer & Game Boxes */}
                <div className="flex flex-col gap-4 lg:gap-6 order-1 md:col-span-2 lg:col-span-1 lg:order-2">
                    {/* Banker Screen / Offer Podium */}
                    <main
                        id="banker-offer"
                        className="stage-centre"
                        aria-label="Banker offer area"
                    >
                        <div className="glass spotlight spotlight-gold h-full p-6 rounded-panel min-h-[300px] lg:min-h-[400px]">
                            {centre || (
                                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                                    <span className="text-sm">Banker Area</span>
                                </div>
                            )}
                        </div>
                    </main>

                    {/* Bottom Panel - Box Grid (Now in Center Column) */}
                    {bottomPanel && (
                        <section
                            id="game-boxes"
                            className="stage-bottom"
                            aria-label="Game boxes"
                        >
                            <div className="glass p-4 lg:p-6 rounded-panel">
                                {bottomPanel}
                            </div>
                        </section>
                    )}

                    {/* Player Box Area - Personal selected box */}
                    {playerBoxArea && (
                        <section
                            className="stage-player-box"
                            aria-label="Your selected box"
                        >
                            <div className="glass-gold p-4 rounded-panel text-center">
                                {playerBoxArea}
                            </div>
                        </section>
                    )}
                </div>

                {/* Right Panel - Player Panel */}
                <aside
                    id="players"
                    className="stage-panel order-3 md:order-3 lg:order-3 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] overflow-y-auto no-scrollbar"
                    aria-label="Players in game"
                >
                    <div className="glass h-full p-4 rounded-panel">
                        {rightPanel || (
                            <div className="h-full min-h-[200px] flex items-center justify-center text-gray-500 text-sm">
                                Players
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}

/**
 * StageGrid CSS additions for studio.css
 */
export const stageGridStyles = `
/* Stage Grid Layout Styles */
.stage-grid {
  min-height: calc(100vh - 80px);
}

.stage-centre {
  position: relative;
}

.stage-centre::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 200%;
  height: 100%;
  background: radial-gradient(ellipse at center top, rgba(212, 175, 55, 0.05) 0%, transparent 60%);
  pointer-events: none;
  z-index: 0;
}

.stage-panel {
  transition: transform 0.2s ease;
}

@media (min-width: 1024px) {
  .stage-panel:hover {
    transform: translateY(-2px);
  }
}

/* Ensure panels fill height on desktop */
@media (min-width: 1024px) {
  .stage-grid > .grid {
    min-height: 500px;
  }
  
  .stage-grid > .grid > aside {
    display: flex;
    flex-direction: column;
  }
  
  .stage-grid > .grid > aside > div {
    flex: 1;
  }
}
`;
