import { Stack } from 'expo-router';

export default function ProfileLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: 'white' },
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="personal" />
            <Stack.Screen name="preferences" />
            <Stack.Screen name="backup" />
            <Stack.Screen name="download-data" />
        </Stack>
    );
}
