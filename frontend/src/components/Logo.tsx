"use client";

interface LogoProps {
    /** Size variant */
    size?: "sm" | "md" | "lg";
    /** Whether to show the full text */
    showText?: boolean;
    /** Additional className */
    className?: string;
}

const sizeMap = {
    sm: { container: "w-8 h-8", text: "text-sm" },
    md: { container: "w-12 h-12", text: "text-lg" },
    lg: { container: "w-20 h-20", text: "text-2xl" },
};

/**
 * Logo - Deal or No Deal branding component
 * 
 * Displays the iconic Red Box logo.
 * Uses SVG for a sharp, premium 3D effect matching the TV show asset style.
 */
export function Logo({ size = "md", showText = true, className = "" }: LogoProps) {
    const sizes = sizeMap[size];

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {/* 3D Red Box Icon */}
            <div className={`${sizes.container} relative flex items-center justify-center drop-shadow-2xl hover:scale-110 transition-transform duration-300`}>
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full filter drop-shadow-lg">
                    {/* Box Body Gradient Definitions */}
                    <defs>
                        <linearGradient id="boxGradient" x1="0" y1="0" x2="100" y2="100">
                            <stop offset="0%" stopColor="#ef4444" />
                            <stop offset="50%" stopColor="#dc2626" />
                            <stop offset="100%" stopColor="#991b1b" />
                        </linearGradient>
                        <linearGradient id="goldGradient" x1="0" y1="0" x2="100" y2="100">
                            <stop offset="0%" stopColor="#fcd34d" />
                            <stop offset="40%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#b45309" />
                        </linearGradient>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    {/* Perspective Box Body */}
                    <path
                        d="M15 30 L85 30 L95 40 L95 85 L85 95 L15 95 L5 85 L5 40 Z"
                        fill="url(#boxGradient)"
                        stroke="#7f1d1d"
                        strokeWidth="2"
                    />

                    {/* Box Lid Highlight */}
                    <path d="M15 30 L85 30 L75 20 L25 20 Z" fill="#ef4444" opacity="0.8" />

                    {/* Gold Clasps/Straps */}
                    <rect x="25" y="30" width="8" height="65" fill="url(#goldGradient)" rx="1" className="shadow-sm" />
                    <rect x="67" y="30" width="8" height="65" fill="url(#goldGradient)" rx="1" />

                    {/* Center Seal/Circle */}
                    <circle cx="50" cy="55" r="14" fill="#601010" stroke="#fcd34d" strokeWidth="2" />

                    {/* Pound Symbol */}
                    <text x="50" y="62" fontSize="20" fontWeight="900" textAnchor="middle" fill="#fcd34d" fontFamily="serif">£</text>

                    {/* Top Handle */}
                    <path d="M40 20 Q50 10 60 20" stroke="#fcd34d" strokeWidth="3" fill="none" strokeLinecap="round" />
                </svg>
            </div>

            {/* Logo Text */}
            {showText && (
                <div className="flex flex-col leading-tight">
                    <span className={`${sizes.text} font-display font-bold text-white tracking-wide`}>
                        Deal or No Deal
                    </span>
                    <span className="text-[0.6rem] text-gold-400 font-bold tracking-[0.2em] uppercase">
                        UK Multiplayer
                    </span>
                </div>
            )}
        </div>
    );
}

/**
 * LogoMark - Just the icon without text
 */
export function LogoMark({ size = "md", className = "" }: Omit<LogoProps, "showText">) {
    return <Logo size={size} showText={false} className={className} />;
}
