import React, { useState } from 'react';
import { View, TextInput, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, ImageBackground, Image } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Sms, Lock, User, Eye, EyeSlash, ArrowLeft } from 'iconsax-react-native';
import { Typography } from '../../components/ui/Typography';
import { Surface } from '../../components/ui/Surface';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function SignUp() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { signUp, isLoading } = useAuth();
    const router = useRouter();

    const handleSignUp = async () => {
        try {
            await signUp(email, password, name);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <View className="flex-1 bg-white">
            <ImageBackground
                source={require('../../assets/images/tailor_auth_bg.png')}
                className="flex-1"
                resizeMode="cover"
            >
                <LinearGradient
                    colors={['rgba(255,255,255,0.85)', 'rgba(255,255,255,0.95)', '#ffffff']}
                    className="flex-1 px-8"
                >
                    <SafeAreaView className="flex-1">
                        <View className="py-4">
                            <IconButton
                                icon={<ArrowLeft size={24} color="black" />}
                                onPress={() => router.back()}
                                className="bg-muted border-0"
                            />
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerClassName="py-10"
                        >
                            <View className="mb-10">
                                <Typography variant="h1" weight="bold" className="mb-2">Create Account</Typography>
                                <Typography color="gray" variant="subtitle">Join the NeedleAfrica community</Typography>
                            </View>

                            <View className="mb-8">
                                <View className="mb-6">
                                    <Typography variant="caption" weight="bold" color="gray" className="ml-1 mb-2 uppercase">Full Name</Typography>
                                    <Surface variant="muted" rounded="2xl" className="flex-row items-center px-4 h-16 border border-gray-100">
                                        <User size={20} color="#6B7280" variant="Bulk" />
                                        <TextInput
                                            className="flex-1 ml-3 h-full font-semibold text-dark"
                                            placeholder="Jane Doe"
                                            placeholderTextColor="#9CA3AF"
                                            value={name}
                                            onChangeText={setName}
                                        />
                                    </Surface>
                                </View>

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
                                    <Typography variant="caption" weight="bold" color="gray" className="ml-1 mb-2 uppercase">Password</Typography>
                                    <Surface variant="muted" rounded="2xl" className="flex-row items-center px-4 h-16 border border-gray-100">
                                        <Lock size={20} color="#6B7280" variant="Bulk" />
                                        <TextInput
                                            className="flex-1 ml-3 h-full font-semibold text-dark"
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
                                isLoading={isLoading}
                                className="h-16 rounded-full bg-dark border-0 shadow-lg mb-4"
                                textClassName="text-white text-lg font-bold"
                            >
                                Get Started
                            </Button>

                            <View className="flex-row items-center mb-4">
                                <View className="flex-1 h-[1px] bg-gray-100" />
                                <Typography variant="small" color="gray" className="mx-4 font-bold uppercase">Or continue with</Typography>
                                <View className="flex-1 h-[1px] bg-gray-100" />
                            </View>

                            <TouchableOpacity
                                onPress={() => {/* Handle Google Sign In */ }}
                                className="h-16 rounded-full bg-white border border-gray-200 flex-row items-center justify-center mb-10 shadow-sm"
                            >
                                <Image
                                    source={require('../../assets/images/google_logo.png')}
                                    className="w-6 h-6 mr-3"
                                    resizeMode="contain"
                                />
                                <Typography weight="bold" className="text-lg">Google Account</Typography>
                            </TouchableOpacity>

                            <View className="flex-row justify-center items-center pb-10">
                                <Typography color="gray">Already have an account? </Typography>
                                <Link href="/(auth)/login" asChild>
                                    <TouchableOpacity>
                                        <Typography weight="bold" color="primary">Sign in</Typography>
                                    </TouchableOpacity>
                                </Link>
                            </View>
                        </ScrollView>
                    </SafeAreaView>
                </LinearGradient>
            </ImageBackground>
        </View>
    );
}
