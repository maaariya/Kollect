/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",  // all files in app folder
    "./pages/**/*.{js,ts,jsx,tsx}", // optional if you have pages folder
  ],
  theme: {
    extend: {
      colors: {
        "primary-light": "#D8E2DC",
        "secondary-light": "#FFE5D9",
        "pink-light": "#FFCAD4",
        "pink-medium": "#F4ACB7",
        "pink-dark": "#9D8189",
      },
      fontFamily: {
        cute: ["Comic Neue", "cursive"],
      },
      borderRadius: {
        "xl-bubble": "1.5rem",
      },
    },
  },
  plugins: [],
};
