import React from 'react';
import { View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MagicStar, ArrowRight, User, Shop, Setting } from 'iconsax-react-native';
import { Typography } from '../components/ui/Typography';
import { Surface } from '../components/ui/Surface';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';

export default function Onboarding() {
    const router = useRouter();
    const { user, completeOnboarding } = useAuth();

    const handleGetStarted = () => {
        completeOnboarding();
        router.replace('/(tabs)');
    };

    return (
        <View className="flex-1 bg-white">
            <ScrollView contentContainerClassName="p-8 pb-20" showsVerticalScrollIndicator={false}>
                {/* Welcome Section */}
                <View className="items-center mb-10 mt-6">
                    <Surface variant="lavender" className="w-20 h-20 items-center justify-center mb-6" rounded="3xl">
                        <MagicStar size={40} color="#6366f1" variant="Bold" />
                    </Surface>
                    <Typography variant="h1" weight="bold" className="text-center mb-3">Welcome to NeedleAfrica</Typography>
                    <Typography color="gray" variant="subtitle" className="text-center px-4">
                        Hi {user?.username || 'there'}! Let's get your workshop set up for success.
                    </Typography>
                </View>

                {/* Steps Section */}
                <View className="mb-10">
                    <Typography variant="caption" color="gray" weight="bold" className="mb-6 uppercase tracking-widest ml-1">Quick Setup</Typography>

                    <OnboardingStep
                        icon={<User size={24} color="#6366f1" variant="Bulk" />}
                        title="Complete Profile"
                        description="Add your workshop address and phone number for clients."
                        onPress={() => router.push('/(tabs)/profile/personal')}
                    />

                    <OnboardingStep
                        icon={<Setting size={24} color="#FDB022" variant="Bulk" />}
                        title="Set Preferences"
                        description="Configure notifications, currency, and measurements."
                        onPress={() => router.push('/(tabs)/profile/preferences')}
                    />

                    <OnboardingStep
                        icon={<Shop size={24} color="#12D39D" variant="Bulk" />}
                        title="Explore Dashboard"
                        description="See your analytics and manage your orders efficiently."
                        onPress={handleGetStarted}
                    />
                </View>

                {/* Main Action */}
                <Button
                    onPress={handleGetStarted}
                    className="h-16 rounded-full bg-dark border-0 shadow-lg"
                    textClassName="text-white text-lg font-bold"
                >
                    Get Started
                </Button>

                <TouchableOpacity
                    className="mt-6 self-center"
                    onPress={handleGetStarted}
                >
                    <Typography color="gray" weight="semibold">Skip for now</Typography>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

function OnboardingStep({ icon, title, description, onPress }: { icon: React.ReactNode, title: string, description: string, onPress: () => void }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            className="flex-row items-center p-5 bg-muted rounded-3xl border border-gray-100 mb-4 active:bg-gray-50"
        >
            <View className="w-14 h-14 bg-white rounded-2xl items-center justify-center mr-4 shadow-sm">
                {icon}
            </View>
            <View className="flex-1">
                <Typography variant="body" weight="bold">{title}</Typography>
                <Typography variant="small" color="gray" className="mt-1">{description}</Typography>
            </View>
            <ArrowRight size={20} color="#9CA3AF" />
        </TouchableOpacity>
    );
}
