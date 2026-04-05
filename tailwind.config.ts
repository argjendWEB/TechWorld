import type { Config } from 'tailwindcss';

const config: Config = {
    content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
    theme: {
        extend: {
            colors: {
                tw: {
                    bg: '#060810',
                    card: '#0c1019',
                    border: 'rgba(59, 130, 246, 0.12)',
                    accent: '#3b82f6',
                    'accent-dark': '#1e40af',
                },
            },
            fontFamily: {
                heading: ['Space Grotesk', 'Inter', 'sans-serif'],
                body: ['Outfit', 'Inter', 'sans-serif'],
                ui: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
};

export default config;
