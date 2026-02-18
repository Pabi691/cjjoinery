/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                indigo: {
                    50: '#fdf2f4',
                    100: '#fce7ea',
                    200: '#f8d0d9',
                    300: '#f2aebc',
                    400: '#e88096',
                    500: '#be2e48',
                    600: '#78212e', // The requested brand color
                    700: '#641c26',
                    800: '#531821',
                    900: '#461820',
                    950: '#260a0e',
                }
            }
        },
    },
    plugins: [],
}
