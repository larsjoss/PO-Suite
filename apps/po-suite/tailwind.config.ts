import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'rgb(var(--color-brand) / <alpha-value>)',
          dark:    'rgb(var(--color-brand-dark) / <alpha-value>)',
          light:   'rgb(var(--color-brand-light) / <alpha-value>)',
        },
        canvas:  'rgb(var(--color-canvas) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        ink: {
          DEFAULT:   'rgb(var(--color-ink) / <alpha-value>)',
          secondary: 'rgb(var(--color-ink-secondary) / <alpha-value>)',
          tertiary:  'rgb(var(--color-ink-tertiary) / <alpha-value>)',
        },
        edge: {
          DEFAULT: 'rgb(var(--color-edge) / <alpha-value>)',
          2:       'rgb(var(--color-edge-2) / <alpha-value>)',
        },
        error:   'rgb(var(--color-error) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [typography],
} satisfies Config;
