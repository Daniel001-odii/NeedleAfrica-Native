import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { database } from '../database/watermelon';
import { DatabaseProvider } from '@nozbe/watermelondb/DatabaseProvider';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { AppState, NativeModules, View } from 'react-native';
import { useSync } from '../hooks/useSync';
import { NotificationService } from '../services/NotificationService';
import { revenueCatService } from '../services/RevenueCatService';
import * as Notifications from 'expo-notifications';
// import {
//     useFonts,
//     PlayfairDisplay_400Regular,
//     PlayfairDisplay_500Medium,
//     PlayfairDisplay_600SemiBold,
//     PlayfairDisplay_700Bold,
//     PlayfairDisplay_800ExtraBold,
//     PlayfairDisplay_900Black
// } from '@expo-google-fonts/playfair-display';
// import {
//     SpaceGrotesk_300Light,
//     SpaceGrotesk_400Regular,
//     SpaceGrotesk_500Medium,
//     SpaceGrotesk_600SemiBold,
//     SpaceGrotesk_700Bold
// } from '@expo-google-fonts/space-grotesk';
import "../global.css";

import { PostHogProvider } from 'posthog-react-native'
import { posthog } from '../posthogConfig';

import Toast from 'react-native-toast-message';
import LoadingScreen from './loading';
import { toastConfig } from '../components/ui/CustomToast';
import { OfflineBanner } from '../components/ui/OfflineBanner';

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
    const { isDark } = useTheme();
    const segments = useSegments();
    const router = useRouter();

    // 1. Auth redirection logic
    useEffect(() => {
        // Wait for auth to be ready
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(auth)';
        const inOnboarding = segments[0] === 'onboarding';
        const inTabs = segments[0] === '(tabs)';
        const inMeasurements = segments[0] === 'measurements';
        const inTemplates = segments[0] === 'measurement-templates';
        const inInvoices = segments[0] === 'invoices';

        if (!user && !inAuthGroup && !inOnboarding) {
            // Not logged in: redirect to login
            setTimeout(() => router.replace('/(auth)'), 0);
        } else if (user) {
            // Logged in
            if (isNewUser) {
                // New user: go to onboarding
                if (!inOnboarding) {
                    setTimeout(() => router.replace('/onboarding'), 0);
                }
            } else if (!inTabs && !inMeasurements && !inTemplates && !inInvoices) {
                // Existing user not in a valid protected route (like measurements): go to main app
                setTimeout(() => router.replace('/(tabs)'), 0);
            }
        }
    }, [user, isLoading, segments, isNewUser]);


    // 2. Sync logic: Interval & Foreground
    useEffect(() => {
        if (!user) return;

        // Sync every 30 seconds
        const interval = setInterval(async () => {
            console.log('Performing periodic background sync...');
            try {
                await sync();
                const orders = await database.get('orders').query().fetch();
                await NotificationService.refreshAllReminders(orders, user);
            } catch (e) {
                console.error(e);
            }
        }, 30 * 1000);

        // Sync on app foreground
        const subscription = AppState.addEventListener('change', async nextAppState => {
            if (nextAppState === 'active') {
                console.log('App returned to foreground, performing sync...');
                sync().catch(console.error);

                // Refresh subscription status
                try {
                    await revenueCatService.getCustomerInfo();
                } catch (rcError) {
                    console.error('Failed to refresh subscription status on foreground:', rcError);
                }
            }
        });

        // Initial sync and reminder refresh on mount if logged in
        const initializeReminders = async () => {
            try {
                await sync();
                const orders = await database.get('orders').query().fetch();
                await NotificationService.refreshAllReminders(orders, user);
            } catch (e) {
                console.error('Failed to init reminders:', e);
            }
        };

        initializeReminders();

        return () => {
            clearInterval(interval);
            subscription.remove();
        };
    }, [user, sync]);

    // 3. Early Hider Effect: Ensure native splash is hidden once JS is ready
    useEffect(() => {
        if (!isLoading) {
            // Give the app a moment to render the first frame
            const timer = setTimeout(() => {
                SplashScreen.hideAsync().catch(() => { });
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isLoading]);

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

    // 4. Loading & Redirection state handling
    // Only show full-screen loading when the initial auth state is unknown
    if (isLoading) return <LoadingScreen />;

    // For better reliability, we avoid returning LoadingScreen for intermediate redirect states
    // within RootLayoutNav, and instead handle the "nothing to show" state via route-level checks
    // if necessary. However, the current stack will render the appropriate screen which
    // will then immediately trigger the redirect in the useEffect above.


    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: isDark ? '#000000' : 'white' },
            }}
        >
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="index" options={{ headerShown: false }} />
        </Stack>
    );
}

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ConfirmProvider } from '../contexts/ConfirmContext';

function ThemeAwareRoot() {
    const { isDark } = useTheme();
    return (
        <View style={{ flex: 1, backgroundColor: isDark ? '#000000' : 'white' }}>
            <OfflineBanner />
            <RootLayoutNavWithLoading />
            <StatusBar style={isDark ? "light" : "dark"} translucent={true} />
            <Toast config={toastConfig} />
        </View>
    );
}

export default function RootLayout() {
    const fontsReady = true;

    // Splash screen is hidden manually in app/loading.tsx to ensure a smooth transition
    // from native splash to custom React splash.


    // Initialize RevenueCat on app start
    useEffect(() => {
        const initializeRevenueCat = async () => {
            try {
                await revenueCatService.initialize();
                console.log('RevenueCat initialized successfully');
            } catch (error) {
                console.error('Failed to initialize RevenueCat:', error);
            }
        };

        initializeRevenueCat();
    }, []);

    if (!fontsReady) {
        return null;
    }

    return (
        <PostHogProvider client={posthog}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <SafeAreaProvider>
                    <DatabaseProvider database={database}>
                        <AuthProvider>
                            <ThemeProvider>
                                <ConfirmProvider>
                                    <ThemeAwareRoot />
                                </ConfirmProvider>
                            </ThemeProvider>
                        </AuthProvider>
                    </DatabaseProvider>
                </SafeAreaProvider>
            </GestureHandlerRootView>
        </PostHogProvider>
    );
}
