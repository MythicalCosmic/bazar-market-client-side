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
        primary: '#2DB84B',
        'primary-dark': '#229e3f',
        'primary-light': '#eaf8ee',
      },
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
