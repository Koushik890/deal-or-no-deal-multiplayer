// Component exports for Deal or No Deal
export { TopBar } from "./TopBar";
export { RemainingBoard, BOX_VALUES } from "./RemainingBoard";
export { PlayerPanel } from "./PlayerPanel";
export { BoxGrid } from "./BoxGrid";
export { BankerOffer, BankerWaiting } from "./BankerOffer";
export { CountdownRing, CountdownRingFromExpiry } from "./CountdownRing";
export { Logo, LogoMark } from "./Logo";
export { Card, CardHeader, CardFooter } from "./Card";
export { SkipLinks } from "./SkipLinks";
export { AnimationPauseProvider } from "./AnimationPauseProvider";

// Visual Components (Task 3)
export { BoxPodium, boxPodiumStyles } from "./BoxPodium";
export type { BoxPodiumState } from "./BoxPodium";
export { BankerScreen, bankerScreenStyles } from "./BankerScreen";
export { OfferZone, offerZoneStyles } from "./OfferZone";

// Auxiliary UI Components (Task 4)
export { ChatPopup } from "./ChatPopup";
export type { ChatMessage } from "./ChatPopup";
export { LeaderboardOverlay } from "./LeaderboardOverlay";
export type { LeaderboardScore } from "./LeaderboardOverlay";
export { GlobalLeaderboardOverlay } from "./GlobalLeaderboardOverlay";
export type { GlobalLeaderboardEntry } from "./GlobalLeaderboardOverlay";

// Accessibility (Task 5)
export { AccessibilityProvider, useAccessibility } from "../context/AccessibilityContext";
export { SettingsPanel } from "./SettingsPanel";


