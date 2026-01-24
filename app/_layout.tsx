import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { migrateDbIfNeeded } from '../database/sqlite';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
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

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

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
            <SQLiteProvider databaseName="needleafrica.db" onInit={migrateDbIfNeeded}>
                <AuthProvider>
                    <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    </Stack>
                    <StatusBar style="auto" />
                </AuthProvider>
            </SQLiteProvider>
        </SafeAreaProvider>
    );
}
