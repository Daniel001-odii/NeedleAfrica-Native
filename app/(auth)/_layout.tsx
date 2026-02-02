import { Stack } from 'expo-router';
import { AuthProvider } from '../../contexts/AuthContext';

export default function AuthLayout() {
    return (
        <AuthProvider>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="login" />
                <Stack.Screen name="sign-up" />
                <Stack.Screen name="forgot-password" />
            </Stack>
        </AuthProvider>
    );
}
