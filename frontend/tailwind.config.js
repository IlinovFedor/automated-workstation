/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    // Прямые углы, как на pstu.ru и в брендбуке.
    borderRadius: {
      none: '0',
      DEFAULT: '0',
      sm: '2px',
      full: '9999px',
    },
    extend: {
      colors: {
        page: token('page'),
        panel: token('panel'),
        ink: token('ink'),
        muted: token('muted'),
        line: token('line'),
        link: token('link'),
        accent: token('accent'),
        today: token('today'),
        now: token('now'),
        // Цвета брендбука ПНИПУ.
        brand: {
          space: '#1B1F26',
          blue: '#002FE7',
          orange: '#FF7641',
          yellow: '#FFF854',
          lilac: '#968AE1',
          gray: '#81818B',
          light: '#E1E1E2',
        },
      },
      fontFamily: {
        sans: ['Roboto', 'system-ui', '-apple-system', 'Segoe UI', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
