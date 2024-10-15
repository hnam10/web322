/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["public/views/**/*.html"], // Use proper glob pattern for all HTML files

  theme: {
    extend: {}, // Extend Tailwind’s default theme
  },

  plugins: [
    require("@tailwindcss/typography"), // Correct syntax for the typography plugin
    require("daisyui"), // Properly include daisyUI plugin
  ],

  daisyui: {
    themes: ["fantasy"], // Enable the Fantasy theme
  },
};
