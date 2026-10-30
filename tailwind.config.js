/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Base surfaces
        white: '#ffffff',
        page: '#f8fafc',
        line: '#e2e8f0',
        // Text
        navy: '#0f172a',
        ink: '#334155',
        muted: '#64748b',
        // Brand and actions
        primary: '#3b82f6',
        teal: '#0d9488',
        // Verdict and status
        danger: '#ef4444',
        dangerSoft: '#fef2f2',
        warning: '#f59e0b',
        warningSoft: '#fffbeb',
        success: '#10b981',
        successSoft: '#ecfdf5',
        // Dark accents
        slatenavy: '#1e293b',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Devanagari', 'Noto Sans Gurmukhi', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        scanline: { '0%': { top: '0%' }, '50%': { top: 'calc(100% - 3px)' }, '100%': { top: '0%' } },
        marquee: { '0%': { transform: 'translateY(100%)', opacity: 0 }, '10%,90%': { transform: 'translateY(0)', opacity: 1 }, '100%': { transform: 'translateY(-100%)', opacity: 0 } },
        slideIn: { '0%': { transform: 'translateY(8px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
      },
      animation: {
        scanline: 'scanline 2.4s ease-in-out infinite',
        slideIn: 'slideIn 0.25s ease-out',
      },
    },
  },
  plugins: [],
};
