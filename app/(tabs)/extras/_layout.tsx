import { Stack } from 'expo-router';

export default function ExtrasLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: 'white' },
                animation: 'fade',
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="monogram" />
            <Stack.Screen name="templates-library" />
        </Stack>
    );
}
