import colors from 'tailwindcss/colors'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gray: {
          ...colors.gray,
          750: '#2a3340',
          850: '#1c2330',
        },
      },
    },
  },
  plugins: [],
}
