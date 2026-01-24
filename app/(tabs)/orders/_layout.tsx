import { Stack } from 'expo-router';

export default function OrdersLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: 'white' },
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="new" />
            <Stack.Screen name="[id]" />
        </Stack>
    );
}
