/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#0D0D14',
        'surface-low': '#13131A',
        'surface-container': '#1B1B25',
        'surface-high': '#252530',
        'surface-bright': '#2E2E3A',
        primary: '#6C5CE7',
        'primary-dark': '#4029BA',
        secondary: '#00B894',
        tertiary: '#FDCB6E',
        'on-surface': '#FFFFFF',
        'on-surface-variant': '#C8C4D7',
        'text-secondary': '#A0A0B8',
        'outline-variant': '#3A3847',
        destructive: '#FF6B6B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 40px rgba(108,92,231,0.25)',
        'glow-sm': '0 0 20px rgba(108,92,231,0.2)',
        'glow-green': '0 0 20px rgba(0,184,148,0.3)',
        float: '0 25px 50px rgba(0,0,0,0.6)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-up': 'fadeUp 0.6s ease-out both',
        'fade-in': 'fadeIn 0.4s ease-out both',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(135deg, #6C5CE7 0%, #4029BA 100%)',
        'hero-gradient': 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(108,92,231,0.15) 0%, transparent 70%)',
        'card-gradient': 'linear-gradient(135deg, rgba(108,92,231,0.08) 0%, rgba(0,184,148,0.04) 100%)',
      },
    },
  },
  plugins: [],
}
