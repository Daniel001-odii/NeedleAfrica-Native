import React, { useState } from 'react';
import { View, TextInput, ScrollView, TouchableOpacity, ImageBackground } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Lock, Keyboard, Eye, EyeSlash } from 'iconsax-react-native';
import { Typography } from '../../components/ui/Typography';
import { Surface } from '../../components/ui/Surface';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import Toast from 'react-native-toast-message';

export default function ResetPassword() {
    const { email } = useLocalSearchParams<{ email: string }>();
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { resetPassword, isLoading } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();

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
        <View style={{ flex: 1, backgroundColor: 'white' }}>
            <ImageBackground
                source={require('../../assets/images/tailor_auth_bg.png')}
                style={{ flex: 1 }}
                resizeMode="cover"
            >
                <LinearGradient
                    colors={['rgba(255,255,255,0.85)', 'rgba(255,255,255,0.95)', '#ffffff']}
                    style={{
                        flex: 1,
                        paddingHorizontal: 32,
                        paddingTop: insets.top,
                        paddingBottom: insets.bottom
                    }}
                >
                    <View style={{ paddingVertical: 16 }}>
                        <IconButton
                            icon={<ArrowLeft size={24} color="black" />}
                            onPress={() => router.back()}
                            className="bg-muted border-0"
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
                                <Surface variant="muted" rounded="2xl" className="flex-row items-center px-4 h-16 border border-gray-100">
                                    <Keyboard size={20} color="#6B7280" variant="Bulk" />
                                    <TextInput
                                        className="flex-1 ml-3 h-full font-semibold text-dark"
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
                                <Surface variant="muted" rounded="2xl" className="flex-row items-center px-4 h-16 border border-gray-100">
                                    <Lock size={20} color="#6B7280" variant="Bulk" />
                                    <TextInput
                                        className="flex-1 ml-3 h-full font-semibold text-dark"
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
                            className="h-16 rounded-full bg-dark border-0 shadow-lg"
                            textClassName="text-white text-lg font-bold"
                        >
                            Reset Password
                        </Button>
                    </ScrollView>
                </LinearGradient>
            </ImageBackground>
        </View>
    );
}
