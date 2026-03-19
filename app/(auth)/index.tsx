import React, { useState, useEffect } from 'react';
import { View, Image, Dimensions, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../contexts/AuthContext';
import Animated, {
    useAnimatedStyle,
    withTiming,
    useSharedValue,
    runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
// import { AppleSignInButton } from '../../components/auth/AppleSignInButton';
// import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        image: require('../../assets/images/onboarding_1.png'),
        title: 'Customer Management',
        description: 'Organize customer profiles and precise body measurements in one secure place.'
    },
    {
        id: '2',
        image: require('../../assets/images/onboarding_2.png'),
        title: 'Precision Order Tracking',
        description: 'Monitor every stitch from start to finish. Stay ahead of deadlines and delivery dates.'
    },
    {
        id: '3',
        image: require('../../assets/images/onboarding_3.png'),
        title: 'Seamless Offline Sync',
        description: 'Work anywhere, even without internet. Your data syncs automatically when you\'re back online.'
    }
];

/**
 * Component to render a single background image layer with its own opacity animation.
 * Pre-rendering all slides as absolute layers avoids flickering when swapping sources.
 */
const SlideLayer = React.memo(({ isActive, imageSource }: { isActive: boolean; imageSource: any }) => {
    const opacity = useSharedValue(isActive ? 1 : 0);

    useEffect(() => {
        // Smoothly animate opacity when this layer becomes active or inactive
        opacity.value = withTiming(isActive ? 1 : 0, { duration: 1500 });
    }, [isActive]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Animated.Image
            source={imageSource}
            style={[{ width, height, position: 'absolute' }, animatedStyle]}
            resizeMode="cover"
        />
    );
});

export default function Welcome() {
    const { isDark } = useTheme();
    const [index, setIndex] = useState(0);
    const textOpacity = useSharedValue(1);
    const textTranslateY = useSharedValue(0);

    const router = useRouter();
    const { signInWithGoogle, signInWithApple, isActionLoading, isNewUser } = useAuth();

    // Use a functional state update so we don't need 'index' in the useEffect dependencies
    const updateIndex = () => {
        setIndex((prevIndex) => (prevIndex + 1) % SLIDES.length);
    };

    const handleGoogleSignIn = async () => { /* ... unchanged ... */ };
    const handleAppleSignIn = async () => { /* ... unchanged ... */ };

    // EFFECT 1: Handle the timer and FADE OUT animations
    useEffect(() => {
        const interval = setInterval(() => {
            // Fade out current text
            textOpacity.value = withTiming(0, { duration: 800 }, (finished) => {
                if (finished) {
                    // Trigger state update once the text is faded out
                    // This kicks off the SlideLayer crossfade and text fade in
                    runOnJS(updateIndex)();
                }
            });
            textTranslateY.value = withTiming(10, { duration: 800 });
        }, 5000);

        return () => clearInterval(interval);
    }, []); // Timer only mounts once

    // EFFECT 2: Handle FADE IN animations when the index changes
    useEffect(() => {
        // Fade the text back in
        textOpacity.value = withTiming(1, { duration: 800 });
        textTranslateY.value = withTiming(0, { duration: 800 });
    }, [index]); // Listens for the slide change

    const textAnimatedStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
        transform: [{ translateY: textTranslateY.value }]
    }));

    return (
        <View className="flex-1 bg-black">
            <StatusBar barStyle="light-content" />

            {/* Pre-rendered Background Layers for buttery-smooth crossfade without flickering */}
            {SLIDES.map((slide, i) => (
                <SlideLayer
                    key={slide.id}
                    isActive={index === i}
                    imageSource={slide.image}
                />
            ))}


            {/* Gradient Overlay */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)', 'black']}
                style={{ position: 'absolute', bottom: 0, width, height: height * 0.7 }}
            />

            {/* Content Overlay */}
            <View className="flex-1 justify-end px-10 pb-12">
                <Animated.View style={[textAnimatedStyle, { marginBottom: 40 }]}>
                    <Typography variant="h1" weight="bold" className="text-4xl text-center text-white mb-3">
                        {SLIDES[index].title}
                    </Typography>
                    <Typography variant="body" className="text-gray-300 text-center text-lg">
                        {SLIDES[index].description}
                    </Typography>
                </Animated.View>

                {/* Actions */}
                <View className="gap-3">
                    <Button
                        onPress={() => router.push('/(auth)/login')}
                        className="bg-white h-16 rounded-full border-0"
                        textClassName="text-black text-lg font-bold"
                    >
                        Sign In
                    </Button>

                    <Button
                        onPress={() => router.push('/(auth)/sign-up')}
                        className="bg-zinc-800/80 h-16 rounded-full border border-zinc-700"
                        textClassName="text-white text-lg font-bold"
                    >
                        Create Account
                    </Button>
                </View>

                {/* Footer Links */}
                <View className="mt-8 items-center">
                    <Typography color="gray" variant="small" className="opacity-60 text-center text-zinc-500">
                        By proceeding, you agree to our {'\n'}
                        <Typography variant="small" weight="bold" className="underline text-white">Terms of use</Typography> and acknowledge <Typography className="underline text-white" variant="small" weight="bold">Privacy policy</Typography>
                    </Typography>
                </View>
            </View>
        </View >
    );
}