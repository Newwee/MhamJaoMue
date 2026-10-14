/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
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
        'card': '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.5)'
      },
      keyframes: {
        deal: {
          '0%': { transform: 'scale(0.3) translateY(-100px)', opacity: '0' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' }
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(234, 179, 8, 0.6)' },
          '50%': { boxShadow: '0 0 30px rgba(234, 179, 8, 0.95)' }
        }
      },
      animation: {
        'deal-card': 'deal 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'turn-pulse': 'pulseGlow 1.5s infinite'
      }
    },
  },
  plugins: [],
}
