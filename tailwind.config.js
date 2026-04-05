/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy:   { DEFAULT: '#0A1628', dark: '#060E1A', card: '#0F1E35', border: '#1C2E4A' },
        green:  { DEFAULT: '#1B6B4A', light: '#2A8B62', muted: '#14503A' },
        gold:   { DEFAULT: '#D4A853', light: '#E8C070', muted: '#A8823D' },
        cream:  { DEFAULT: '#E8DCC8', muted: '#B8AC98' },
        slate:  { muted: '#8B9BB4' },
      },
      fontFamily: {
        display: ['"Cinzel"', '"Times New Roman"', 'serif'],
        body:    ['"Nunito"', 'system-ui', 'sans-serif'],
        arabic:  ['"Amiri"', '"Times New Roman"', 'serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'geometric': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4A853' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
      boxShadow: {
        'gold': '0 0 20px rgba(212, 168, 83, 0.15)',
        'gold-lg': '0 0 40px rgba(212, 168, 83, 0.2)',
        'green': '0 0 20px rgba(27, 107, 74, 0.2)',
        'glass': '0 4px 30px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn:    { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp:   { '0%': { opacity: 0, transform: 'translateY(20px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        slideIn:   { '0%': { opacity: 0, transform: 'translateX(-20px)' }, '100%': { opacity: 1, transform: 'translateX(0)' } },
        pulseGold: { '0%, 100%': { boxShadow: '0 0 5px rgba(212,168,83,0.3)' }, '50%': { boxShadow: '0 0 20px rgba(212,168,83,0.6)' } },
        shimmer:   { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
};
