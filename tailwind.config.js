export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sand: '#f5f2eb',
        cream: '#faf8f5',
        stone: '#f0ece3',
        espresso: {
          DEFAULT: '#5c412f',
          dark: '#453022',
          light: '#76563f'
        },
        caramel: '#c79d72',
        camel: '#bca38f',
        tan: '#d9c7b6',
        ink: '#1c1917',
        mut: '#78716c',
        acc: {
          DEFAULT: '#5c412f',
          dark: '#453022',
          light: '#e8ded4'
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', '"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Manrope', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        glass: '0 10px 30px -5px rgba(28, 25, 23, 0.07)',
        card: '0 4px 20px -2px rgba(28, 25, 23, 0.05)',
        elevated: '0 20px 40px -15px rgba(28, 25, 23, 0.12)'
      }
    }
  },
  plugins: []
};

