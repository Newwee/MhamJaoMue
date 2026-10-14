/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#040714',
          900: '#070d24',
          850: '#0b1433',
          800: '#0f1c42',
          700: '#17275c',
          600: '#1e3276',
        },
        felt: {
          darkest: '#052917',
          dark: '#084524',
          DEFAULT: '#0d5c34',
          light: '#137a46',
          bright: '#1bb065'
        },
        gold: {
          light: '#fde047',
          DEFAULT: '#eab308',
          dark: '#ca8a04',
          accent: '#fbbf24'
        },
        rail: {
          dark: '#0d1117',
          DEFAULT: '#161b22',
          light: '#21262d',
          border: '#30363d'
        }
      },
      boxShadow: {
        'table-inner': 'inset 0 0 60px rgba(0, 0, 0, 0.75)',
        'felt-glow': 'inset 0 0 40px rgba(20, 122, 70, 0.4), 0 0 20px rgba(0, 0, 0, 0.6)',
        'chip': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.4)',
        'card': '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.5)',
        'gold-glow': '0 0 25px rgba(245, 158, 11, 0.6)',
      },
      keyframes: {
        deal: {
          '0%': { transform: 'scale(0.2) translateY(-140px) rotate(-15deg)', opacity: '0' },
          '100%': { transform: 'scale(1) translateY(0) rotate(0deg)', opacity: '1' }
        },
        flip: {
          '0%': { transform: 'rotateY(180deg) scale(0.9)', opacity: '0.8' },
          '100%': { transform: 'rotateY(0deg) scale(1)', opacity: '1' }
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(234, 179, 8, 0.6)' },
          '50%': { boxShadow: '0 0 35px rgba(234, 179, 8, 0.95)' }
        },
        suspensePeel: {
          '0%': { transform: 'translateY(0) rotate(0deg)' },
          '30%': { transform: 'translateY(-10px) rotate(-5deg)' },
          '60%': { transform: 'translateY(-5px) rotate(3deg)' },
          '100%': { transform: 'translateY(0) rotate(0deg)' }
        }
      },
      animation: {
        'deal-card': 'deal 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'flip-card': 'flip 0.5s ease-out forwards',
        'turn-pulse': 'pulseGlow 1.5s infinite',
        'suspense-peel': 'suspensePeel 1s ease-in-out infinite'
      }
    },
  },
  plugins: [],
}
