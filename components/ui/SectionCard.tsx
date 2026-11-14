import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { twMerge } from 'tailwind-merge';
import { useTheme } from '../../contexts/ThemeContext';

export interface SectionCardProps extends ViewProps {
    icon?: React.ComponentType<{ size?: number; color?: string; variant?: any }> | React.ReactNode;
    title?: React.ReactNode;
    rightElement?: React.ReactNode;
    children?: React.ReactNode;
    innerClassName?: string;
}

export function SectionCard({
    icon,
    title,
    rightElement,
    children,
    className,
    innerClassName,
    ...props
}: SectionCardProps) {
    const { isDark } = useTheme();

    const renderIcon = () => {
        if (!icon) return null;
        if (React.isValidElement(icon)) return icon;
        const IconComponent = icon as React.ComponentType<{ size?: number; color?: string; variant?: any }>;
        return <IconComponent size={16} color={isDark ? '#A1A1AA' : '#52525B'} variant="Bold" />;
    };

    return (
        <View
            className={twMerge(
                'rounded-3xl p-1 mb-3',
                isDark ? 'bg-zinc-900' : 'bg-[#F2F2F7]',
                className
            )}
            style={[
                {
                    borderRadius: 15,
                    overflow: 'hidden',
                    backgroundColor: isDark ? '#18181B' : '#F2F2F7',
                    borderWidth: 0,
                    shadowOpacity: 0,
                    elevation: 0,
                },
                props.style,
            ]}
            {...props}
        >
            {(title || icon || rightElement) && (
                <View className="flex-row items-center justify-between py-2.5 px-2">
                    <View className="flex-row items-center gap-2 flex-1 mr-2">
                        {renderIcon()}
                        {typeof title === 'string' ? (
                            <Text
                                className={twMerge(
                                    'text-[13px] font-semibold tracking-tight',
                                    isDark ? 'text-zinc-300' : 'text-zinc-700'
                                )}
                                numberOfLines={1}
                            >
                                {title}
                            </Text>
                        ) : (
                            title
                        )}
                    </View>
                    {rightElement ? <View className="shrink-0">{rightElement}</View> : null}
                </View>
            )}

            <View
                className={twMerge(
                    'rounded-2xl p-4',
                    isDark ? 'bg-zinc-800' : 'bg-white',
                    innerClassName
                )}
                style={{
                    borderRadius: 10,
                    overflow: 'hidden',
                    backgroundColor: isDark ? '#27272A' : '#FFFFFF',
                    borderWidth: 0,
                    shadowOpacity: 0,
                    elevation: 0,
                }}
            >
                {children}
            </View>
        </View>
    );
}

export interface SectionRowProps {
    label: React.ReactNode;
    value: React.ReactNode;
    isLast?: boolean;
    hasDivider?: boolean;
    className?: string;
    labelClassName?: string;
    valueClassName?: string;
}

export function SectionRow({
    label,
    value,
    isLast = false,
    hasDivider = false,
    className,
    labelClassName,
    valueClassName,
}: SectionRowProps) {
    const { isDark } = useTheme();

    return (
        <View
            className={twMerge(
                'flex-row items-center justify-between py-2',
                hasDivider && !isLast && (isDark ? 'border-b border-zinc-700/60' : 'border-b border-zinc-100'),
                className
            )}
        >
            <View className="flex-1 pr-3">
                {typeof label === 'string' ? (
                    <Text
                        className={twMerge(
                            'text-xs font-medium',
                            isDark ? 'text-zinc-400' : 'text-zinc-500',
                            labelClassName
                        )}
                    >
                        {label}
                    </Text>
                ) : (
                    label
                )}
            </View>
            <View className="shrink-0">
                {typeof value === 'string' || typeof value === 'number' ? (
                    <Text
                        className={twMerge(
                            'text-xs font-bold text-right',
                            isDark ? 'text-zinc-100' : 'text-zinc-900',
                            valueClassName
                        )}
                    >
                        {value}
                    </Text>
                ) : (
                    value
                )}
            </View>
        </View>
    );
}

