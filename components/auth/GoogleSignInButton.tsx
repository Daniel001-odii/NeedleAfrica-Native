import React from 'react';
import { TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Typography } from '../ui/Typography';
import { useTheme } from '../../contexts/ThemeContext';

interface GoogleSignInButtonProps {
    onPress: () => void;
    isLoading?: boolean;
    className?: string;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ 
    onPress, 
    isLoading = false,
    className = ""
}) => {
    const { isDark } = useTheme();

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={isLoading}
            className={`h-14 rounded-full bg-gray-100 dark:bg-dark-800 border border-gray-300 dark:border-dark-700 flex-row items-center justify-center active:opacity-70 ${className}`}
        >
            {isLoading ? (
                <ActivityIndicator color={isDark ? "white" : "black"} />
            ) : (
                <>
                    <Image
                        source={require('../../assets/images/google_logo.png')}
                        className="w-5 h-5 mr-3"
                        resizeMode="contain"
                    />
                    <Typography color={isDark ? "white" : "black"} weight="semibold">
                        Continue with Google
                    </Typography>
                </>
            )}
        </TouchableOpacity>
    );
};
