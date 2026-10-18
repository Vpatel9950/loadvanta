/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#102A43',
          navyDark: '#0A1C2E',
          navyLight: '#243B53',
          orange: '#F97316',
          orangeHover: '#EA580C',
          orangeLight: '#FFEDD5',
          bgLight: '#F8FAFC',
          textDark: '#172B4D',
          success: '#16A34A',
          border: '#E2E8F0'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
      }
    }
  },
  plugins: []
};
