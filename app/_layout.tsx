import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { database } from '../database/watermelon';
import { DatabaseProvider } from '@nozbe/watermelondb/DatabaseProvider';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { AppState, NativeModules } from 'react-native';
import { useSync } from '../hooks/useSync';
import {
    useFonts,
    PlayfairDisplay_400Regular,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_800ExtraBold,
    PlayfairDisplay_900Black
} from '@expo-google-fonts/playfair-display';
import {
    SpaceGrotesk_300Light,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold
} from '@expo-google-fonts/space-grotesk';
import "../global.css";

import Toast from 'react-native-toast-message';
import { toastConfig } from '../components/ui/CustomToast';

console.log('Is WatermelonDB Linked?', !!NativeModules.WMDatabaseBridge);

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
    const { user, isLoading } = useAuth();
    const { sync } = useSync();
    const segments = useSegments();
    const router = useRouter();

    // 1. Auth redirection logic
    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!user && !inAuthGroup) {
            router.replace('/(auth)/login');
        } else if (user && inAuthGroup) {
            router.replace('/(tabs)');
        }
    }, [user, isLoading, segments]);

    // 2. Sync logic: Interval & Foreground
    useEffect(() => {
        if (!user) return;

        // Sync every 30 seconds
        const interval = setInterval(() => {
            console.log('Performing periodic background sync...');
            sync().catch(console.error);
        }, 30 * 1000);

        // Sync on app foreground
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                console.log('App returned to foreground, performing sync...');
                sync().catch(console.error);
            }
        });

        // Initial sync on mount if logged in
        sync().catch(console.error);

        return () => {
            clearInterval(interval);
            subscription.remove();
        };
    }, [user, sync]);

    if (isLoading) return null;

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="index" options={{ headerShown: false }} />
        </Stack>
    );
}

export default function RootLayout() {
    const [loaded, error] = useFonts({
        'Playfair-Regular': PlayfairDisplay_400Regular,
        'Playfair-Medium': PlayfairDisplay_500Medium,
        'Playfair-SemiBold': PlayfairDisplay_600SemiBold,
        'Playfair-Bold': PlayfairDisplay_700Bold,
        'Playfair-ExtraBold': PlayfairDisplay_800ExtraBold,
        'Playfair-Black': PlayfairDisplay_900Black,
        'Grotesk-Light': SpaceGrotesk_300Light,
        'Grotesk-Regular': SpaceGrotesk_400Regular,
        'Grotesk-Medium': SpaceGrotesk_500Medium,
        'Grotesk-SemiBold': SpaceGrotesk_600SemiBold,
        'Grotesk-Bold': SpaceGrotesk_700Bold,
    });

    useEffect(() => {
        if (loaded || error) {
            SplashScreen.hideAsync();
        }
    }, [loaded, error]);

    if (!loaded && !error) {
        return null;
    }

    return (
        <SafeAreaProvider>
            <DatabaseProvider database={database}>
                <AuthProvider>
                    <RootLayoutNav />
                    <StatusBar style="auto" />
                    <Toast config={toastConfig} />
                </AuthProvider>
            </DatabaseProvider>
        </SafeAreaProvider>
    );
}
