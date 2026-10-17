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
        'felt-red': {
          darkest: '#2b0608',
          dark: '#4f0a0e',
          DEFAULT: '#781116',
          light: '#9e181e',
          bright: '#c7222a'
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
          '0%': { transform: 'perspective(1000px) translateY(-100px) translateX(40px) rotate(-20deg) scale(0.4)', opacity: '0' },
          '70%': { transform: 'perspective(1000px) translateY(3px) translateX(0) rotate(1deg) scale(1.03)', opacity: '1' },
          '100%': { transform: 'perspective(1000px) translateY(0) translateX(0) rotate(0deg) scale(1)', opacity: '1' }
        },
        dealFromShoe: {
          '0%': { transform: 'translate(140px, -120px) rotate(25deg) scale(0.5)', opacity: '0.3' },
          '100%': { transform: 'translate(0, 0) rotate(0deg) scale(1)', opacity: '1' }
        },
        chipPayoutDrop: {
          '0%': { transform: 'translateY(-70px) scale(0.6)', opacity: '0' },
          '70%': { transform: 'translateY(4px) scale(1.08)', opacity: '1' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' }
        },
        flip: {
          '0%': { transform: 'perspective(1000px) rotateY(180deg) scale(0.92)', opacity: '0.9' },
          '100%': { transform: 'perspective(1000px) rotateY(0deg) scale(1)', opacity: '1' }
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(234, 179, 8, 0.6)' },
          '50%': { boxShadow: '0 0 35px rgba(234, 179, 8, 0.95)' }
        },
        suspensePeel: {
          '0%, 100%': { transform: 'perspective(1000px) translateY(0) rotate(0deg) scale(1)', boxShadow: '0 4px 8px rgba(0,0,0,0.5)' },
          '30%': { transform: 'perspective(1000px) translateY(-9px) rotateX(16deg) rotateY(-8deg) rotateZ(-2deg) scale(1.04)', boxShadow: '-8px 16px 24px rgba(234,179,8,0.45)' },
          '65%': { transform: 'perspective(1000px) translateY(-5px) rotateX(10deg) rotateY(6deg) rotateZ(1deg) scale(1.02)', boxShadow: '-4px 10px 18px rgba(234,179,8,0.3)' }
        },
        dealerSqueeze: {
          '0%': { transform: 'perspective(1000px) rotateY(180deg) rotateX(0deg) translateY(0) scale(1)', filter: 'brightness(1)' },
          '25%': { transform: 'perspective(1000px) rotateY(155deg) rotateX(20deg) translateY(-14px) rotateZ(-4deg) scale(1.07)', filter: 'brightness(1.18)', boxShadow: '-10px 20px 30px rgba(0,0,0,0.65)' },
          '50%': { transform: 'perspective(1000px) rotateY(110deg) rotateX(26deg) translateY(-18px) rotateZ(-6deg) scale(1.12)', filter: 'brightness(1.25)', boxShadow: '-16px 28px 40px rgba(0,0,0,0.75)' },
          '75%': { transform: 'perspective(1000px) rotateY(35deg) rotateX(10deg) translateY(-8px) rotateZ(-2deg) scale(1.05)', filter: 'brightness(1.1)', boxShadow: '-8px 14px 22px rgba(0,0,0,0.5)' },
          '90%': { transform: 'perspective(1000px) rotateY(0deg) rotateX(0deg) translateY(-2px) scale(1.02)' },
          '100%': { transform: 'perspective(1000px) rotateY(0deg) rotateX(0deg) translateY(0) scale(1)', filter: 'brightness(1)' }
        }
      },
      animation: {
        'deal-card': 'deal 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'deal-shoe': 'dealFromShoe 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'chip-payout': 'chipPayoutDrop 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'flip-card': 'flip 0.6s ease-out forwards',
        'dealer-squeeze': 'dealerSqueeze 1.4s cubic-bezier(0.25, 1, 0.5, 1) forwards',
        'turn-pulse': 'pulseGlow 1.5s infinite',
        'suspense-peel': 'suspensePeel 1.8s ease-in-out infinite'
      }
    },
  },
  plugins: [],
}
