/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        // src/ directory (current structure)
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
        // Root-level directories (alternative structure)
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            // TV Studio Colour Palette
            colors: {
                // Navy/Black backgrounds
                studio: {
                    900: '#0a0b14',  // Deepest background
                    800: '#0d0f1a',  // Primary background
                    700: '#121525',  // Elevated surfaces
                    600: '#1a1d30',  // Cards/panels
                    500: '#242840',  // Subtle borders
                },
                // Royal Blue primary
                primary: {
                    DEFAULT: '#1e40af',
                    50: '#eff6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    300: '#93c5fd',
                    400: '#60a5fa',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                    800: '#1e40af',
                    900: '#1e3a8a',
                },
                // Metallic Gold accent
                gold: {
                    DEFAULT: '#d4af37',
                    50: '#fefce8',
                    100: '#fef9c3',
                    200: '#fef08a',
                    300: '#fde047',
                    400: '#facc15',
                    500: '#d4af37',
                    600: '#b8962e',
                    700: '#9a7d25',
                    800: '#7c641d',
                    900: '#5e4b15',
                },
                // Red secondary (Deal button, danger states)
                danger: {
                    DEFAULT: '#dc2626',
                    50: '#fef2f2',
                    100: '#fee2e2',
                    200: '#fecaca',
                    300: '#fca5a5',
                    400: '#f87171',
                    500: '#ef4444',
                    600: '#dc2626',
                    700: '#b91c1c',
                    800: '#991b1b',
                    900: '#7f1d1d',
                },
                // Success green (No Deal, positive states)
                success: {
                    DEFAULT: '#16a34a',
                    50: '#f0fdf4',
                    100: '#dcfce7',
                    200: '#bbf7d0',
                    300: '#86efac',
                    400: '#4ade80',
                    500: '#22c55e',
                    600: '#16a34a',
                    700: '#15803d',
                    800: '#166534',
                    900: '#14532d',
                },
            },
            // Box Shadows
            boxShadow: {
                'glow-gold': '0 0 20px rgba(212, 175, 55, 0.5), 0 0 40px rgba(212, 175, 55, 0.3)',
                'glow-gold-lg': '0 0 30px rgba(212, 175, 55, 0.6), 0 0 60px rgba(212, 175, 55, 0.4)',
                'glow-blue': '0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)',
                'glow-blue-lg': '0 0 30px rgba(59, 130, 246, 0.6), 0 0 60px rgba(59, 130, 246, 0.4)',
                'glow-red': '0 0 20px rgba(220, 38, 38, 0.5), 0 0 40px rgba(220, 38, 38, 0.3)',
                'glow-green': '0 0 20px rgba(22, 163, 74, 0.5), 0 0 40px rgba(22, 163, 74, 0.3)',
                'studio-card': '0 4px 24px rgba(0, 0, 0, 0.4), 0 0 1px rgba(255, 255, 255, 0.1)',
                'studio-elevated': '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 2px rgba(255, 255, 255, 0.05)',
            },
            // Background Images (Gradients)
            backgroundImage: {
                'studio-radial': 'radial-gradient(ellipse at top, #1a1d30 0%, #0a0b14 100%)',
                'studio-spotlight': 'radial-gradient(ellipse at center top, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
                'gold-shine': 'linear-gradient(135deg, #d4af37 0%, #f5e6a3 50%, #d4af37 100%)',
                'box-gradient': 'linear-gradient(180deg, #1e40af 0%, #1e3a8a 100%)',
                'banker-gradient': 'linear-gradient(135deg, #121525 0%, #0a0b14 100%)',
            },
            // Keyframe Animations
            keyframes: {
                // Pulse glow effect
                'pulse-glow': {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(212, 175, 55, 0.5)' },
                    '50%': { boxShadow: '0 0 40px rgba(212, 175, 55, 0.8), 0 0 60px rgba(212, 175, 55, 0.4)' },
                },
                // Sweep spotlight
                'sweep': {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' },
                },
                // Scorch/flame effect
                'scorch': {
                    '0%, 100%': { filter: 'brightness(1) saturate(1)' },
                    '50%': { filter: 'brightness(1.2) saturate(1.3)' },
                },
                // Fade in animation
                'fade-in': {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                // Fade out animation
                'fade-out': {
                    '0%': { opacity: '1', transform: 'translateY(0)' },
                    '100%': { opacity: '0', transform: 'translateY(-10px)' },
                },
                // Shimmer effect
                'shimmer': {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                // Box reveal
                'box-reveal': {
                    '0%': { transform: 'scale(1) rotateY(0deg)' },
                    '50%': { transform: 'scale(1.1) rotateY(90deg)' },
                    '100%': { transform: 'scale(1) rotateY(0deg)' },
                },
                // Countdown ring
                'countdown': {
                    '0%': { strokeDashoffset: '0' },
                    '100%': { strokeDashoffset: '283' },
                },
                // Float animation
                'float': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                // Spin slow
                'spin-slow': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                },
            },
            // Animation utilities
            animation: {
                'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
                'sweep': 'sweep 3s ease-in-out infinite',
                'scorch': 'scorch 1.5s ease-in-out infinite',
                'fade-in': 'fade-in 0.3s ease-out forwards',
                'fade-out': 'fade-out 0.3s ease-out forwards',
                'shimmer': 'shimmer 2s linear infinite',
                'box-reveal': 'box-reveal 0.6s ease-in-out',
                'countdown': 'countdown linear forwards',
                'float': 'float 3s ease-in-out infinite',
                'spin-slow': 'spin-slow 8s linear infinite',
            },
            // Font families - TV-show typography
            fontFamily: {
                // Geometric display font for headings, titles, amounts
                display: ['var(--font-display)', 'Outfit', 'system-ui', 'sans-serif'],
                // Clean sans-serif for body text, UI elements
                body: ['var(--font-body)', 'Inter', 'system-ui', 'sans-serif'],
                // Monospace for values, numbers
                mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
            },
            // Border radius
            borderRadius: {
                'box': '0.75rem',
                'panel': '1rem',
            },
        },
    },
    plugins: [],
};
