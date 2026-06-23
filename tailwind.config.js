/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      xs: '360px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        bg: '#080c18',
        surface: '#0d1020',
        'surface-2': '#131729',
        purple: {
          DEFAULT: '#7c6fee',
          light: '#a78bfa',
          dim: 'rgba(124,111,238,0.15)',
        },
        accent: {
          green: '#4ade80',
          red: '#f87171',
          orange: '#fb923c',
        },
        text: {
          DEFAULT: '#e2e8f0',
          muted: 'rgba(255,255,255,0.35)',
          sub: 'rgba(255,255,255,0.55)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        blink: 'blink 1.4s infinite',
        'fade-in': 'fadeIn 0.4s ease',
        shimmer: 'shimmer 1.5s infinite',
        'slide-up': 'slideUp 0.3s ease',
        pulse2: 'pulse2 2s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.2 },
        },
        fadeIn: {
          from: { opacity: 0, transform: 'translateY(6px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideUp: {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        pulse2: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
      },
    },
  },
  plugins: [],
}
