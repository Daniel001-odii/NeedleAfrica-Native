import React from 'react';
import { View, ViewProps } from 'react-native';
import { twMerge } from 'tailwind-merge';

interface SurfaceProps extends ViewProps {
    variant?: 'white' | 'lavender' | 'peach' | 'blue' | 'green' | 'muted' | 'dark';
    rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full' | 'none';
    hasShadow?: boolean;
    hasBorder?: boolean;
}

export function Surface({
    children,
    className,
    variant = 'white',
    rounded = '2xl',
    hasShadow = false,
    hasBorder = false,
    ...props
}: SurfaceProps) {
    const variants = {
        white: 'bg-white',
        lavender: 'bg-soft-lavender',
        peach: 'bg-soft-peach',
        blue: 'bg-soft-blue',
        green: 'bg-soft-green',
        muted: 'bg-muted',
        dark: 'bg-dark',
    };

    const roundedMap = {
        sm: 'rounded-sm',
        md: 'rounded-md',
        lg: 'rounded-lg',
        xl: 'rounded-xl',
        '2xl': 'rounded-2xl',
        '3xl': 'rounded-3xl',
        full: 'rounded-full',
        none: 'rounded-none',
    };

    return (
        <View
            className={twMerge(
                variants[variant],
                roundedMap[rounded],
                hasShadow && '',
                hasBorder && 'border border-gray-100',
                className
            )}
            {...props}
        >
            {children}
        </View>
    );
}
