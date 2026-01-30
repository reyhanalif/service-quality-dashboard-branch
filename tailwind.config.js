/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            colors: {
                // Custom dashboard palette
                dashboard: {
                    bg: '#f8fafc',
                    card: 'rgba(255, 255, 255, 0.8)',
                    border: 'rgba(148, 163, 184, 0.2)',
                },
                status: {
                    improving: '#10b981',
                    stagnant: '#f59e0b',
                    declining: '#ef4444',
                },
                metric: {
                    fast: '#3b82f6',
                    consistent: '#8b5cf6',
                    efficient: '#06b6d4',
                    positive: '#10b981',
                }
            },
            backdropBlur: {
                xs: '2px',
            },
            boxShadow: {
                'glass': '0 4px 30px rgba(0, 0, 0, 0.05)',
                'glass-lg': '0 8px 32px rgba(0, 0, 0, 0.08)',
            }
        },
    },
    plugins: [],
}
