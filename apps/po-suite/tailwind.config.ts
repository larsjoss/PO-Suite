import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1C2B1E',
          dark: '#131e15',
          light: '#E8EFE9',
        },
        canvas: '#F5F0E8',
        surface: '#FAFAF8',
        ink: {
          DEFAULT: '#1C2420',
          secondary: '#5C5852',
          tertiary: '#6B6860',
        },
        edge: {
          DEFAULT: '#DDD8CF',
          2: '#EBE6DA',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
