import { ReactNode } from "react";

interface CardProps {
    /** Card content */
    children: ReactNode;
    /** Card title (optional header) */
    title?: string;
    /** Card variant for styling */
    variant?: "default" | "glass" | "glass-dark" | "glass-gold" | "elevated";
    /** Whether to show spotlight effect */
    spotlight?: boolean;
    /** Spotlight color variant */
    spotlightColor?: "default" | "gold" | "blue";
    /** Padding size */
    padding?: "none" | "sm" | "md" | "lg";
    /** Additional className */
    className?: string;
}

const variantClasses = {
    default: "bg-studio-700 border border-white/5",
    glass: "glass",
    "glass-dark": "glass-dark",
    "glass-gold": "glass-gold",
    elevated: "bg-studio-600 shadow-studio-elevated border border-white/5",
};

const paddingClasses = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
};

const spotlightClasses = {
    default: "spotlight",
    gold: "spotlight spotlight-gold",
    blue: "spotlight spotlight-blue",
};

/**
 * Card - Reusable container component with TV-studio styling
 * 
 * Provides consistent panel styling with glass effects and spotlight overlays.
 * Use for grouping related content in the game UI.
 * 
 * @example
 * <Card title="Players" variant="glass" padding="md">
 *   <PlayerList />
 * </Card>
 * 
 * <Card variant="glass-gold" spotlight spotlightColor="gold">
 *   <BankerOffer />
 * </Card>
 */
export function Card({
    children,
    title,
    variant = "glass",
    spotlight = false,
    spotlightColor = "default",
    padding = "md",
    className = "",
}: CardProps) {
    const baseClasses = "rounded-panel transition-all duration-200";
    const variantClass = variantClasses[variant];
    const paddingClass = paddingClasses[padding];
    const spotlightClass = spotlight ? spotlightClasses[spotlightColor] : "";

    return (
        <div
            className={`${baseClasses} ${variantClass} ${paddingClass} ${spotlightClass} ${className}`}
        >
            {title && (
                <h3 className="text-sm font-semibold text-gold-400 mb-3 font-display">
                    {title}
                </h3>
            )}
            {children}
        </div>
    );
}

/**
 * CardHeader - Separate header component for more complex cards
 */
export function CardHeader({
    children,
    className = "",
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`px-4 py-3 border-b border-white/5 -mx-4 -mt-4 mb-4 first:rounded-t-panel ${className}`}
        >
            {children}
        </div>
    );
}

/**
 * CardFooter - Footer section for cards with actions
 */
export function CardFooter({
    children,
    className = "",
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`px-4 py-3 border-t border-white/5 -mx-4 -mb-4 mt-4 last:rounded-b-panel ${className}`}
        >
            {children}
        </div>
    );
}
