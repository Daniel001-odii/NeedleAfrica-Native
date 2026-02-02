import React from 'react';
import { TouchableOpacity, ActivityIndicator } from 'react-native';
import { twMerge } from 'tailwind-merge';
import { Typography } from './Typography';

interface ButtonProps extends React.ComponentProps<typeof TouchableOpacity> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
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

    const baseStyles = "rounded-lg items-center justify-center flex-row shadow-sm active:translate-y-1";

    const variants = {
        primary: "bg-peach border-2 border-black",
        secondary: "bg-lavender border-2 border-black",
        outline: "bg-white border-2 border-black",
        ghost: "bg-transparent border-0 shadow-none"
    };

    const sizes = {
        sm: "h-10 px-4",
        md: "h-12 px-6",
        lg: "h-14 px-8"
    };

    return (
        <TouchableOpacity
            className={twMerge(baseStyles, variants[variant], sizes[size], disabled && "opacity-50", className)}
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading ? (
                <ActivityIndicator color="white" />
            ) : (
                typeof children === 'string' ? (
                    <Typography
                        weight="bold"
                        variant={size === 'lg' ? 'subtitle' : 'body'}
                        className={twMerge("text-black", textClassName)}
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
