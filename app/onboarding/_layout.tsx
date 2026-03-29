import React from 'react';
import { Stack } from 'expo-router';
import { View } from 'react-native';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { Typography } from '../../components/ui/Typography';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnboardingLayout() {
    const { state } = useOnboarding();
    const { isDark } = useTheme();

    const totalSteps = 5; // Workspace, Business, Customer, Measurements, Order
    const progress = (state.step / totalSteps) * 100;

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1 bg-white">
                {/* Simple Progress Bar */}
                <View className="h-1 bg-gray-100 w-full">
                    <View
                        className="h-full bg-blue-500"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                </View>

                <Stack
                    screenOptions={{
                        headerShown: false,
                        animation: 'slide_from_right',
                        contentStyle: { backgroundColor: 'white' }
                    }}
                >
                    <Stack.Screen name="index" />
                    <Stack.Screen name="business" />
                    <Stack.Screen name="customer" />
                    <Stack.Screen name="measurements" />
                    <Stack.Screen name="order" />
                    <Stack.Screen name="completion" />
                </Stack>
            </View>
        </SafeAreaView>
    );
}
