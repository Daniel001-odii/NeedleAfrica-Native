import { Stack, router, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { database } from '../database/watermelon';
import { Q } from '@nozbe/watermelondb';
import { DatabaseProvider } from '@nozbe/watermelondb/DatabaseProvider';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { AppState, KeyboardAvoidingView, NativeModules, Platform, View, StyleSheet } from 'react-native';
import { useSync } from '../hooks/useSync';
import { NotificationService } from '../services/NotificationService';
import { revenueCatService } from '../services/RevenueCatService';
import * as Notifications from 'expo-notifications';
import "../global.css";
import { PostHogProvider } from 'posthog-react-native'
import Toast from 'react-native-toast-message';
import LoadingScreen from './loading';
import { toastConfig } from '../components/ui/CustomToast';
import { OfflineBanner } from '../components/ui/OfflineBanner';
import { StoreUpdateModal } from '../components/ui/StoreUpdateModal';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ConfirmProvider } from '../contexts/ConfirmContext';
import { OnboardingProvider } from '../contexts/OnboardingContext';

console.log('Is WatermelonDB Linked?', !!NativeModules.WMDatabaseBridge);

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
    const { user, isLoading, isNewUser } = useAuth();
    const [isNavReady, setIsNavReady] = useState(false);
    const { sync } = useSync();
    const { isDark } = useTheme();
    const segments = useSegments();

    // 1. Auth redirection logic
    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(auth)';
        const inOnboarding = segments[0] === 'onboarding';
        const inTabs = segments[0] === '(tabs)';
        const inMeasurements = segments[0] === 'measurements';
        const inTemplates = segments[0] === 'measurement-templates';
        const inInvoices = segments[0] === 'invoices';
        const inNotifications = segments[0] === 'notifications';

        if (!user && !inAuthGroup && !inOnboarding) {
            setTimeout(() => router.replace('/(auth)'), 0);
        } else if (user) {
            if (isNewUser) {
                if (!inOnboarding) {
                    setTimeout(() => router.replace('/onboarding'), 0);
                }
            } else if (!inTabs && !inMeasurements && !inTemplates && !inInvoices && !inNotifications) {
                setTimeout(() => router.replace('/(tabs)'), 0);
            }
        }
    }, [user, isLoading, segments, isNewUser]);

    // 2. Sync logic: Interval & Foreground
    useEffect(() => {
        if (!user) return;

        const performSync = async () => {
            try {
                await sync();
            } catch (e) {
                console.error('[RootLayout] Background sync error:', e);
            }
        };

        const interval = setInterval(performSync, 60 * 1000);
        const subscription = AppState.addEventListener('change', async nextAppState => {
            if (nextAppState === 'active') {
                performSync();
                revenueCatService.getCustomerInfo().catch(console.error);
            }
        });

        performSync();
        return () => {
            clearInterval(interval);
            subscription.remove();
        };
    }, [user, sync]);

    // 3. Early Hider Effect
    useEffect(() => {
        if (!isLoading) {
            const timer = setTimeout(() => {
                SplashScreen.hideAsync().catch(() => { });
                setIsNavReady(true);
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [isLoading]);

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <View style={{ flex: 1, backgroundColor: isDark ? '#000000' : 'white' }}>
            <OfflineBanner />
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: isDark ? '#000000' : 'white' },
                }}
            >
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                <Stack.Screen name="notifications" options={{ presentation: 'modal', headerShown: false }} />
                <Stack.Screen name="index" options={{ headerShown: false }} />
            </Stack>
            {(!isNavReady) && (
                <View style={[StyleSheet.absoluteFill, { zIndex: 99999 }]}>
                    <LoadingScreen />
                </View>
            )}
            <StatusBar style={isDark ? "light" : "dark"} translucent={true} />
            <Toast config={toastConfig} />
            <StoreUpdateModal />
        </View>
    );
}

export default function RootLayout() {
    useEffect(() => {
        revenueCatService.initialize().catch(err => console.error('RC Init failed:', err));
    }, []);

    return (
        <PostHogProvider
            apiKey={process.env.EXPO_PUBLIC_POSTHOG_API_KEY}
            debug={true}
            options={{
                host: "https://us.i.posthog.com",
                enableSessionReplay: true,
                sessionReplayConfig: {
                    maskAllTextInputs: true,
                    maskAllImages: false,
                    captureLog: true,
                    captureNetworkTelemetry: true,
                },
            }}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'android' ? -100 : 0}
                    style={{ flex: 1 }}
                >
                    <SafeAreaProvider>
                        <DatabaseProvider database={database}>
                            <AuthProvider>
                                <ThemeProvider>
                                        <ConfirmProvider>
                                            <OnboardingProvider>
                                                <RootLayoutNav />
                                            </OnboardingProvider>
                                        </ConfirmProvider>
                                </ThemeProvider>
                            </AuthProvider>
                        </DatabaseProvider>
                    </SafeAreaProvider>
                </KeyboardAvoidingView>
            </GestureHandlerRootView>
        </PostHogProvider>
    );
}
