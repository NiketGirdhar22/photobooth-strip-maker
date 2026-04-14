import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        noir: {
          950: '#060607',
          900: '#101115',
          800: '#191b22'
        },
        brass: {
          200: '#f5d17f',
          300: '#e6b95f',
          400: '#c99545'
        }
      },
      fontFamily: {
        heading: ['Cinzel', 'serif'],
        body: ['Manrope', 'sans-serif']
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(245, 209, 127, 0.35), 0 10px 60px rgba(0, 0, 0, 0.5)'
      },
      keyframes: {
        flash: {
          '0%': { opacity: '0' },
          '12%': { opacity: '0.95' },
          '100%': { opacity: '0' }
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        flash: 'flash 260ms ease-out',
        rise: 'rise 450ms ease-out both'
      }
    }
  },
  plugins: []
};

export default config;
