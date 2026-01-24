/** @type {import('tailwindcss').Config} */
module.exports = {
    // NOTE: Update this to include the paths to all of your component files.
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
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
                dark: '#1C1C1E',
                muted: '#F4F4F4',
            },
            fontFamily: {
                playfair: ['Playfair-Regular'],
                grotesk: ['Grotesk-Regular'],
            },
        },
    },
    plugins: [],
}
