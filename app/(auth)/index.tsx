import React from 'react';
import { View, ImageBackground, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../contexts/AuthContext';

export default function Welcome() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { signInWithGoogle, isLoading } = useAuth();

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

    return (
        <View style={{ flex: 1 }}>
            <ImageBackground
                source={require('../../assets/images/tailor_auth_bg.png')}
                style={{ flex: 1 }}
                resizeMode="cover"
            >
                <LinearGradient
                    colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.8)']}
                    style={{
                        flex: 1,
                        paddingHorizontal: 32,
                        paddingTop: insets.top,
                        paddingBottom: insets.bottom + 24,
                        justifyContent: 'flex-end'
                    }}
                >
                    {/* Content */}
                    <View style={{ marginBottom: 40 }}>
                        <Typography variant="h1" weight="bold" color="white" className="text-5xl leading-[60px]">
                            Your Journey to Perfect Fit
                        </Typography>
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
                            onPress={handleGoogleSignIn}
                            disabled={isLoading}
                            className="h-14 rounded-full bg-white/10 border border-white/20 flex-row items-center justify-center opacity-90 active:bg-white/20"
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
