import React from 'react';
import { Pressable, PressableProps, View } from 'react-native';
import { twMerge } from 'tailwind-merge';
import { useTheme } from '../../contexts/ThemeContext';

interface IconButtonProps extends PressableProps {
    variant?: 'white' | 'dark' | 'glass' | 'ghost' | 'muted';
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
    const { isDark } = useTheme();

    const variants = {
        white: isDark ? 'bg-surface-dark border border-border-dark' : 'bg-white border border-gray-100',
        dark: isDark ? 'bg-white' : 'bg-dark',
        glass: 'bg-white/20',
        ghost: 'bg-transparent',
        muted: isDark ? 'bg-surface-muted-dark' : 'bg-surface-muted',
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
