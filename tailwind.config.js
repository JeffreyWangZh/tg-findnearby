/** @type {import('tailwindcss').Config} */

function tgColor(variable, fallback) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgba(var(${variable}, ${fallback}), ${opacityValue})`
    }
    return `var(${variable}, ${fallback})`
  }
}

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tg: {
          bg:            'var(--tg-theme-bg-color, #ffffff)',
          'secondary-bg':'var(--tg-theme-secondary-bg-color, #f0f0f0)',
          text:          'var(--tg-theme-text-color, #000000)',
          hint:          'var(--tg-theme-hint-color, #707579)',
          link:          'var(--tg-theme-link-color, #2481cc)',
          button:        'var(--tg-theme-button-color, #3390ec)',
          'button-text': 'var(--tg-theme-button-text-color, #ffffff)',
        }
      },
    },
  },
  plugins: [],
}
