import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        paper:           'var(--paper)',
        card:            'var(--card)',
        soft:            'var(--soft)',
        softer:          'var(--softer)',
        ink:             'var(--ink)',
        'ink-hover':     'var(--ink-hover)',
        line:            'var(--line)',
        'line-strong':   'var(--line-strong)',
        'line-hover':    'var(--line-hover)',
        muted:           'var(--text-muted)',
        dim:             'var(--text-dim)',
        forest:          'var(--forest)',
        'forest-soft':   'var(--forest-soft)',
        'olive-line':    'var(--olive-soft-b)',
        brick:           'var(--brick)',
        'brick-soft':    'var(--brick-soft)',
        'brick-line':    'var(--brick-soft-b)',
        steel:           'var(--steel)',
        'steel-soft':    'var(--steel-soft)',
        'steel-line':    'var(--steel-soft-b)',
        'avatar-1':      'var(--avatar-1)',
        'avatar-2':      'var(--avatar-2)',
        'avatar-3':      'var(--avatar-3)',
        'avatar-4':      'var(--avatar-4)',
        'avatar-5':      'var(--avatar-5)',
        'avatar-6':      'var(--avatar-6)',
      },
      fontFamily: {
        sans:  ['var(--font-sans)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'Times New Roman', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
