/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: {
          50: '#FDFBF7',
          100: '#FAF7F0',
          200: '#F2EDE2',
          300: '#E6DFD3',
          400: '#D8CFBF',
        },
        charcoal: {
          950: '#0C0C0C',
          900: '#121212',
          800: '#1C1B1A',
          700: '#2C2B29',
          600: '#4A4642',
          400: '#7A746D',
          300: '#A39C93',
        },
        warm: {
          100: '#EFEAE1',
          200: '#E6E0D3',
          300: '#D6CEBE',
          500: '#8C7A6B',
          700: '#5C4F44',
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.04em',
        widest: '0.25em',
      }
    },
  },
  plugins: [],
}
