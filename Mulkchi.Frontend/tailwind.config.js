/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class', // enabling dark mode via class
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#0f766e', // main primary color for Mulkchi (Teal-700)
          600: '#0d9488', // Teal-600
          700: '#115e59', // Teal-800
          800: '#134e4a', // Teal-900
          900: '#042f2e',
        },
        secondary: '#0ea5e9', // a nice blue contrast
        dark: {
          bg: '#0f172a',
          card: '#1e293b',
          border: '#334155'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
        'glass-dark': '0 4px 30px rgba(0, 0, 0, 0.5)',
      },
      backdropBlur: {
        'glass': '10px',
      }
    },
  },
  plugins: [],
}
