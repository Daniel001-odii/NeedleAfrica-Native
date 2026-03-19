import React, { useState } from 'react';
import { View, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Lock, Keyboard, Eye, EyeSlash } from 'iconsax-react-native';
import { Typography } from '../../components/ui/Typography';
import { Surface } from '../../components/ui/Surface';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Toast from 'react-native-toast-message';

export default function ResetPassword() {
    const { email } = useLocalSearchParams<{ email: string }>();
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { resetPassword, isLoading } = useAuth();
    const { isDark } = useTheme();
    const router = useRouter();

    const handleReset = async () => {
        if (!email || !otp || !password) {
            Toast.show({
                type: 'error',
                text1: 'Required Fields',
                text2: 'Please fill in all fields'
            });
            return;
        }

        try {
            await resetPassword(email, otp, password);
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Password reset successfully'
            });
            router.replace('/(auth)/login');
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Reset Failed',
                text2: error.message || 'Something went wrong'
            });
        }
    };

    return (
        <View className="flex-1 bg-background dark:bg-background-dark p-6">
            <View style={{ paddingVertical: 16 }}>
                <IconButton
                    icon={<ArrowLeft size={24} color={isDark ? "white" : "black"} />}
                    onPress={() => router.back()}
                    className="bg-background dark:bg-background-dark border-0"
                />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 40 }}
            >
                <View className="mb-10">
                    <Typography variant="h1" weight="bold" className="mb-2">Verify OTP</Typography>
                    <Typography color="gray" variant="subtitle">
                        Enter the 4-digit code sent to your email and your new password.
                    </Typography>
                </View>

                <View className="mb-8">
                    <View className="mb-6">
                        <Typography variant="caption" weight="bold" color="gray" className="ml-1 mb-2 uppercase">4-Digit OTP</Typography>
                        <Surface variant="muted" rounded="2xl" className="flex-row items-center px-4 h-16">
                            <Keyboard size={20} color="#6B7280" variant="Bulk" />
                            <TextInput
                                className="flex-1 ml-3 h-full font-semibold text-dark dark:text-white"
                                placeholder="1234"
                                placeholderTextColor="#9CA3AF"
                                value={otp}
                                onChangeText={setOtp}
                                keyboardType="number-pad"
                                maxLength={4}
                            />
                        </Surface>
                    </View>

                    <View className="mb-2">
                        <Typography variant="caption" weight="bold" color="gray" className="ml-1 mb-2 uppercase">New Password</Typography>
                        <Surface variant="muted" rounded="2xl" className="flex-row items-center px-4 h-16">
                            <Lock size={20} color="#6B7280" variant="Bulk" />
                            <TextInput
                                className="flex-1 ml-3 h-full font-semibold text-dark dark:text-white"
                                placeholder="New password"
                                placeholderTextColor="#9CA3AF"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                {showPassword ? (
                                    <EyeSlash size={20} color="#6B7280" />
                                ) : (
                                    <Eye size={20} color="#6B7280" />
                                )}
                            </TouchableOpacity>
                        </Surface>
                    </View>
                </View>

                <Button
                    onPress={handleReset}
                    isLoading={isLoading}
                    className="h-16 rounded-full bg-dark dark:bg-white border-0 mb-4"
                    textClassName="text-white dark:text-black text-lg font-bold"
                >
                    Reset Password
                </Button>
            </ScrollView>
        </View>
    );
}
