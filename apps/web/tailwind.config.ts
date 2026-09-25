import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ark: {
          bg: '#1A0A00',
          'bg-elevated': '#261200',
          'bg-surface': '#331900',
          'bg-card': '#3D1F00',
          primary: '#F97316',
          'primary-hover': '#EA6A0E',
          'primary-dim': '#C2570F',
          'primary-glow': '#FB923C',
          'primary-muted': 'rgba(249,115,22,0.15)',
          accent: '#FACC15',
          'accent-hover': '#F0C010',
          'accent-dim': '#CA9F10',
          'accent-muted': 'rgba(250,204,21,0.12)',
          'text-primary': '#FFF7ED',
          'text-secondary': '#FED7AA',
          'text-muted': '#C2834A',
          'text-faint': '#7C4A1E',
          border: '#3D2000',
          'border-bright': '#7C3A00',
          'border-focus': '#F97316',
          success: '#16A34A',
          'success-bg': 'rgba(22,163,74,0.12)',
          warning: '#D97706',
          'warning-bg': 'rgba(217,119,6,0.12)',
          danger: '#DC2626',
          'danger-bg': 'rgba(220,38,38,0.12)',
          info: '#0284C7',
          'info-bg': 'rgba(2,132,199,0.12)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-primary': '0 0 24px rgba(249,115,22,0.4)',
        'glow-primary-sm': '0 0 12px rgba(249,115,22,0.3)',
        'glow-accent': '0 0 20px rgba(250,204,21,0.3)',
        card: '0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.7)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.6), 0 0 0 1px rgba(249,115,22,0.25)',
        'card-active': '0 0 0 2px rgba(249,115,22,0.6)',
        'inner-glow': 'inset 0 0 16px rgba(249,115,22,0.08)',
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
        pill: '9999px',
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite linear',
        'fade-in': 'fadeIn 150ms ease-out',
        'slide-up': 'slideUp 200ms ease-out',
        'pulse-danger': 'pulseDanger 2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseDanger: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
