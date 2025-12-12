import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import "./studio.css";
import { SkipLinks } from "@/components/SkipLinks";
import { AnimationPauseProvider } from "@/components/AnimationPauseProvider";
import { AccessibilityProvider } from "@/context/AccessibilityContext";
import { FeedbackProvider } from "@/context/FeedbackContext";
import { GameProvider } from "@/context/GameContext";

// Display font - geometric, bold, TV-show feel
const outfit = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// Body font - clean, readable sans-serif
const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Deal or No Deal – UK Multiplayer",
  description: "A real-time multiplayer Deal or No Deal game with UK currency values",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${inter.variable} antialiased studio-bg font-body`}
      >
        <AccessibilityProvider>
          <FeedbackProvider>
            <GameProvider>
              <div className="relative z-10 flex flex-col min-h-screen">
                <SkipLinks />
                <AnimationPauseProvider />
                {children}
              </div>
            </GameProvider>
          </FeedbackProvider>
        </AccessibilityProvider>
      </body>
    </html>
  );
}

