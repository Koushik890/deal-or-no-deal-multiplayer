"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Target IDs for skip links - must match landmarks in page components
 */
const SKIP_LINK_TARGETS = [
  { id: "main-content", label: "Skip to main content" },
  { id: "banker-offer", label: "Skip to banker offer" },
  { id: "game-boxes", label: "Skip to game boxes" },
  { id: "players", label: "Skip to players" },
] as const;

/**
 * SkipLinks - Keyboard navigation skip links
 * 
 * Provides quick navigation for keyboard and screen reader users.
 * Links are visually hidden until focused.
 * 
 * Runtime health check: In development mode, verifies all target IDs
 * exist in the DOM and logs warnings for broken anchors.
 */
export function SkipLinks() {
  const pathname = usePathname() || "/";

  const isRoomLobby = pathname.includes("/room/") && pathname.endsWith("/lobby");
  const isRoomPlay = pathname.includes("/room/") && pathname.endsWith("/play");

  // Only render skip links that are relevant for the current route.
  // (The home page doesn't have banker/boxes/players landmarks, etc.)
  const visibleTargets = (() => {
    if (isRoomPlay) return SKIP_LINK_TARGETS;
    if (isRoomLobby) return SKIP_LINK_TARGETS.filter((t) => t.id !== "banker-offer");
    return SKIP_LINK_TARGETS.filter((t) => t.id === "main-content");
  })();

  // Runtime health check for landmark anchors (dev mode only)
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    // Delay check to allow page to mount fully
    const timer = setTimeout(() => {
      const missingAnchors: string[] = [];

      visibleTargets.forEach(({ id, label }) => {
        const element = document.getElementById(id);
        if (!element) {
          missingAnchors.push(`#${id} (${label})`);
        }
      });

      if (missingAnchors.length > 0) {
        console.warn(
          `[SkipLinks] Missing landmark anchors for route "${pathname}":\n` +
          missingAnchors.map(a => `  - ${a}`).join("\n") +
          `\n\nAdd id="${missingAnchors[0]?.match(/#(\w+)/)?.[1]}" to the corresponding element.`
        );
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [pathname, isRoomLobby, isRoomPlay]);

  return (
    <nav aria-label="Skip navigation" className="fixed top-0 left-0 z-[100] flex flex-col items-start pointer-events-none">
      {visibleTargets.map(({ id, label }) => (
        <a
          key={id}
          href={`#${id}`}
          className="sr-only focus:not-sr-only focus:pointer-events-auto bg-studio-950 text-gold-400 px-6 py-3 font-bold border-2 border-gold-400 rounded-br-lg shadow-xl outline-none focus:ring-4 focus:ring-gold-500/50 mb-2 transition-transform"
        >
          {label}
        </a>
      ))}
    </nav>
  );
}
