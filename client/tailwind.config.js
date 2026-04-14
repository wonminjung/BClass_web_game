/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dungeon: {
          bg: '#0a0a0f',
          panel: '#12121a',
          border: '#2a2a3a',
          accent: '#8b5cf6',
          gold: '#f59e0b',
          health: '#ef4444',
          mana: '#3b82f6',
          xp: '#22c55e',
        },
      },
      fontFamily: {
        game: ['"Noto Sans KR"', 'sans-serif'],
      },
      animation: {
        'skill-pulse': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'damage-float': 'damageFloat 1s ease-out forwards',
        'shake': 'shake 0.3s ease-in-out',
        'cooldown-ready': 'cooldownReady 1.2s ease-in-out infinite',
      },
      keyframes: {
        cooldownReady: {
          '0%, 100%': { opacity: '0.7', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.1)' },
        },
        damageFloat: {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-40px)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
      },
    },
  },
  plugins: [],
};
