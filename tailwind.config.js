/** @type {import('tailwindcss').Config} */
module.exports = {
    // NOTE: Update this to include the paths to all of your component files.
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                brand: {
                    primary: '#FF5678',
                    secondary: '#6B3A52',
                },
                indigo: {
                    50: '#F6F2EF',
                    100: '#EAE1DC',
                    200: '#D5C4BC',
                    300: '#B89B9E',
                    400: '#ff8fa3',
                    500: '#FF5678',
                    600: '#FF5678',
                    700: '#e2103b',
                    800: '#6B3A52',
                    900: '#21000A',
                },
                soft: {
                    lavender: '#F6F2EF',
                    peach: '#FFF0D9',
                    blue: '#E3F2FD',
                    green: '#E8F5E9',
                    pink: '#FCE4EC',
                },
                accent: {
                    lavender: '#EAE1DC',
                    peach: '#FFDCA8',
                    blue: '#B3E5FC',
                    green: '#C8E6C9',
                    pink: '#F8BBD0',
                },
                card: {
                    orange: '#FDB022',
                    blue: '#00D1FF',
                    purple: '#9B8AFB',
                    mint: '#12D39D',
                },
                dark: {
                    DEFAULT: '#21000A',
                    50: '#F9FAFB',
                    100: '#F3F4F6',
                    200: '#E5E7EB',
                    300: '#D1D5DB',
                    400: '#9CA3AF',
                    500: '#6B7280',
                    600: '#4B5563',
                    700: '#374151',
                    800: '#21000A',
                    900: '#000000',
                },
                muted: {
                    DEFAULT: '#F6F2EF',
                    dark: '#21000A',
                },
                background: {
                    DEFAULT: '#F6F2EF',
                    dark: '#000000',
                },
                surface: {
                    DEFAULT: '#F6F2EF',
                    dark: '#21000A',
                    muted: '#F6F2EF',
                    'muted-dark': '#21000A',
                },
                text: {
                    DEFAULT: '#1C1C1E',
                    dark: '#FFFFFF',
                    muted: '#6B7280',
                    'muted-dark': '#9CA3AF',
                },
                border: {
                    DEFAULT: '#EAE1DC',
                    dark: '#6B3A52',
                },
            },
            // fontFamily: {
            //     playfair: ['Playfair-Regular'],
            //     grotesk: ['Grotesk-Regular'],
            // },
        },
    },
    plugins: [],
}
