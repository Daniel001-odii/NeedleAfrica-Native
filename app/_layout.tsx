import { Stack, router, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// import { StatusBar } from 'expo-status-bar';
// import { StatusBar } from 'react-native';
import { database } from '../database/watermelon/index.native';
import { Q } from '@nozbe/watermelondb';
import { DatabaseProvider } from '@nozbe/watermelondb/DatabaseProvider';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { AppState, KeyboardAvoidingView, NativeModules, Platform, View, StyleSheet } from 'react-native';
import { useSync } from '../hooks/useSync';
import { NotificationService } from '../services/NotificationService';
import { revenueCatService } from '../services/RevenueCatService';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import "../global.css";
import { PostHogProvider } from 'posthog-react-native';
import { posthog } from '../posthogConfig';
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
    const [pendingChat, setPendingChat] = useState<null | {
        roomId: string;
        clientName?: string;
        clientAvatar?: string;
        clientCity?: string;
    }>(null);
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
        const inCatalogExplainer = segments[0] === 'catalog-explainer';
        const inAiLab = segments[0] === 'ai-lab';
        const inExtras = segments[0] === 'extras';
        const inOrderRequestDetails = segments[0] === 'order-request-details';
        const inChats = segments[0] === 'chats';
        const inChatRoom = segments[0] === 'chat-room';

        if (!user && !inAuthGroup && !inOnboarding) {
            setTimeout(() => router.replace('/(auth)'), 0);
        } else if (user) {
            if (isNewUser) {
                if (!inOnboarding) {
                    setTimeout(() => router.replace('/onboarding'), 0);
                }
            } else if (!inTabs && !inMeasurements && !inTemplates && !inInvoices && !inNotifications && !inCatalogExplainer && !inAiLab && !inExtras && !inOrderRequestDetails && !inChats && !inChatRoom) {
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
                Notifications.setBadgeCountAsync(0).catch(console.error);
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
            }, 4500);
            return () => clearTimeout(timer);
        }
    }, [isLoading]);

    // 4. Deep-link chat message push notifications → open the chat room
    useEffect(() => {
        const handleResponse = (response: Notifications.NotificationResponse) => {
            const data = response?.notification?.request?.content?.data as
                | Record<string, any>
                | undefined;
            // Remember this notification so a stale cold-start response isn't re-handled
            const id = response?.notification?.request?.identifier;
            if (id) SecureStore.setItemAsync('last_handled_notif_id', id).catch(() => { });

            if (data?.type === 'chat_message' && data?.roomId) {
                setPendingChat({
                    roomId: String(data.roomId),
                    clientName: data.clientName ? String(data.clientName) : undefined,
                    clientAvatar: data.clientAvatar ? String(data.clientAvatar) : undefined,
                    clientCity: data.clientCity ? String(data.clientCity) : undefined,
                });
            }
        };

        // Taps while the app is running/backgrounded
        const sub = Notifications.addNotificationResponseReceivedListener(handleResponse);

        // Cold start: the app was launched by tapping a notification.
        // Skip if we already handled this exact notification on a previous launch.
        Notifications.getLastNotificationResponseAsync()
            .then(async (response) => {
                if (!response) return;
                const id = response.notification.request.identifier;
                const handled = await SecureStore.getItemAsync('last_handled_notif_id').catch(() => null);
                if (handled === id) return;
                handleResponse(response);
            })
            .catch(() => { });

        return () => sub.remove();
    }, []);

    // 5. Navigate to the chat room once the app is ready & the user is authenticated
    useEffect(() => {
        if (!pendingChat || !user || isNewUser || !isNavReady) return;
        const { roomId, clientName, clientAvatar, clientCity } = pendingChat;
        setPendingChat(null);
        router.push({
            pathname: '/chat-room',
            params: {
                roomId,
                ...(clientName ? { clientName } : {}),
                ...(clientAvatar ? { clientAvatar } : {}),
                ...(clientCity ? { clientCity } : {}),
            },
        });
    }, [pendingChat, user, isNewUser, isNavReady]);

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <View style={{ flex: 1, backgroundColor: isDark ? '#000000' : 'white' }}>
            <Stack
                screenOptions={{
                    animation: "fade",
                    headerShown: false,
                    contentStyle: { backgroundColor: isDark ? '#000000' : 'white' },
                }}
            >
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                <Stack.Screen name="catalog-explainer" options={{ headerShown: false, animation: 'fade', presentation: "card" }} />
                <Stack.Screen name="ai-lab" options={{ headerShown: false, animation: 'slide_from_right' }} />
                <Stack.Screen name="extras" options={{ headerShown: false, animation: 'slide_from_right' }} />
                <Stack.Screen name="notifications" options={{ headerShown: false, animation: 'slide_from_right' }} />
                <Stack.Screen name="chats" options={{ headerShown: false, animation: 'slide_from_right' }} />
                {/* gestureEnabled:false — the message rows use their own horizontal swipe-to-reply,
                    which otherwise collides with iOS's edge swipe-back (left-aligned incoming
                    bubbles start near the edge). Users go back via the header button. */}
                <Stack.Screen name="chat-room" options={{ headerShown: false, animation: 'slide_from_right', gestureEnabled: false }} />
                <Stack.Screen name="index" options={{ headerShown: false }} />
            </Stack>
            {(!isNavReady) && (
                <View style={[StyleSheet.absoluteFill, { zIndex: 99999 }]}>
                    <LoadingScreen />
                </View>
            )}

            <Toast config={toastConfig} />
            <StoreUpdateModal />
            <OfflineBanner />
        </View>
    );
}

export default function RootLayout() {
    useEffect(() => {
        revenueCatService.initialize().catch(err => console.error('RC Init failed:', err));
    }, []);

    return (
        <PostHogProvider client={posthog} debug={__DEV__}>
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
