import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image, useColorScheme } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import * as SplashScreen from 'expo-splash-screen';

export default function LoadingScreen() {
    const { isDark, isHydrated } = useTheme();
    const systemColorScheme = useColorScheme();

    // Fallback to light mode immediately while waiting for context hydration
    // to match the app's default theme setting.
    const effectiveIsDark = isHydrated ? isDark : false;

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const loaderAnim = useRef(new Animated.Value(-40)).current;

    useEffect(() => {
        // Entrance animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            })
        ]).start();

        // Continuous loader animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(loaderAnim, {
                    toValue: 40,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(loaderAnim, {
                    toValue: -40,
                    duration: 0,
                    useNativeDriver: true,
                })
            ])
        ).start();
    }, []);

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
        <View style={[styles.container, { backgroundColor: effectiveIsDark ? '#000000' : '#ffffff' }]}>
            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }]
                    }
                ]}
            >
                <Image
                    source={require('../assets/icon.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />

                {/* Modern subtle loader */}
                <View style={styles.indicatorContainer}>
                    <View style={[styles.bgLine, { backgroundColor: effectiveIsDark ? '#ffffff10' : '#00000005' }]} />
                    <Animated.View
                        style={[
                            styles.indicator,
                            {
                                backgroundColor: '#6366f1',
                                transform: [{ translateX: loaderAnim }]
                            }
                        ]}
                    />
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 99999,
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: 140,
        height: 140,
    },
    indicatorContainer: {
        marginTop: 50,
        width: 60,
        height: 3,
        borderRadius: 2,
        overflow: 'hidden',
        position: 'relative',
    },
    bgLine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    indicator: {
        width: 30,
        height: '100%',
        borderRadius: 2,
    }
});
