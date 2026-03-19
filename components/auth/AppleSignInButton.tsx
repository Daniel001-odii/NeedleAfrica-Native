import React from 'react';
import { TouchableOpacity, ActivityIndicator, Platform, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Typography } from '../ui/Typography';
import { useTheme } from '../../contexts/ThemeContext';

interface AppleSignInButtonProps {
    onPress: () => void;
    isLoading?: boolean;
    className?: string;
    style?: ViewStyle;
    label?: string;
}

export const AppleSignInButton: React.FC<AppleSignInButtonProps> = ({ 
    onPress, 
    isLoading = false,
    className = "",
    style,
    label
}) => {
    const { isDark } = useTheme();

    if (Platform.OS !== 'ios') return null;

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={isLoading}
            style={style}
            className={`h-14 rounded-full bg-gray-100 dark:bg-dark-800 border border-gray-300 dark:border-dark-700 flex-row items-center justify-center active:opacity-70 ${className}`}
        >
            {isLoading ? (
                <ActivityIndicator color={isDark ? "white" : "black"} />
            ) : (
                <>
                    <Svg width="24" height="24" viewBox="0 0 24 24">
                        <Path
                            fill={isDark ? "white" : "black"}
                            d="M17.05 20.28c-.98.95-2.05.8-3.08.35c-1.09-.46-2.09-.48-3.24 0c-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8c1.18-.24 2.31-.93 3.57-.84c1.51.12 2.65.72 3.4 1.8c-3.12 1.87-2.38 5.98.48 7.13c-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25c.29 2.58-2.34 4.5-3.74 4.25"
                        />
                    </Svg>
                    <Typography color={isDark ? "white" : "black"} className="ml-2" weight="semibold">
                        {label || "Continue with Apple"}
                    </Typography>
                </>
            )}
        </TouchableOpacity>
    );
};
