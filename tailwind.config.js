/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#ffffff",
        secondary: {
          DEFAULT: "#2170f8",
          100: "#d3e2fe",
          200: "#2170f8",
        },
        black: {
          DEFAULT: "#000",
          100: "#1E1E2D",
          200: "#232533",
        },
        gray: {
          100: "#CDCDE0",
        },
      },
      fontFamily: {
        pthin: ["Poppins_100Thin", "sans-serif"],
        pextralight: ["Poppins_200ExtraLight", "sans-serif"],
        plight: ["Poppins_300Light", "sans-serif"],
        pregular: ["Poppins_400Regular", "sans-serif"],
        pmedium: ["Poppins_500Medium", "sans-serif"],
        psemibold: ["Poppins_600SemiBold", "sans-serif"],
        pbold: ["Poppins_700Bold", "sans-serif"],
        pextrabold: ["Poppins_800ExtraBold", "sans-serif"],
        pblack: ["Poppins_900Black", "sans-serif"],
      },
    },
  },
  plugins: [],
};
