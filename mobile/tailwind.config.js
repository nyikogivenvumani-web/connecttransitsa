/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#0B7A6B',
        warning: '#D97706',
        info: '#0E7490',
        danger: '#DC2626',
        success: '#059669',
        background: '#F8FAFC',
        surface: '#FFFFFF',
        'text-main': '#0F172A',
        'text-muted': '#64748B',
        border: '#E2E8F0',
        'border-strong': '#CBD5E1',
        'on-warning': '#0F172A',
      },
    },
  },
  plugins: [],
};
