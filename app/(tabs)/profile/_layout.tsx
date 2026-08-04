import { Stack } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';

export default function ProfileLayout() {
    const { isDark } = useTheme();
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: isDark ? 'black' : 'white' },
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="personal" />
            <Stack.Screen name="preferences" />
            <Stack.Screen name="backup" />
            <Stack.Screen name="download-data" />
            <Stack.Screen name="catalog" />
        </Stack>
    );
}
