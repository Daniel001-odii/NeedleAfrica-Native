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
                    primary: '#6366f1',
                    secondary: '#1f2937',
                },
                soft: {
                    lavender: '#E9E7FF',
                    peach: '#FFF0D9',
                    blue: '#E3F2FD',
                    green: '#E8F5E9',
                    pink: '#FCE4EC',
                },
                accent: {
                    lavender: '#C5C1FF',
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
                    DEFAULT: '#1C1C1E',
                    50: '#F9FAFB',
                    100: '#F3F4F6',
                    200: '#E5E7EB',
                    300: '#D1D5DB',
                    400: '#9CA3AF',
                    500: '#6B7280',
                    600: '#4B5563',
                    700: '#374151',
                    800: '#1F2937',
                    900: '#111827',
                },
                muted: {
                    DEFAULT: '#F4F4F4',
                    dark: '#2C2C2E',
                },
                background: {
                    DEFAULT: '#FFFFFF',
                    dark: '#000000',
                },
                surface: {
                    DEFAULT: '#FFFFFF',
                    dark: '#1C1C1E',
                    muted: '#F4F4F4',
                    'muted-dark': '#2C2C2E',
                },
                text: {
                    DEFAULT: '#1C1C1E',
                    dark: '#FFFFFF',
                    muted: '#6B7280',
                    'muted-dark': '#9CA3AF',
                },
                border: {
                    DEFAULT: '#E5E7EB',
                    dark: '#374151',
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
