/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-mode="dark"]'],
  content: ['src/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
  plugins: [require('tailwindcss-animate')]
}
