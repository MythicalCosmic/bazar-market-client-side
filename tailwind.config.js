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
        // Brand (refined editorial emerald)
        primary: '#0F5132',
        'primary-dark': '#093D24',
        'primary-mid': '#1E6F47',
        'primary-light': '#D4E8DC',
        'primary-tint': '#ECF3EE',

        // Expanded editorial palette
        terracotta: '#B85C3A',
        'terracotta-dark': '#8F4226',
        'terracotta-light': '#F2D9CB',
        saffron: '#C99662',
        'saffron-light': '#F0DCC3',
        bordeaux: '#5C2A2E',
        'bordeaux-light': '#D9C0BF',
        sage: '#9CB4A1',
        'sage-light': '#DCE6DE',
        cream: '#F5EFE3',
        paper: '#F4EFE3',
        ink: '#1A2620',

        // Legacy accent (kept for backwards compat with any leftover refs)
        accent: '#B85C3A',
        'accent-light': '#F2D9CB',
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
        serif: ['Fraunces', 'Cormorant Garamond', 'Georgia', 'serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px', letterSpacing: '0.02em' }],
        eyebrow: ['10.5px', { lineHeight: '14px', letterSpacing: '0.18em' }],
      },
      borderRadius: {
        '2xl': '14px',
        '3xl': '20px',
        '4xl': '28px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(26, 38, 32, 0.04), 0 8px 24px rgba(26, 38, 32, 0.06)',
        editorial: '0 4px 12px rgba(26, 38, 32, 0.08), 0 24px 48px rgba(26, 38, 32, 0.10)',
        deep: '0 30px 80px -20px rgba(26, 38, 32, 0.25)',
        inset: 'inset 0 1px 2px rgba(26, 38, 32, 0.06)',
      },
      letterSpacing: {
        wider: '0.05em',
        widest: '0.18em',
        widestx: '0.22em',
      },
      transitionTimingFunction: {
        editorial: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
