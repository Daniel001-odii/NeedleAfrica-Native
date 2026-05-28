import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { useTheme } from '../contexts/ThemeContext';
import * as SplashScreen from 'expo-splash-screen';

export default function LoadingScreen() {
    const { isHydrated } = useTheme();
    const animationRef = useRef<LottieView>(null);

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
        <View style={[styles.container, { backgroundColor: '#FF5678' }]}>
            <LottieView
                ref={animationRef}
                source={require('../assets/NeedleXLogo_Lottie.json')}
                style={{ width: 300, height: 300 }}
                autoPlay
                loop
                resizeMode="contain"
            />
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
