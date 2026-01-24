import React from 'react';
import { View, ImageBackground, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function Welcome() {
    const router = useRouter();

    return (
        <View className="flex-1">
            <ImageBackground
                source={require('../../assets/images/tailor_auth_bg.png')}
                className="flex-1"
                resizeMode="cover"
            >
                <LinearGradient
                    colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.8)']}
                    className="flex-1 px-8 pb-12 justify-end"
                >
                    {/* Logo/Brand at Top */}
                    <SafeAreaView edges={['top']} className="absolute top-12 self-center">
                        {/* <Typography variant="h2" weight="bold" color="white" className="tracking-widest">
                            NEEDLE AFRICA
                        </Typography> */}
                    </SafeAreaView>

                    {/* Content */}
                    <View className="mb-10">
                        <Typography variant="h1" weight="bold" color="white" className="text-5xl leading-[60px]">
                            Your Journey to Perfect Fit
                        </Typography>
                        {/* <Typography color="white" className="text-lg opacity-80 leading-7">
                            The professional workshop management tool for modern tailors and fashion designers.
                        </Typography> */}
                    </View>

                    {/* Actions */}
                    <View className="gap-4">
                        <Button
                            onPress={() => router.push('/(auth)/sign-up')}
                            className="bg-white h-16 rounded-full border-0 active:bg-gray-100"
                            textClassName="text-dark text-lg font-bold"
                        >
                            Get started
                        </Button>

                        <TouchableOpacity
                            onPress={() => router.push('/(auth)/login')}
                            className="h-16 rounded-full items-center justify-center bg-white/20 border border-white/30 backdrop-blur-md"
                        >
                            <Typography weight="bold" color="white" variant="subtitle">
                                I already have an account
                            </Typography>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {/* Handle Google Sign In */ }}
                            className="h-14 rounded-full bg-white/10 border border-white/20 flex-row items-center justify-center"
                        >
                            <Image
                                source={require('../../assets/images/google_logo.png')}
                                className="w-5 h-5 mr-3"
                                resizeMode="contain"
                            />
                            <Typography color="white" weight="semibold">Continue with Google</Typography>
                        </TouchableOpacity>
                    </View>

                    {/* Footer Links */}
                    <View className="mt-8 items-center">
                        <Typography color="white" variant="small" className="opacity-60 text-center">
                            By proceeding to use NeedleAfrica, you agree to our {'\n'}
                            <Typography variant="small" weight="bold" color="white" className="underline">Terms of use</Typography> and acknowledge <Typography color="white" variant="small" weight="bold" className="underline">Privacy policy</Typography>
                        </Typography>
                    </View>
                </LinearGradient>
            </ImageBackground>
        </View>
    );
}
