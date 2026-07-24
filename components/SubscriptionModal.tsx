import React, { useState, useEffect } from 'react';
import {
    View,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Modal,
    ImageBackground,
    Dimensions,
    Linking,
    Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { TickCircle, Crown, Star1, Refresh, ArrowRight, CloseCircle, People, Gallery, Chart2, MessageQuestion } from 'iconsax-react-native';
import { Typography } from './ui/Typography';
import { useRevenueCat } from '../hooks/useRevenueCat';
import { revenueCatService } from '../services/RevenueCatService';
import { PurchasesPackage, PACKAGE_TYPE } from 'react-native-purchases';
import Toast from 'react-native-toast-message';
import Svg, { Path } from 'react-native-svg';

interface SubscriptionModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
    visible,
    onClose,
    onSuccess,
}) => {
    const insets = useSafeAreaInsets();
    const {
        isPro,
        isLoading,
        purchasePackage,
        restorePurchases,
        showManageSubscriptions,
        subscriptionStatus,
    } = useRevenueCat();

    const [packages, setPackages] = useState<PurchasesPackage[]>([]);
    const [selectedPlanType, setSelectedPlanType] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
    const [loadingPackages, setLoadingPackages] = useState(true);

    useEffect(() => {
        if (visible) {
            loadPackages();
        }
    }, [visible]);

    useEffect(() => {
        if (visible && isPro && subscriptionStatus?.planType) {
            const planType = subscriptionStatus.planType.toUpperCase();
            if (planType === 'MONTHLY' || planType === 'YEARLY') {
                setSelectedPlanType(planType as 'MONTHLY' | 'YEARLY');
            }
        }
    }, [visible, isPro, subscriptionStatus]);

    const loadPackages = async () => {
        try {
            setLoadingPackages(true);
            /* const offerings = await revenueCatService.getOfferings();
            console.log("rev cat offerings: ", JSON.stringify(offerings, null, 2))
            if (offerings) {
                const allPackages: PurchasesPackage[] = [];
                Object.values(offerings.all).forEach(offering => {
                    allPackages.push(...offering.availablePackages);
                });

                const uniquePackages = allPackages.filter((pkg, index, self) =>
                    index === self.findIndex((p) => p.identifier === pkg.identifier)
                );

                // Better categorization logic using the SDK enum
                const isYearlyPkg = (pkg: PurchasesPackage) =>
                    pkg.packageType === PACKAGE_TYPE.ANNUAL ||
                    pkg.identifier.toLowerCase().includes('yearly') ||
                    pkg.identifier.toLowerCase().includes('annual');

                const isMonthlyPkg = (pkg: PurchasesPackage) =>
                    pkg.packageType === PACKAGE_TYPE.MONTHLY ||
                    pkg.identifier.toLowerCase().includes('monthly');

                // Filter to show one representative package for each tab
                const displayPackages: PurchasesPackage[] = [];
                const yearly = uniquePackages.find(isYearlyPkg);
                const monthly = uniquePackages.find(isMonthlyPkg);

                if (monthly) displayPackages.push(monthly);
                if (yearly) displayPackages.push(yearly);

                setPackages(displayPackages);

                // Check if yearly is available to set default
                setSelectedPlanType(yearly ? 'YEARLY' : 'MONTHLY');
            } */
            const offerings = await revenueCatService.getOfferings();
            if (offerings?.current) {
                setPackages(offerings?.current?.availablePackages);
                console.log("found offerings: ", JSON.stringify(offerings?.current?.availablePackages, null, 2))
            }
        } catch (error) {
            console.error('Failed to load packages:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to load subscription options',
            });
        } finally {
            setLoadingPackages(false);
        }
    };

    const getActivePackage = () => {
        const isYearlyPkg = (pkg: PurchasesPackage) =>
            pkg.packageType === PACKAGE_TYPE.ANNUAL ||
            pkg.identifier.toLowerCase().includes('yearly') ||
            pkg.identifier.toLowerCase().includes('annual');

        const isMonthlyPkg = (pkg: PurchasesPackage) =>
            pkg.packageType === PACKAGE_TYPE.MONTHLY ||
            pkg.identifier.toLowerCase().includes('monthly');

        if (selectedPlanType === 'YEARLY') {
            return packages.find(isYearlyPkg);
        }
        return packages.find(isMonthlyPkg);
    };

    const activePackage = getActivePackage();

    const handlePurchase = async () => {
        if (isPro) {
            try {
                await showManageSubscriptions();
            } catch (error) {
                console.error('Failed to show manage subscriptions:', error);
                Toast.show({
                    type: 'info',
                    text1: 'Manage Subscription',
                    text2: 'If you subscribed via bank transfer, please contact support to manage your plan.'
                });
            }
            return;
        }

        if (!activePackage) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Please select a plan' });
            return;
        }

        try {
            await purchasePackage(activePackage.identifier);
            Toast.show({ type: 'success', text1: 'Success!', text2: 'You are now a Pro subscriber' });
            onSuccess?.();
            onClose();
        } catch (error) {
            const errorMessage = (error as any)?.message || 'Purchase failed';
            if (errorMessage !== 'Purchase was cancelled') {
                Toast.show({ type: 'error', text1: 'Purchase Failed', text2: errorMessage });
            }
        }
    };

    const handleRestore = async () => {
        try {
            await restorePurchases();
            Toast.show({ type: 'success', text1: 'Success!', text2: 'Your purchases have been restored' });
            onSuccess?.();
            onClose();
        } catch (error) {
            const errorMessage = (error as any)?.message || 'Restore failed';
            Toast.show({ type: 'error', text1: 'Restore Failed', text2: errorMessage });
        }
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={onClose}
        >
            <ScrollView style={{ flex: 1, backgroundColor: '#000' }}>
                <ImageBackground
                    source={require('../assets/images/tailor_auth_bg.png')}
                    style={{ flex: 1 }}
                    resizeMode="cover"
                >
                    <LinearGradient
                        colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.98)', '#000000']}
                        style={{ flex: 1 }}
                    >
                        <SafeAreaView style={{ flex: 1 }} edges={[]}>
                            {/* Header with Safe Area Padding */}
                            <View
                                className="flex-row justify-between items-center px-5"
                                style={{ paddingTop: insets.top + 10 }}
                            >

                                <TouchableOpacity onPress={onClose} className="p-2">
                                    <Svg width="24" height="24" viewBox="0 0 24 24">
                                        <Path
                                            fill="none"
                                            stroke="white"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="1.5"
                                            d="M18 6L6 18m12 0L6 6"
                                        />
                                    </Svg>
                                </TouchableOpacity>

                                <View className="flex-row items-center">
                                    {isPro && (
                                        <View className="bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30 mr-3">
                                            <Typography variant="small" weight="bold" className="text-indigo-400">PRO MEMBER</Typography>
                                        </View>
                                    )}
                                    <TouchableOpacity onPress={handleRestore} className="p-2">
                                        <Typography variant="body" weight="bold" color="white" className="opacity-80">Restore</Typography>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View
                                className="mt-8 px-6"
                            >
                                {/* Branding */}
                                <View className="items-center mb-6">
                                    <View className="flex-row items-center">
                                        <Typography variant="h1" weight="bold" color="white" className="text-3xl">NeedleX</Typography>
                                        <View className="bg-indigo-500 rounded-lg px-2 py-0.5 ml-2 mt-1">
                                            <Typography variant="caption" weight="bold" color="white">PRO</Typography>
                                        </View>
                                    </View>
                                    <Typography variant="subtitle" color="white" className="text-center opacity-90 mt-1">
                                        {isPro ? 'You have full access to all premium features' : 'Unlock the most powerful tailoring assistant'}
                                    </Typography>
                                </View>

                                {/* Benefits List (Scrollable, now above comparison chart) */}
                                <View style={{ height: 130 }} className="mb-5 bg-white/5 rounded-2xl p-3 border border-white/10">
                                    <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={true}>
                                        <View className="flex flex-col gap-3">
                                            {[
                                                { title: "Unlimited Clients & Orders", subtitle: "Grow your database without limits", icon: <People size={20} color="#FF5678" variant="Bulk" /> },
                                                { title: "Online Storefront Website", subtitle: "Collect custom client bookings online", icon: <Gallery size={20} color="#FF5678" variant="Bulk" /> },
                                                { title: "Turnaround Speed & Analytics", subtitle: "Interactive charts of your performance", icon: <Chart2 size={20} color="#FF5678" variant="Bulk" /> },
                                                { title: "AI Labs (Try-on & Sketches)", subtitle: "Create virtual mockups on client photos", icon: <Star1 size={20} color="#FF5678" variant="Bulk" /> },
                                                { title: "Direct WhatsApp VIP Support", subtitle: "Priority support line for setup help", icon: <MessageQuestion size={20} color="#FF5678" variant="Bulk" /> }
                                            ].map((benefit, idx) => (
                                                <View key={idx} className="flex-row items-center mb-1 last:mb-0">
                                                    <View className="w-8 h-8 bg-white/5 rounded-full items-center justify-center mr-3">
                                                        {benefit.icon}
                                                    </View>
                                                    <View className="flex-1">
                                                        <Typography variant="body" weight="semibold" className="text-white text-[13px] leading-4">{benefit.title}</Typography>
                                                        <Typography variant="small" className="text-zinc-400 text-[10px] mt-0.5">{benefit.subtitle}</Typography>
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    </ScrollView>
                                </View>

                                {/* Comparison Table */}
                                <View className="mb-5 bg-white/5 rounded-2xl p-4 border border-white/10">

                                    {/* Table Header */}
                                    <View className="flex-row pb-4 border-b border-white/10 mb-3">
                                        <View className="flex-1">
                                            {/* <Typography variant="small" weight="bold" className="text-zinc-400 text-[11px] uppercase">Feature</Typography> */}
                                        </View>
                                        <View className="w-16 items-center">
                                            <Typography variant="small" weight="bold" className="text-zinc-400 text-[11px] uppercase">Free</Typography>
                                        </View>
                                        <View className="w-16 items-center">
                                            <Typography variant="small" weight="bold" className="text-indigo-400 text-[11px] uppercase">PRO</Typography>
                                        </View>
                                    </View>

                                    {/* Table Rows */}
                                    {[
                                        { name: "Active Clients", free: "10", pro: "Unlimited" },
                                        { name: "Active Orders", free: "10", pro: "Unlimited" },
                                        { name: "Draft Templates", free: "5", pro: "Unlimited" },
                                        { name: "Custom Invoices", free: "10", pro: "Unlimited" },
                                        { name: "AI Labs access", free: "", pro: "Unlimited" },
                                        { name: "Online Storefront", free: "Basic", pro: "Advanced" }
                                    ].map((row, idx) => (
                                        <View key={idx} className="flex-row items-center py-2.5 border-b border-white/5 last:border-b-0">
                                            <View className="flex-1">
                                                <Typography variant="body" weight="medium" color="white" className="text-[13px]">{row.name}</Typography>
                                            </View>
                                            <View className="w-16 items-center">
                                                <Typography variant="body" className="text-zinc-400 text-[13px]">{row.free}</Typography>
                                            </View>
                                            <View className="w-30 items-center">
                                                <Typography variant="body" weight="bold" className="text-indigo-400 text-[13px]">{row.pro}</Typography>
                                            </View>
                                        </View>
                                    ))}
                                </View>

                                {/* Both Packages Selection Cards */}
                                {loadingPackages ? (
                                    <ActivityIndicator size="large" color="#FF5678" className="mt-8" />
                                ) : (
                                    !isPro && packages.length > 0 && (
                                        <View className="flex-row gap-3 mb-5">
                                            {/* Monthly Package Card */}
                                            {(() => {
                                                const monthlyPkg = packages.find(p => p.identifier.toLowerCase().includes('monthly') || p.packageType === PACKAGE_TYPE.MONTHLY);
                                                if (!monthlyPkg) return null;
                                                const isSelected = selectedPlanType === 'MONTHLY';
                                                return (
                                                    <TouchableOpacity
                                                        activeOpacity={0.8}
                                                        onPress={() => setSelectedPlanType('MONTHLY')}
                                                        className={`flex-1 rounded-2xl p-3 border ${isSelected ? 'bg-indigo-500/10 border-indigo-500 shadow-lg shadow-indigo-500/10' : 'bg-white/5 border-white/10'}`}
                                                    >
                                                        <Typography variant="body" weight="bold" color="white" className="text-[13.5px]">
                                                            Monthly
                                                        </Typography>
                                                        <Typography variant="small" color="white" className="opacity-60 text-[10px] mt-0.5">
                                                            Flexibility First
                                                        </Typography>
                                                        
                                                        <View className="flex-row items-baseline mt-3">
                                                            <Typography variant="h2" weight="bold" color="white" className="text-[18px]">
                                                                {monthlyPkg.product.priceString}
                                                            </Typography>
                                                            <Typography variant="small" color="white" className="opacity-60 ml-0.5 text-[10px]">
                                                                /mo
                                                            </Typography>
                                                        </View>
                                                    </TouchableOpacity>
                                                );
                                            })()}

                                            {/* Yearly Package Card */}
                                            {(() => {
                                                const yearlyPkg = packages.find(p => p.identifier.toLowerCase().includes('yearly') || p.packageType === PACKAGE_TYPE.ANNUAL);
                                                if (!yearlyPkg) return null;
                                                const isSelected = selectedPlanType === 'YEARLY';
                                                return (
                                                    <TouchableOpacity
                                                        activeOpacity={0.8}
                                                        onPress={() => setSelectedPlanType('YEARLY')}
                                                        className={`flex-1 rounded-2xl p-3 border ${isSelected ? 'bg-indigo-500/10 border-indigo-500 shadow-lg shadow-indigo-500/10' : 'bg-white/5 border-white/10'}`}
                                                    >
                                                        <View className="items-start">
                                                            <View className="flex-row items-center gap-1">
                                                                <Typography variant="body" weight="bold" color="white" className="text-[13.5px]">
                                                                    Yearly
                                                                </Typography>
                                                                <View className="bg-indigo-500 px-1 py-0.5 rounded">
                                                                    <Typography variant="small" weight="bold" className="text-white text-[7px]">SAVE 17%</Typography>
                                                                </View>
                                                            </View>
                                                            <Typography variant="small" color="white" className="opacity-60 text-[10px] mt-0.5">
                                                                1 Week Free Trial
                                                            </Typography>
                                                        </View>
                                                        
                                                        <View className="flex-row items-baseline mt-3">
                                                            <Typography variant="h2" weight="bold" color="white" className="text-[18px]">
                                                                {yearlyPkg.product.priceString}
                                                            </Typography>
                                                            <Typography variant="small" color="white" className="opacity-60 ml-0.5 text-[10px]">
                                                                /yr
                                                            </Typography>
                                                        </View>
                                                    </TouchableOpacity>
                                                );
                                            })()}
                                        </View>
                                    )
                                )}

                                {/* Current Plan Indicator for Pro Users */}
                                {isPro && (
                                    <View>
                                        {/* <Crown size={24} color="#FF5678" variant="Bold" /> */}
                                        <Typography variant="body" color="white" className="text-center">
                                            You are currently on the <Typography variant="body" weight="bold" color="white">{subscriptionStatus?.planType === 'yearly' ? 'Yearly' : 'Monthly'}</Typography> plan
                                        </Typography>
                                        {subscriptionStatus?.expiryDate && (
                                            <Typography variant="small" color="white" className="opacity-60 text-center">
                                                Renews on {subscriptionStatus.expiryDate.toLocaleDateString()}
                                            </Typography>
                                        )}
                                    </View>
                                )}
                            </View>

                            <View className="px-6 pb-6 mt-2">
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={handlePurchase}
                                    disabled={isLoading || !activePackage}
                                    className={`h-14 rounded-full items-center justify-center shadow-lg shadow-indigo-500/40 bg-indigo-500 ${(!activePackage || isLoading) ? 'opacity-50' : ''}`}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <View className="flex-row items-center">
                                            <Typography variant="subtitle" weight="bold" color="white">
                                                {isPro ? 'Manage Subscription' : 'Try Premium'}
                                            </Typography>
                                        </View>
                                    )}
                                </TouchableOpacity>

                                <Typography variant="small" color="white" className="text-center opacity-40 mt-4 px-4 leading-4">
                                    {selectedPlanType === 'YEARLY'
                                        ? `Your subscription begins after the 7-day trial. Cancel at least 24 hours before the trial ends in your ${Platform.OS === 'android' ? 'Google Play' : 'App Store'} Subscription settings to avoid being charged. Total cost ${activePackage?.product?.priceString} billed annually.`
                                        : 'The subscription will automatically renew unless it is canceled at least 24 hours before the end of the current period.'
                                    }
                                </Typography>

                                <View className="flex-row justify-center items-center gap-4 mt-4 opacity-60">
                                    <TouchableOpacity onPress={() => Linking.openURL('https://needleafrica.com/privacy-policy')}>
                                        <Typography variant="small" color="white" className="underline">Privacy Policy</Typography>
                                    </TouchableOpacity>
                                    <View className="w-1 h-1 rounded-full bg-white/40" />
                                    <TouchableOpacity onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}>
                                        <Typography variant="small" color="white" className="underline">Terms of Use</Typography>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </SafeAreaView>
                    </LinearGradient>
                </ImageBackground>
            </ScrollView>
        </Modal>
    );
};
