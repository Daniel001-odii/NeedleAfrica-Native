import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { twMerge } from 'tailwind-merge';

interface TypographyProps extends TextProps {
    variant?: 'h1' | 'h2' | 'h3' | 'subtitle' | 'body' | 'caption' | 'small';
    weight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';
    color?: 'black' | 'gray' | 'white' | 'primary' | 'red';
    family?: 'playfair' | 'grotesk';
}

export function Typography({
    children,
    className,
    variant = 'body',
    weight = 'normal',
    color = 'black',
    family,
    style,
    ...props
}: TypographyProps) {
    const variants = {
        h1: 'text-4xl',
        h2: 'text-2xl',
        h3: 'text-xl',
        subtitle: 'text-lg',
        body: 'text-base',
        caption: 'text-sm',
        small: 'text-xs',
    };

    const colors = {
        black: 'text-dark',
        gray: 'text-gray-500',
        white: 'text-white',
        primary: 'text-brand-primary',
        red: 'text-red-500',
    };

    // Determine font family based on variant if not explicitly provided
    const fontTheme = family || (['h1', 'h2', 'h3'].includes(variant) ? 'playfair' : 'grotesk');

    // Map weight to font name
    const getFontFamily = () => {
        if (fontTheme === 'playfair') {
            switch (weight) {
                case 'medium': return 'Playfair-Medium';
                case 'semibold': return 'Playfair-SemiBold';
                case 'bold': return 'Playfair-Bold';
                case 'extrabold': return 'Playfair-ExtraBold';
                case 'black': return 'Playfair-Black';
                default: return 'Playfair-Regular';
            }
        } else {
            switch (weight) {
                case 'medium': return 'Grotesk-Medium';
                case 'semibold': return 'Grotesk-SemiBold';
                case 'bold': return 'Grotesk-Bold';
                case 'extrabold': return 'Grotesk-Bold'; // No extrabold in Space Grotesk
                case 'black': return 'Grotesk-Bold';
                case 'normal':
                default: return 'Grotesk-Regular';
            }
        }
    };

    return (
        <Text
            className={twMerge(
                variants[variant],
                colors[color],
                className
            )}
            style={[{ fontFamily: getFontFamily() }, style]}
            {...props}
        >
            {children}
        </Text>
    );
}
