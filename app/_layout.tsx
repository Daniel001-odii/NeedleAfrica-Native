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
import { NotificationService } from '../services/NotificationService';
import * as Notifications from 'expo-notifications';
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
import LoadingScreen from './loading';
import { toastConfig } from '../components/ui/CustomToast';

console.log('Is WatermelonDB Linked?', !!NativeModules.WMDatabaseBridge);

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNavWithLoading() {
    const { isLoading } = useAuth();
    const segments = useSegments();

    // Show loading screen while auth state is being determined
    // This is the global blocking loading state
    if (isLoading) {
        return <LoadingScreen />;
    }

    return <RootLayoutNav />;
}

function RootLayoutNav() {
    const { user, isLoading, isNewUser } = useAuth();
    const { sync } = useSync();
    const segments = useSegments();
    const router = useRouter();

    // 1. Auth redirection logic
    useEffect(() => {
        // Wait for auth to be ready
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(auth)';
        const inOnboarding = segments[0] === 'onboarding';
        const inTabs = segments[0] === '(tabs)';

        if (!user && !inAuthGroup && !inOnboarding) {
            // Not logged in: redirect to login
            router.replace('/(auth)/login');
        } else if (user) {
            // Logged in
            if (isNewUser) {
                // New user: go to onboarding
                if (!inOnboarding) {
                    router.replace('/onboarding');
                }
            } else if (!inTabs) {
                // Existing user not in tabs: go to main app
                router.replace('/(tabs)');
            }
        }
    }, [user, isLoading, segments, isNewUser]);

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

    // 3. Notification listeners
    useEffect(() => {
        const notificationListener = NotificationService.addNotificationReceivedListener(notification => {
            console.log('Notification received in foreground:', notification);
        });

        const responseListener = NotificationService.addNotificationResponseReceivedListener(response => {
            console.log('Notification response received:', response);
            // Handle navigation here if needed
        });

        return () => {
            NotificationService.removeNotificationSubscription(notificationListener);
            NotificationService.removeNotificationSubscription(responseListener);
        };
    }, []);

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: 'white' },
            }}
        >
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="index" options={{ headerShown: false }} />
        </Stack>
    );
}

import { GestureHandlerRootView } from 'react-native-gesture-handler';

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

    const fontsReady = loaded || error;

    useEffect(() => {
        if (fontsReady) {
            SplashScreen.hideAsync();
        }
    }, [fontsReady]);

    if (!fontsReady) {
        return null;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <DatabaseProvider database={database}>
                    <AuthProvider>
                        <RootLayoutNavWithLoading />
                        <StatusBar style="auto" translucent={false} />
                        <Toast config={toastConfig} />
                    </AuthProvider>
                </DatabaseProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
