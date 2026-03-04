import React, { useState } from 'react';
import { View, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Sms, InfoCircle } from 'iconsax-react-native';
import { Typography } from '../../components/ui/Typography';
import { Surface } from '../../components/ui/Surface';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';

import { useAuth } from '../../contexts/AuthContext';
import Toast from 'react-native-toast-message';
import Svg, { Path } from 'react-native-svg';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const { forgotPassword, isLoading } = useAuth();
    const router = useRouter();

    const handleReset = async () => {
        if (!email) {
            Toast.show({
                type: 'error',
                text1: 'Required',
                text2: 'Please enter your email address'
            });
            return;
        }

        try {
            await forgotPassword(email);
            Toast.show({
                type: 'success',
                text1: 'OTP Sent',
                text2: 'Check your email for the 4-digit code'
            });
            router.push({
                pathname: '/(auth)/reset-password',
                params: { email }
            });
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to send OTP'
            });
        }
    };

    return (
        <View className="flex-1 bg-muted p-12">
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
                <View className="items-center mb-10">

                    <Typography variant="h1" weight="bold" className="mb-2 text-center">Forgot password?</Typography>
                    <Typography color="gray" variant="subtitle" className="text-center px-4">
                        Enter your email and we'll send you a link to reset your password.
                    </Typography>
                </View>

                <View className="mb-10">
                    <Typography variant="caption" weight="bold" color="gray" className="ml-1 mb-2 uppercase">Email Address</Typography>
                    <Surface variant="muted" rounded="2xl" className="flex-row items-center px-4 h-16 bg-gray-200">
                        <Sms size={20} color="#6B7280" variant="Bulk" />
                        <TextInput
                            className="flex-1 ml-3 h-full font-semibold text-dark"
                            placeholder="your@email.com"
                            placeholderTextColor="#9CA3AF"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </Surface>
                </View>

                <Button
                    onPress={handleReset}
                    isLoading={isLoading}
                    className="h-16 rounded-full bg-dark border-0 mb-4"
                    textClassName="text-white text-lg font-bold"
                >
                    Send OTP Code
                </Button>
            </ScrollView>
        </View>
    );
}
