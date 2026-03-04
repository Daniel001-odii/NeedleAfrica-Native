import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator, ImageBackground, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Crown, Refresh, TickCircle } from 'iconsax-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography } from '../../../components/ui/Typography';
import { Surface } from '../../../components/ui/Surface';
import { IconButton } from '../../../components/ui/IconButton';
import { useRevenueCat } from '../../../hooks/useRevenueCat';
import { SubscriptionPaywall } from '../../../components/SubscriptionPaywall';
import { SubscriptionStatus } from '../../../components/SubscriptionStatus';

export default function Subscription() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const {
        isPro,
        isLoading,
        error,
        refreshCustomerInfo,
        restorePurchases,
        showManageSubscriptions,
    } = useRevenueCat();

    const [showPaywall, setShowPaywall] = useState(false);

    // Handle subscribe button press
    const handleSubscribe = async () => {
        if (isPro) {
            try {
                await showManageSubscriptions();
            } catch (err) {
                console.error('Failed to show manage subscriptions:', err);
            }
        } else {
            setShowPaywall(true);
        }
    };

    // Handle restore purchases
    const handleRestore = async () => {
        try {
            await restorePurchases();
        } catch (error: any) {
            console.error('Restore failed:', error);
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <ImageBackground
                source={require('../../../assets/images/tailor_auth_bg.png')}
                style={{ flex: 1 }}
                resizeMode="cover"
            >
                <LinearGradient
                    colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']}
                    style={{ flex: 1 }}
                >
                    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
                        <ScrollView
                            className="flex-1 px-5"
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
                        >
                            {/* Header */}
                            <View className="flex-row items-center mb-6 pt-4">
                                <IconButton
                                    icon={<ArrowLeft size={20} color="white" />}
                                    onPress={() => router.back()}
                                    variant="ghost"
                                    className="-ml-3"
                                />
                                <Typography variant="h3" weight="bold" color="white" className="ml-2">
                                    Subscription
                                </Typography>
                            </View>

                            {/* Subscription Status */}
                            <SubscriptionStatus
                                className="mb-8"
                                showUpgradeButton={!isPro}
                                onSubscriptionChange={() => {
                                    refreshCustomerInfo();
                                }}
                            />

                            {/* Pro Features */}
                            {isPro && (
                                <View className="mb-8">
                                    <Typography variant="subtitle" weight="bold" color="white" className="mb-4">
                                        Pro Features Active
                                    </Typography>
                                    <Surface variant="white" className="p-5" hasBorder>
                                        {[
                                            'Unlimited customers & orders',
                                            'Advanced measurement templates',
                                            'Custom invoice designs',
                                            'Data export & analytics',
                                            'Priority customer support',
                                            'Team collaboration tools',
                                            'AI-powered features',
                                            'Custom branding options',
                                        ].map((feature, index) => (
                                            <View key={index} className="flex-row items-center mb-3">
                                                <TickCircle size={20} color="#6366f1" variant="Bold" />
                                                <Typography variant="body" color="gray" className="ml-3 flex-1">
                                                    {feature}
                                                </Typography>
                                            </View>
                                        ))}
                                    </Surface>
                                </View>
                            )}

                            {/* Actions */}
                            <View className="mb-8">
                                <Typography variant="subtitle" weight="bold" color="white" className="mb-4">
                                    Manage Subscription
                                </Typography>

                                <TouchableOpacity
                                    activeOpacity={0.9}
                                    onPress={handleSubscribe}
                                    className="mb-4"
                                >
                                    <Surface variant="white" className="p-5 flex-row items-center" hasBorder>
                                        <View className="bg-indigo-50 p-2 rounded-lg">
                                            <Crown size={24} color="#6366f1" />
                                        </View>
                                        <Typography variant="body" weight="bold" className="ml-4 flex-1">
                                            {isPro ? 'Manage Subscription' : 'Upgrade to Pro'}
                                        </Typography>
                                    </Surface>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    activeOpacity={0.9}
                                    onPress={handleRestore}
                                >
                                    <Surface variant="white" className="p-5 flex-row items-center" hasBorder>
                                        <View className="bg-indigo-50 p-2 rounded-lg">
                                            <Refresh size={24} color="#6366f1" />
                                        </View>
                                        <Typography variant="body" weight="bold" className="ml-4 flex-1">
                                            Restore Purchases
                                        </Typography>
                                    </Surface>
                                </TouchableOpacity>
                            </View>

                            {/* Error Display */}
                            {error && (
                                <Surface variant="white" className="p-4 border-red-200 bg-red-50 mb-6" hasBorder>
                                    <Typography variant="body" color="red" className="text-center">
                                        {error}
                                    </Typography>
                                </Surface>
                            )}

                            {/* Loading State */}
                            {isLoading && (
                                <View className="items-center p-10">
                                    <ActivityIndicator size="large" color="#6366f1" />
                                    <Typography variant="body" color="white" className="mt-4 text-center opacity-80">
                                        Updating subscription info...
                                    </Typography>
                                </View>
                            )}
                        </ScrollView>
                    </SafeAreaView>
                </LinearGradient>
            </ImageBackground>

            <SubscriptionPaywall
                visible={showPaywall}
                onClose={() => setShowPaywall(false)}
                onSuccess={() => {
                    setShowPaywall(false);
                    refreshCustomerInfo();
                }}
            />
        </View>
    );
}
