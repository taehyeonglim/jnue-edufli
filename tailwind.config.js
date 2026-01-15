/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Modern Postmodern Color Palette
        'primary': {
          DEFAULT: '#6366F1',
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        'accent': {
          DEFAULT: '#06B6D4',
          50: '#ECFEFF',
          100: '#CFFAFE',
          200: '#A5F3FC',
          300: '#67E8F9',
          400: '#22D3EE',
          500: '#06B6D4',
          600: '#0891B2',
          700: '#0E7490',
          800: '#155E75',
          900: '#164E63',
        },
        'warm': {
          DEFAULT: '#F59E0B',
          light: '#FCD34D',
        },
        // Glass/Surface colors
        'surface': 'rgba(255, 255, 255, 0.8)',
        'glass': 'rgba(255, 255, 255, 0.6)',
        'glass-border': 'rgba(255, 255, 255, 0.3)',
        // Text colors
        'text': {
          primary: '#1E293B',
          secondary: '#475569',
          muted: '#94A3B8',
        },
        // Background
        'bg': {
          DEFAULT: '#F8FAFC',
          alt: '#F1F5F9',
        },
        // Tier colors (modern gradient-ready)
        'tier': {
          bronze: '#78A55A',
          silver: '#6B9BD1',
          gold: '#E6B422',
          platinum: '#40BFB0',
          diamond: '#A78BFA',
          master: '#F472B6',
          challenger: '#FBBF24',
        },
      },
      fontFamily: {
        'main': ['Pretendard Variable', 'Pretendard', 'Noto Sans KR', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'display': ['Pretendard Variable', 'Pretendard', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh': 'radial-gradient(ellipse 80% 50% at 20% -20%, rgba(99, 102, 241, 0.15), transparent), radial-gradient(ellipse 60% 40% at 80% 0%, rgba(6, 182, 212, 0.12), transparent)',
        'gradient-primary': 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
        'gradient-accent': 'linear-gradient(135deg, #06B6D4 0%, #22D3EE 100%)',
        'gradient-warm': 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)',
        'gradient-hero': 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%)',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 16px rgba(0, 0, 0, 0.06)',
        'large': '0 8px 32px rgba(0, 0, 0, 0.08)',
        'glow': '0 0 40px rgba(99, 102, 241, 0.15)',
        'glow-accent': '0 0 40px rgba(6, 182, 212, 0.15)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.04), inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 8px 40px rgba(99, 102, 241, 0.12)',
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '32px',
      },
      backdropBlur: {
        'xs': '2px',
        'glass': '20px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glow: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
    },
  },
  plugins: [],
}
