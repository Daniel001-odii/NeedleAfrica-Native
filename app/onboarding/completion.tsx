import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { TickCircle, Receipt2, Element3, Star, Crown, ArrowRight2 } from 'iconsax-react-native';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { usePostHog } from 'posthog-react-native';
import Animated, {
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming
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

        await completeOnboarding();
        await resetOnboarding();

        if (target === 'dashboard') {
            router.replace('/(tabs)');
        } else {
            router.replace('/(tabs)/orders');
        }
    };

    // A much more subtle, premium breathing effect for the icon background
    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: withRepeat(withSequence(withTiming(1, { duration: 1500 }), withTiming(1.05, { duration: 1500 })), -1, true) }],
        opacity: withRepeat(withSequence(withTiming(0.5, { duration: 1500 }), withTiming(0.8, { duration: 1500 })), -1, true)
    }));

    return (
        <View className="flex-1 bg-white">
            <ScrollView
                contentContainerClassName="flex-grow p-6 pt-12 pb-8 justify-between"
                showsVerticalScrollIndicator={false}
            >
                <View>
                    {/* Header Section */}
                    <Animated.View entering={FadeInDown.delay(100).duration(600)} className="items-center mb-10 mt-4">
                        <View className="relative items-center justify-center mb-6 w-24 h-24">
                            <Animated.View
                                style={pulseStyle}
                                className="absolute inset-0 bg-blue-50 rounded-full"
                            />
                            <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center z-10 border border-blue-200">
                                <Crown size={32} color="#2563EB" variant="Bulk" />
                            </View>
                            <Animated.View
                                entering={FadeInUp.delay(500).springify()}
                                className="absolute bottom-1 right-1 bg-green-500 p-1 rounded-full border-2 border-white z-20"
                            >
                                <TickCircle size={16} color="white" variant="Bold" />
                            </Animated.View>
                        </View>

                        <Typography variant="h1" weight="bold" className="text-center text-gray-900 mb-2">
                            You're all set, {firstName}!
                        </Typography>
                        <Typography color="gray" className="text-center px-4 leading-6 text-base">
                            {state.businessName} is officially live. Your workspace is ready for you to craft some magic.
                        </Typography>
                    </Animated.View>

                    {/* Milestones List */}
                    <Animated.View
                        entering={FadeInDown.delay(300).duration(600)}
                        className="w-full bg-white border border-gray-100 rounded-[24px] shadow-sm mb-8 overflow-hidden"
                    >
                        <View className="bg-gray-50/50 px-5 py-3 border-b border-gray-100">
                            <Typography weight="bold" color="gray" className="uppercase tracking-wider text-[11px]">
                                Milestones Unlocked
                            </Typography>
                        </View>

                        <View className="px-2">
                            <SummaryCardItem
                                icon={<Element3 size={20} color="#3B82F6" variant="Bulk" />}
                                iconBg="bg-blue-50"
                                title="Workspace Hub"
                                desc="Workspace configured"
                                isLast={false}
                            />
                            <SummaryCardItem
                                icon={<Star size={20} color="#10B981" variant="Bulk" />}
                                iconBg="bg-green-50"
                                title="First Client"
                                desc={state.customer?.name || "Client added"}
                                isLast={false}
                            />
                            <SummaryCardItem
                                icon={<Receipt2 size={20} color="#8B5CF6" variant="Bulk" />}
                                iconBg="bg-purple-50"
                                title="Quick Launch"
                                desc="First order recorded"
                                isLast={true}
                            />
                        </View>
                    </Animated.View>
                </View>

                {/* Call to Actions */}
                <Animated.View entering={FadeInUp.delay(500).duration(600)} className="w-full gap-3 mt-4">
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
                        <View className="flex-row items-center">
                            <Receipt2 size={18} color="#4B5563" variant="Outline" className="mr-2" />
                            <Typography weight="semibold" className="text-gray-700">View First Invoice</Typography>
                        </View>
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

// Inline sleek list item
function SummaryCardItem({
    icon,
    iconBg,
    title,
    desc,
    isLast
}: {
    icon: React.ReactNode;
    iconBg: string;
    title: string;
    desc: string;
    isLast: boolean;
}) {
    return (
        <View className={`flex-row items-center py-3 px-3 ${!isLast ? 'border-b border-gray-50' : ''}`}>
            <View className={`w-10 h-10 ${iconBg} rounded-[14px] items-center justify-center mr-4`}>
                {icon}
            </View>
            <View className="flex-1">
                <Typography weight="bold" className="text-gray-900 text-[15px] mb-0.5">
                    {title}
                </Typography>
                <Typography color="gray" className="text-[13px]">
                    {desc}
                </Typography>
            </View>
            <TickCircle size={22} color="#10B981" variant="Bulk" />
        </View>
    );
}