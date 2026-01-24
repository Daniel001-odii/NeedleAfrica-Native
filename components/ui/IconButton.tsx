import React from 'react';
import { Pressable, PressableProps, View } from 'react-native';
import { twMerge } from 'tailwind-merge';

interface IconButtonProps extends PressableProps {
    variant?: 'white' | 'dark' | 'glass' | 'ghost';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    icon: React.ReactNode;
    className?: string; // Add this if missing or if PressableProps doesn't include it in a way NativeWind likes
}

export function IconButton({
    icon,
    className,
    variant = 'white',
    size = 'md',
    ...props
}: IconButtonProps) {
    const variants = {
        white: 'bg-white border border-gray-100',
        dark: 'bg-dark',
        glass: 'bg-white/20',
        ghost: 'bg-transparent',
    };

    const sizes = {
        sm: 'w-8 h-8 rounded-full',
        md: 'w-10 h-10 rounded-full',
        lg: 'w-12 h-12 rounded-full',
        xl: 'w-14 h-14 rounded-full',
    };

    return (
        <Pressable
            className={twMerge(
                'items-center justify-center',
                variants[variant],
                sizes[size],
                className
            )}
            style={({ pressed }) => [
                { opacity: pressed ? 0.7 : 1 }
            ]}
            {...props}
        >
            {icon}
        </Pressable>
    );
}
