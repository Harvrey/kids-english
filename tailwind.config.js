/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 星河探險主題色
        space: {
          900: '#0b1026',
          800: '#141a3a',
          700: '#1e2752',
          600: '#2c3a73',
        },
        nova: '#34d399',   // S1 綠星系
        drift: '#38bdf8',  // S2 藍星系
        pulse: '#a78bfa',  // S3 紫星系
        quasar: '#fb923c', // S4 橘星系
        nebula: '#f472b6', // S5 粉紅星系
        star: '#fde047',   // 星星金
      },
      fontFamily: {
        round: ['"Baloo 2"', '"Noto Sans TC"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'pop-in': {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '70%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'float': {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'twinkle': {
          '0%,100%': { opacity: '0.3' },
          '50%': { opacity: '1' },
        },
        'shake': {
          '0%,100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-6px)' },
          '75%': { transform: 'translateX(6px)' },
        },
      },
      animation: {
        'pop-in': 'pop-in 0.4s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'twinkle': 'twinkle 2s ease-in-out infinite',
        'shake': 'shake 0.4s ease-in-out',
      },
    },
  },
  plugins: [],
}
