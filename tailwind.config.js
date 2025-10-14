/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bootstrap-dark': '#343a40',
        'bootstrap-danger': '#dc3545',
        'bootstrap-danger-hover': '#c82333',
        'bootstrap-primary': '#0d6efd',
        'bootstrap-primary-hover': '#0b5ed7',
        'bootstrap-secondary': '#6c757d',
        'bootstrap-secondary-hover': '#5c636a',
        'bootstrap-border': '#dee2e6',
        'bootstrap-bg': '#f8f9fa',
      },
      fontFamily: {
        'geist': ['Geist', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
        'geist-mono': ['Geist Mono', 'monospace'],
        'sans': ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'mono': ['Geist Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
