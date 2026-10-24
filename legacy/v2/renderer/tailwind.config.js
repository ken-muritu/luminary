/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#13131A',
        'surface-low': '#1B1B22',
        'surface-container': '#1F1F26',
        'surface-high': '#2A2931',
        'surface-bright': '#34343C',
        primary: '#6C5CE7',
        'primary-dark': '#4029BA',
        secondary: '#00B894',
        tertiary: '#FDCB6E',
        'on-surface': '#FFFFFF',
        'on-surface-variant': '#C8C4D7',
        'text-secondary': '#A0A0B8',
        'outline-variant': '#3A3847',
        destructive: '#FF6B6B',
        amber: '#FDCB6E',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        float: '0 20px 40px rgba(0,0,0,0.5)',
        glow: '0 0 20px rgba(108,92,231,0.3)',
        'glow-green': '0 0 16px rgba(0,184,148,0.4)',
        'glow-amber': '0 0 16px rgba(253,203,110,0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(135deg, #6C5CE7 0%, #4029BA 100%)',
        'surface-gradient': 'linear-gradient(180deg, #1B1B22 0%, #13131A 100%)',
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        28: '7rem',
      },
    },
  },
  plugins: [],
}
