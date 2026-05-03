/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#059669',
        'primary-dark': '#047857',
        'primary-light': '#D1FAE5',
        accent: '#F97316',
        'accent-light': '#FFEDD5',
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '28px',
      },
    },
  },
  plugins: [],
}
