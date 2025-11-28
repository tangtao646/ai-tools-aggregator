/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#4F46E5', // 参考文件中的 indigo 色
        'accent': '#10B981',
        'accent-glow': '#34D399',
        'background-light': '#F7F7F9',
        'background-dark': '#0D0C14',
      },
      fontFamily: {
        'display': ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'DEFAULT': '0.5rem',
        'lg': '1rem',
        'xl': '1.5rem',
        'full': '9999px',
      },
      boxShadow: {
        'glow-primary': '0 0 15px 0 rgba(79, 70, 229, 0.4)',
        'glow-primary-light': '0 0 8px 0 rgba(79, 70, 229, 0.3)',
        'glow-accent': '0 0 15px 0 rgba(16, 185, 129, 0.5)',
        'inner-glow': 'inset 0 0 8px 0 rgba(255, 255, 255, 0.05)',
        'inner-glow-strong': 'inset 0 0 12px 0 rgba(255, 255, 255, 0.1)',
      },
    },
  },
  plugins: [],
}


