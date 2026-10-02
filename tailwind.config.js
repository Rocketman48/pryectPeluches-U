/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // NÚCLEO palette
        cream: {
          DEFAULT: '#F6F1E8',
          50: '#FBF8F2',
          100: '#F6F1E8',
          200: '#EDE5D6',
        },
        card: '#FFFDF8',
        ink: {
          DEFAULT: '#292622',
          light: '#756F67',
        },
        border: {
          DEFAULT: '#DED6C8',
        },
        forest: {
          DEFAULT: '#16866F',
          light: '#1FAA85',
          dark: '#0F6B57',
          50: '#E8F5F1',
          100: '#D1EBE3',
        },
        gold: {
          DEFAULT: '#D69A32',
          light: '#E5B451',
          dark: '#B07D22',
          50: '#FBF3E4',
          100: '#F7E8CC',
        },
        lavender: {
          DEFAULT: '#9278C9',
          light: '#A892D8',
          dark: '#7558B0',
          50: '#F0EBF8',
          100: '#E2D9F2',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        serif: ['"Fraunces"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        'xl': '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.35s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.25s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(41, 38, 34, 0.06)',
        'card': '0 4px 16px rgba(41, 38, 34, 0.08)',
        'lift': '0 8px 32px rgba(41, 38, 34, 0.12)',
        'glow-forest': '0 0 0 3px rgba(22, 134, 111, 0.15)',
        'glow-gold': '0 0 0 3px rgba(214, 154, 50, 0.15)',
        'glow-lavender': '0 0 0 3px rgba(146, 120, 201, 0.15)',
      },
    },
  },
  plugins: [],
};
