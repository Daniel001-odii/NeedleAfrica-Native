import React from 'react';
import { TouchableOpacity, ActivityIndicator } from 'react-native';
import { twMerge } from 'tailwind-merge';
import { Typography } from './Typography';
import { useTheme } from '../../contexts/ThemeContext';

interface ButtonProps extends React.ComponentProps<typeof TouchableOpacity> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'blue';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    className?: string;
    textClassName?: string;
    children: React.ReactNode;
}

export function Button({
    variant = 'primary',
    size = 'md',
    isLoading,
    className,
    textClassName,
    children,
    disabled,
    ...props
}: ButtonProps) {
    const { isDark } = useTheme();

    const baseStyles = "rounded-lg items-center justify-center flex-row shadow-sm active:translate-y-1";

    const variants = {
        primary: isDark ? "bg-brand-primary border-2 border-brand-primary" : "bg-peach border-2 border-black",
        secondary: isDark ? "bg-dark-700 border-2 border-dark-600" : "bg-lavender border-2 border-black",
        outline: isDark ? "bg-transparent border-2 border-text-dark" : "bg-white border-2 border-black",
        ghost: "bg-transparent border-0 shadow-none",
        blue: "bg-blue-600 border-2 border-blue-700"
    };

    const sizes = {
        sm: "h-10 px-4",
        md: "h-12 px-6",
        lg: "h-14 px-8"
    };

    const textColors = {
        primary: "text-white",
        secondary: isDark ? "text-white" : "text-black",
        outline: isDark ? "text-text-dark" : "text-black",
        ghost: isDark ? "text-text-dark" : "text-black",
        blue: "text-white"
    };

    return (
        <TouchableOpacity
            className={twMerge(baseStyles, variants[variant], sizes[size], disabled && "opacity-50", className)}
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading ? (
                <ActivityIndicator color={isDark ? "white" : "black"} />
            ) : (
                typeof children === 'string' ? (
                    <Typography
                        weight="bold"
                        variant={size === 'lg' ? 'subtitle' : 'body'}
                        className={twMerge(textColors[variant], textClassName)}
                        family="grotesk"
                    >
                        {children}
                    </Typography>
                ) : (
                    children
                )
            )}
        </TouchableOpacity>
    );
}
