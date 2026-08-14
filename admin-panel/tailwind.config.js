/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7F44C2',
          light: '#A06BD3',
          lighter: '#F4ECFB',
          dark: '#6B35A8',
        },
        success: '#159447',
        discount: '#E83E6F',
        background: {
          DEFAULT: '#FFFFFF',
          secondary: '#FAFAFA',
          sidebar: '#1E1E2D',
        },
        text: {
          primary: '#18181B',
          secondary: '#71717A',
          inverse: '#FFFFFF',
        },
        border: '#EDEDED',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
};
