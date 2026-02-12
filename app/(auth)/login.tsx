import React, { useState } from 'react';
import { View, TextInput, ScrollView, TouchableOpacity, ImageBackground, Image } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Sms, Lock, Eye, EyeSlash, ArrowLeft } from 'iconsax-react-native';
import { Typography } from '../../components/ui/Typography';
import { Surface } from '../../components/ui/Surface';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import Toast from 'react-native-toast-message';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { signIn, signInWithGoogle, isLoading } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const handleGoogleSignIn = async () => {
        try {
            await signInWithGoogle();
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Logged in with Google'
            });
            router.replace('/(tabs)');
        } catch (error: any) {
            if (error.code !== 'ASYNC_OP_IN_PROGRESS') {
                Toast.show({
                    type: 'error',
                    text1: 'Google Sign-In Failed',
                    text2: error.message || 'Check your internet and try again'
                });
            }
        }
    };

    const handleLogin = async () => {
        if (!email || !password) {
            Toast.show({
                type: 'error',
                text1: 'Required Fields',
                text2: 'Please enter both email and password'
            });
            return;
        }
        try {
            await signIn(email, password);
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Logged in successfully'
            });
            // Explicitly redirect to tabs
            router.replace('/(tabs)');
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Login Failed',
                text2: error.message || 'Check your credentials and try again'
            });
            console.error(error);
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
                            <Typography variant="h1" weight="bold" className="mb-2">Welcome Back</Typography>
                            <Typography color="gray" variant="subtitle">Sign in to manage your workshop</Typography>
                        </View>

                        <View className="mb-8">
                            <View className="mb-6">
                                <Typography variant="caption" weight="bold" color="gray" className="ml-1 mb-2 uppercase">Email Address</Typography>
                                <Surface variant="muted" rounded="2xl" className="flex-row items-center px-4 h-16 border border-gray-100">
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

                            <View className="mb-2">
                                <View className="flex flex-row justify-between mb-2">
                                    <Typography variant="caption" weight="bold" color="gray" className=" uppercase">Password</Typography>
                                    <Link href="/(auth)/forgot-password" asChild>
                                        <TouchableOpacity className="self-end">
                                            <Typography variant="body" weight="bold" color="primary">Forgot password?</Typography>
                                        </TouchableOpacity>
                                    </Link>
                                </View>
                                <Surface variant="muted" rounded="2xl" className="flex-row items-center px-4 h-16 border border-gray-100">
                                    <Lock size={20} color="#6B7280" variant="Bulk" />
                                    <TextInput
                                        className="flex-1 ml-3 h-full font-semibold text-dark"
                                        placeholder="Your password"
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
                            onPress={handleLogin}
                            isLoading={isLoading}
                            className="h-16 rounded-full bg-dark border-0 shadow-lg mb-4"
                            textClassName="text-white text-lg font-bold"
                        >
                            Sign In
                        </Button>

                        <TouchableOpacity
                            onPress={handleGoogleSignIn}
                            disabled={isLoading}
                            className="h-16 rounded-full bg-white border border-gray-100 flex-row items-center justify-center shadow-sm mb-8 active:bg-gray-50"
                        >
                            <Image
                                source={require('../../assets/images/google_logo.png')}
                                className="w-6 h-6 mr-3"
                                resizeMode="contain"
                            />
                            <Typography weight="bold" color="dark">Continue with Google</Typography>
                        </TouchableOpacity>

                        <View className="flex-row justify-center items-center pb-10">
                            <Typography color="gray">Don't have an account? </Typography>
                            <Link href="/(auth)/sign-up" asChild>
                                <TouchableOpacity>
                                    <Typography weight="bold" color="primary">Sign up</Typography>
                                </TouchableOpacity>
                            </Link>
                        </View>
                    </ScrollView>
                </LinearGradient>
            </ImageBackground>
        </View>
    );
}
