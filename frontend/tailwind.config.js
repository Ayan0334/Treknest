/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        adventure: {
          yellow: '#FFC107',
          black: '#111111',
          charcoal: '#1E1E1E',
          card: '#1A1A1A',
          grey: '#F5F5F5',
          darkGrey: '#777777',
          muted: '#8E8E8E',
          green: '#4CAF50',
          red: '#F44336'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 8px 30px rgba(0, 0, 0, 0.4)',
        'yellow-glow': '0 0 15px rgba(255, 193, 7, 0.4)',
        'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}
