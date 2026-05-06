import React from 'react';
import { View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { ArrowRight2 } from 'iconsax-react-native';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { usePostHog } from 'posthog-react-native';
import { StoreReviewService } from '../../services/StoreReviewService';
import Animated, {
    FadeInDown,
    FadeInUp,
} from 'react-native-reanimated';

export default function OnboardingCompletion() {
    const { state, resetOnboarding } = useOnboarding();
    const { completeOnboarding, user } = useAuth();
    const router = useRouter();
    const posthog = usePostHog();

    const firstName = user?.username?.split(' ')[0] || 'there';

    const handleFinish = async (target: 'dashboard' | 'invoice') => {
        posthog.capture('onboarding_completed', {
            business_name: state.businessName || 'Unknown',
            customer_name: state.customer?.name || 'Unknown',
            template_name: state.template?.name || 'Unknown',
            order_style: state.order?.styleName || 'Unknown'
        });

        // Request app review after onboarding
        setTimeout(() => {
            StoreReviewService.requestReview().catch(console.error);
        }, 1500);

        await completeOnboarding();
        await resetOnboarding();

        if (target === 'dashboard') {
            router.replace('/(tabs)');
        } else {
            router.replace('/(tabs)/orders');
        }
    };

    return (
        <View className="flex-1 bg-white">
            <ScrollView
                contentContainerClassName="flex-grow px-6 pb-8 justify-center"
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Section — vertically centered */}
                <Animated.View entering={FadeInDown.delay(100).duration(600)} className="items-center mt-auto mb-6">
                    <Animated.View entering={FadeInDown.delay(300).springify().damping(12)} className="items-center justify-center mb-6">
                        <Image
                            source={require('../../assets/images/green-check-mark.png')}
                            style={{ width: 200, height: 200 }}
                            resizeMode="contain"
                        />
                    </Animated.View>

                    <Typography variant="h1" weight="bold" className="text-center text-gray-900 mb-3">
                        You're all set, {firstName}!
                    </Typography>
                    <Typography color="gray" className="text-center px-6 leading-6 text-base">
                        {state.businessName || 'Your workspace'} is officially live.{'\n'}Time to craft some magic. ✨
                    </Typography>
                </Animated.View>

                {/* Call to Actions — pushed toward bottom */}
                <Animated.View entering={FadeInUp.delay(500).duration(600)} className="w-full gap-3 mt-auto pt-8">
                    <Button
                        onPress={() => handleFinish('dashboard')}
                        className="h-14 rounded-full bg-blue-600 border-0"
                    >
                        <View className="flex-row items-center justify-center w-full">
                            <Typography weight="bold" color="white" className="text-lg">Go to Dashboard</Typography>
                            <ArrowRight2 size={18} color="white" className="ml-2 mt-0.5" />
                        </View>
                    </Button>

                    <TouchableOpacity
                        onPress={() => handleFinish('invoice')}
                        className="h-14 items-center justify-center rounded-full bg-gray-50 border border-gray-100 mt-1"
                    >
                        <Typography weight="semibold" className="text-gray-700">View First Order</Typography>
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>
        </View>
    );
}