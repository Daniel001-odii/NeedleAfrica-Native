import React, { useState } from 'react';
import { View, TextInput, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Sms, Lock, User, Eye, EyeSlash, ArrowLeft, Shop } from 'iconsax-react-native';
import { Typography } from '../../components/ui/Typography';
import { Surface } from '../../components/ui/Surface';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { useTheme } from '../../contexts/ThemeContext';
import { AppleSignInButton } from '../../components/auth/AppleSignInButton';
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';

import Toast from 'react-native-toast-message';

export default function SignUp() {
    const [name, setName] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { signUp, signInWithGoogle, signInWithApple, isActionLoading } = useAuth();
    const { isDark } = useTheme();
    const router = useRouter();

    const handleGoogleSignIn = async () => {
        try {
            await signInWithGoogle();
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Logged in with Google'
            });
            router.replace('/onboarding');
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

    const handleAppleSignIn = async () => {
        try {
            await signInWithApple();
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Logged in with Apple'
            });
            router.replace('/onboarding');
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Apple Sign-In Failed',
                text2: error.message || 'Check your internet and try again'
            });
        }
    };

    const handleSignUp = async () => {
        if (!name || !email || !password || !businessName) {
            Toast.show({
                type: 'error',
                text1: 'Required Fields',
                text2: 'Please fill in all fields'
            });
            return;
        }
        try {
            await signUp(email, password, name, businessName);

            Toast.show({
                type: 'success',
                text1: 'Account Created',
                text2: 'Welcome to Needle Africa!'
            });
            router.replace('/onboarding');
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Registration Failed',
                text2: error.message || 'Something went wrong'
            });
            console.error(error);
        }
    };

    return (
        <View className="flex-1 bg-muted dark:bg-background-dark p-6">
            <View style={{ paddingVertical: 16 }}>
                <IconButton
                    icon={<ArrowLeft size={24} color={isDark ? "white" : "black"} />}
                    onPress={() => router.back()}
                    className="bg-muted dark:bg-background-dark border-0"
                />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 40 }}
            >
                <View className="mb-10">
                    <Typography variant="h1" weight="bold" className="mb-2">Create Account</Typography>
                    <Typography color="gray" variant="subtitle">Join the NeedleAfrica community</Typography>
                </View>

                <View className="mb-8">
                    <View className="mb-6">
                        <Typography variant="caption" weight="bold" color="gray" className="ml-1 mb-2 uppercase">Full Name</Typography>
                        <Surface variant="muted" rounded="2xl" className="flex-row items-center px-4 h-16">
                            <User size={20} color="#6B7280" variant="Bulk" />
                            <TextInput
                                className="flex-1 ml-3 h-full font-semibold text-dark dark:text-white"
                                placeholder="Jane Doe"
                                placeholderTextColor="#9CA3AF"
                                value={name}
                                onChangeText={setName}
                            />
                        </Surface>
                    </View>
                    <View className="mb-6">
                        <Typography variant="caption" weight="bold" color="gray" className="ml-1 mb-2 uppercase">Business Name</Typography>
                        <Surface variant="muted" rounded="2xl" className="flex-row items-center px-4 h-16">
                            <Shop size={20} color="#6B7280" variant="Bulk" />
                            <TextInput
                                className="flex-1 ml-3 h-full font-semibold text-dark dark:text-white"
                                placeholder="Needle Africa Tailors"
                                placeholderTextColor="#9CA3AF"
                                value={businessName}
                                onChangeText={setBusinessName}
                            />
                        </Surface>
                    </View>

                    <View className="mb-6">
                        <Typography variant="caption" weight="bold" color="gray" className="ml-1 mb-2 uppercase">Email Address</Typography>
                        <Surface variant="muted" rounded="2xl" className="flex-row items-center px-4 h-16">
                            <Sms size={20} color="#6B7280" variant="Bulk" />
                            <TextInput
                                className="flex-1 ml-3 h-full font-semibold text-dark dark:text-white"
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
                        <Typography variant="caption" weight="bold" color="gray" className="ml-1 mb-2 uppercase">Password</Typography>
                        <Surface variant="muted" rounded="2xl" className="flex-row items-center px-4 h-16">
                            <Lock size={20} color="#6B7280" variant="Bulk" />
                            <TextInput
                                className="flex-1 ml-3 h-full font-semibold text-dark dark:text-white"
                                placeholder="Create a password"
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
                    onPress={handleSignUp}
                    isLoading={isActionLoading}
                    className="h-16 rounded-full bg-blue-500 border-0 mb-4"
                    textClassName="text-white dark:text-black text-lg font-bold"
                >
                    Get Started
                </Button>

                <AppleSignInButton 
                    onPress={handleAppleSignIn}
                    isLoading={isActionLoading}
                    className="mb-4"
                />

                <GoogleSignInButton 
                    onPress={handleGoogleSignIn}
                    isLoading={isActionLoading}
                    className="mb-8"
                />

                <View className="flex-row justify-center items-center pb-10">
                    <Typography color="gray">Already have an account? </Typography>
                    <Link href="/(auth)/login" asChild>
                        <TouchableOpacity>
                            <Typography weight="bold" color="primary">Sign in</Typography>
                        </TouchableOpacity>
                    </Link>
                </View>
            </ScrollView>
        </View>
    );
}
