/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      },
      animation: {
        shimmer: 'shimmer 2s infinite linear',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        // Poppins for English, falling back to Noto Sans Devanagari for mixed content
        poppins: ['Poppins', '"Noto Sans Devanagari"', 'sans-serif'],
        // Specific Hindi font
        hindi: ['"Noto Sans Devanagari"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
