// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      blur: { // You can extend 'backdropBlur' or 'blur'
        'xs': '2px', // Define your custom lighter blur value here
        'tiny': '1px', // Another example
      }
    },
  },
  plugins: [],
}