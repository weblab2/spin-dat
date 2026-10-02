import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0d0d0d',
        panel: '#111111',
        metal: '#1a1a1a',
        brass: '#c6a26a',
        steel: '#7ea7c1',
        bronze: '#b79266',
        gauge: '#d4a75a',
      },
      boxShadow: {
        hardware: '0 10px 30px rgba(0,0,0,0.45)',
      },
    },
  },
  plugins: [],
};

export default config;
