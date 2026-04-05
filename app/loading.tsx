import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import * as SplashScreen from 'expo-splash-screen';

export default function LoadingScreen() {
    const { isDark, isHydrated } = useTheme();

    // Fallback to light mode immediately while waiting for context hydration
    const effectiveIsDark = isHydrated ? isDark : false;

    // ONLY hide the native splash screen after the React theme is hydrated
    // This ensures we always transition from native splash to the correct React background color.
    useEffect(() => {
        if (isHydrated) {
            const hideSplash = async () => {
                try {
                    // Small delay to ensure the background color has actually applied to the View
                    setTimeout(async () => {
                        await SplashScreen.hideAsync();
                    }, 50);
                } catch (e) { }
            };
            hideSplash();
        }
    }, [isHydrated]);

    return (
        <View style={[styles.container, { backgroundColor: effectiveIsDark ? '#FF5678' : '#FF5678' }]}>
            <Image 
                source={require('../assets/splash-image.png')} 
                style={{ width: 180, height: 180, marginBottom: 40 }} 
                resizeMode="contain"
            />
            <ActivityIndicator size="large" color="#ffffff" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 99999,
    }
});
