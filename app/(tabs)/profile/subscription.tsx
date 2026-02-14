import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, Linking, Modal, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, TickCircle, Crown, Star1, Flash, CloseCircle, Check, Warning2 } from 'iconsax-react-native';
import { Typography } from '../../../components/ui/Typography';
import { Surface } from '../../../components/ui/Surface';
import { IconButton } from '../../../components/ui/IconButton';
import { Button } from '../../../components/ui/Button';
import { useSubscription } from '../../../hooks/useSubscription';
import { useAuth } from '../../../contexts/AuthContext';
import { subscriptionService, Plan } from '../../../services/subscriptionService';

// Static free plan since it's not in the database
const freePlan = {
    id: 'free',
    name: 'Free',
    description: 'Get started and manage a few orders at no cost',
    price: { monthly: 0, yearly: 0, currency: 'NGN' },
    features: [
        'Up to 5 active orders',
        '3 basic measurement templates',
        'Up to 5 customer profiles',
        'Up to 5 invoices',
    ],
    isPopular: false,
};

// Transform API plans into UI format
function transformPlans(plans: Plan[]) {
    const grouped = plans.reduce((acc, plan) => {
        if (!acc[plan.planId]) {
            acc[plan.planId] = {
                id: plan.planId,
                name: plan.name,
                description: plan.description,
                price: { monthly: 0, yearly: 0, currency: plan.currency },
                features: plan.features,
                isPopular: plan.isPopular,
            };
        }
        acc[plan.planId].price[plan.billingCycle] = plan.price;
        return acc;
    }, {} as Record<string, any>);

    return [freePlan, ...Object.values(grouped)];
}

function formatPrice(price: number, currency: string) {
    if (price === 0) return 'Free';
    return `₦${price.toLocaleString()}`;
}

export default function Subscription() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { user } = useAuth();
    const {
        status,
        isLoading: subscriptionLoading,
        initiateSubscription,
        verifySubscription,
        cancelSubscription,
        refreshStatus,
        currentPlan,
        isPro,
        isStudioAI,
        isFree
    } = useSubscription();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [processingPlan, setProcessingPlan] = useState<string | null>(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [pricingPlans, setPricingPlans] = useState([freePlan]);
    const [plansLoading, setPlansLoading] = useState(true);
    const [plansError, setPlansError] = useState<string | null>(null);

    // Fetch plans from API
    useEffect(() => {
        const loadPlans = async () => {
            try {
                setPlansLoading(true);
                setPlansError(null);
                const plans = await subscriptionService.getPlans();
                const transformed = transformPlans(plans);
                setPricingPlans(transformed);
            } catch (error: any) {
                console.error('Failed to load plans:', error);
                setPlansError('Failed to load subscription plans');
            } finally {
                setPlansLoading(false);
            }
        };
        loadPlans();
    }, []);

    // Handle payment verification from deep link
    React.useEffect(() => {
        const verifyPayment = async () => {
            const reference = params.reference as string;
            if (reference) {
                try {
                    await verifySubscription(reference);
                    Alert.alert(
                        'Success',
                        'Your subscription has been activated successfully!',
                        [{ text: 'OK', onPress: () => refreshStatus() }]
                    );
                } catch (error: any) {
                    Alert.alert(
                        'Payment Failed',
                        error.message || 'Failed to verify payment. Please try again.'
                    );
                }
            }
        };
        verifyPayment();
    }, [params.reference]);

    // Handle subscribe button press
    const handleSubscribe = async (planId: 'pro' | 'studio_ai') => {
        if (planId === 'studio_ai') {
            Alert.alert('Coming Soon', 'Studio AI plan will be available soon!');
            return;
        }

        try {
            setProcessingPlan(planId);
            const result = await initiateSubscription(planId, billingCycle);

            // Open Paystack payment page
            const supported = await Linking.canOpenURL(result.authorizationUrl);
            if (supported) {
                await Linking.openURL(result.authorizationUrl);
            } else {
                Alert.alert('Error', 'Cannot open payment URL');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to initiate subscription');
        } finally {
            setProcessingPlan(null);
        }
    };

    // Handle cancel subscription
    const handleCancelSubscription = async () => {
        try {
            await cancelSubscription();
            setShowCancelModal(false);
            Alert.alert('Success', 'Your subscription has been cancelled.');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to cancel subscription');
        }
    };

    // Get dynamic button text based on current plan
    const getDynamicButtonText = (planId: string) => {
        if (planId === 'free') {
            return isFree ? 'Current Plan' : 'Downgrade to Free';
        }
        if (planId === 'pro') {
            if (isPro) return 'Current Plan';
            if (isStudioAI) return 'Downgrade Not Available';
            return 'Upgrade to Pro';
        }
        if (planId === 'studio_ai') {
            if (isStudioAI) return 'Current Plan';
            return 'Coming Soon';
        }
        return 'Select Plan';
    };

    // Check if plan button should be disabled
    const isPlanDisabled = (planId: string) => {
        if (planId === 'studio_ai') return true;
        if (planId === 'free') return isFree;
        if (planId === 'pro') return isPro || isStudioAI;
        return false;
    };

    return (
        <View className="flex-1 bg-white">
            <View className="px-6 py-4 flex-row items-center border-b border-gray-50">
                <IconButton
                    icon={<ArrowLeft size={20} color="black" />}
                    onPress={() => router.back()}
                    variant="ghost"
                    className="-ml-2"
                />
                <Typography variant="h3" weight="bold" className="ml-2">Subscription</Typography>
            </View>

            <ScrollView contentContainerClassName="p-6 pb-20" showsVerticalScrollIndicator={false}>

                {/* Header */}
                <View className="items-center mb-8">
                    <Typography variant="h1" weight="bold" className="text-center mb-2">Upgrade your Workshop</Typography>
                    <Typography variant="body" color="gray" className="text-center px-4">
                        Unlock powerful tools to manage orders, customers, and grow your fashion business.
                    </Typography>
                </View>

                {/* Billing Toggle */}
                {/* Billing Toggle */}
                <View className="flex-row justify-center gap-3 mb-8">
                    <Button
                        onPress={() => setBillingCycle('monthly')}
                        variant={billingCycle === 'monthly' ? 'primary' : 'outline'}
                        className="rounded-full px-6 border-0"
                        size="sm"
                    >
                        Monthly
                    </Button>
                    <Button
                        onPress={() => setBillingCycle('yearly')}
                        variant={billingCycle === 'yearly' ? 'primary' : 'outline'}
                        className="rounded-full px-6 border-0"
                        size="sm"
                    >
                        Yearly (-20%)
                    </Button>
                </View>

                {/* Current Plan Banner */}
                {status && currentPlan !== 'FREE' && (
                    <Surface variant="white" className="p-4 mb-6 border border-yellow-200 bg-yellow-50" rounded="2xl">
                        <View className="flex-row items-center justify-between">
                            <View>
                                <Typography variant="caption" color="gray" weight="bold" className="mb-1">CURRENT PLAN</Typography>
                                <Typography variant="h3" weight="bold">{isPro ? 'Professional' : 'Studio AI'}</Typography>
                                <Typography variant="small" color="gray">
                                    {status.isExpired ? 'Expired' : `Expires: ${new Date(status.expiry!).toLocaleDateString()}`}
                                </Typography>
                            </View>
                            {status.status === 'ACTIVE' && !status.isExpired && (
                                <View className="bg-green-500 px-3 py-1 rounded-full">
                                    <Typography variant="small" color="white" weight="bold">Active</Typography>
                                </View>
                            )}
                        </View>
                        <Button
                            onPress={() => setShowCancelModal(true)}
                            variant="outline"
                            className="mt-3 rounded-full"
                            size="sm"
                        >
                            Cancel Subscription
                        </Button>
                    </Surface>
                )}
                <View className="gap-6">
                    {pricingPlans.map((plan) => (
                        <PricingCard
                            key={plan.id}
                            title={plan.name}
                            price={billingCycle === 'monthly'
                                ? (plan.price.monthly === 0 ? 'Free' : `₦${plan.price.monthly.toLocaleString()}/mo`)
                                : (plan.price.yearly === 0 ? 'Free' : `₦${plan.price.yearly.toLocaleString()}/yr`)
                            }
                            description={plan.description}
                            icon={getPlanIcon(plan.id)}
                            bgColor={getPlanBgColor(plan.id)}
                            isPopular={plan.isPopular}
                            features={plan.features}
                            buttonText={getDynamicButtonText(plan.id)}
                            buttonVariant={getButtonVariant(plan.id)}
                            buttonClassName={getButtonClassName(plan.id)}
                            disabled={isPlanDisabled(plan.id) || processingPlan === plan.id}
                            isLoading={processingPlan === plan.id}
                            onPress={() => plan.id !== 'free' && handleSubscribe(plan.id as 'pro' | 'studio_ai')}
                        />
                    ))}
                </View>

                {/* Secure Badge */}
                <View className="mt-10 mb-6 flex-row justify-center items-center">
                    <Typography variant="small" color="gray" className="text-center">
                        <TickCircle size={14} color="gray" variant="Bold" /> Secure payments via Paystack. Cancel anytime.
                    </Typography>
                </View>

            </ScrollView>

            {/* Cancel Subscription Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showCancelModal}
                onRequestClose={() => setShowCancelModal(false)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl p-6 pb-10">
                        <View className="flex-row justify-between items-center mb-6">
                            <View className="flex-row items-center">
                                <Warning2 size={28} color="#EF4444" variant="Bulk" />
                                <Typography variant="h3" weight="bold" color="red" className="ml-2">Cancel Subscription</Typography>
                            </View>
                            <TouchableOpacity onPress={() => setShowCancelModal(false)}>
                                <CloseCircle size={28} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <View className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
                            <Typography variant="body" weight="bold" color="red" className="mb-2">Warning</Typography>
                            <Typography variant="small" color="gray" className="leading-5">
                                Cancelling your subscription means you'll lose access to Pro features at the end of your billing period. You'll be downgraded to the Free plan with limited features.
                            </Typography>
                        </View>

                        <Typography variant="body" className="mb-6">
                            Are you sure you want to cancel your subscription?
                        </Typography>

                        <Button
                            onPress={handleCancelSubscription}
                            isLoading={subscriptionLoading}
                            className="h-16 rounded-full bg-red-600"
                            textClassName="text-white"
                        >
                            Yes, Cancel My Subscription
                        </Button>

                        <Button
                            onPress={() => setShowCancelModal(false)}
                            variant="outline"
                            className="h-16 rounded-full mt-3"
                        >
                            Keep My Subscription
                        </Button>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

function getPlanIcon(planId: string) {
    switch (planId) {
        case 'free':
            return <Star1 size={24} color="#6B7280" variant="Bulk" />;
        case 'pro':
            return <Crown size={24} color="#Eab308" variant="Bulk" />;
        case 'studio_ai':
            return <Flash size={24} color="#8b5cf6" variant="Bulk" />;
        default:
            return <Star1 size={24} color="#6B7280" variant="Bulk" />;
    }
}

function getPlanBgColor(planId: string) {
    switch (planId) {
        case 'free':
            return 'bg-gray-50 bg-opacity-50';
        case 'pro':
            return 'bg-yellow-50 bg-opacity-60 border-yellow-200';
        case 'studio_ai':
            return 'bg-purple-50 bg-opacity-60 border-purple-200';
        default:
            return 'bg-white';
    }
}

function getButtonText(planId: string) {
    switch (planId) {
        case 'free':
            return 'Current Plan';
        case 'pro':
            return 'Upgrade to Pro';
        case 'studio_ai':
            return 'Coming Soon';
        default:
            return 'Select Plan';
    }
}

function getButtonVariant(planId: string): 'primary' | 'secondary' | 'outline' | 'ghost' {
    switch (planId) {
        case 'free':
            return 'outline';
        case 'pro':
            return 'primary';
        case 'studio_ai':
            return 'secondary';
        default:
            return 'primary';
    }
}

function getButtonClassName(planId: string) {
    switch (planId) {
        case 'free':
            return '';
        case 'pro':
            return 'bg-yellow-400 border-yellow-500';
        case 'studio_ai':
            return 'bg-purple-500 border-purple-600';
        default:
            return '';
    }
}

interface PricingCardProps {
    title: string;
    price: string;
    description: string;
    features: string[];
    buttonText: string;
    buttonVariant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    isPopular?: boolean;
    icon?: React.ReactNode;
    bgColor?: string;
    disabled?: boolean;
    buttonClassName?: string;
    isLoading?: boolean;
    onPress?: () => void;
}

function PricingCard({
    title,
    price,
    description,
    features,
    buttonText,
    buttonVariant = 'primary',
    isPopular,
    icon,
    bgColor = "bg-white",
    disabled,
    buttonClassName,
    isLoading,
    onPress
}: PricingCardProps) {
    return (
        <Surface variant="white" className={`p-6 border ${isPopular ? 'border-yellow-400 border-2' : 'border-gray-100'} ${bgColor}`} rounded="3xl">
            {isPopular && (
                <View className="absolute -top-3 right-6 bg-yellow-400 px-3 py-1 rounded-full">
                    <Typography variant="small" weight="bold" color="black" className="text-[10px] uppercase">Most Popular</Typography>
                </View>
            )}

            <View className="flex-row justify-between items-start mb-4">
                <View>
                    <View className="flex-row items-center mb-2">
                        {icon && <View className="mr-2">{icon}</View>}
                        <Typography variant="h3" weight="bold">{title}</Typography>
                    </View>
                    <Typography variant="body" color="gray" className="pr-4">{description}</Typography>
                </View>
            </View>

            <View className="mb-6">
                <Typography variant="h1" weight="bold">{price}</Typography>
            </View>

            <View className="gap-3 mb-6">
                {features.map((feature, index) => (
                    <View key={index} className="flex-row items-center">
                        <TickCircle size={18} color={isPopular ? "#Eab308" : "#10b981"} variant="Bold" />
                        <Typography variant="body" className="ml-2 text-dark">{feature}</Typography>
                    </View>
                ))}
            </View>

            <Button
                variant={buttonVariant}
                className={`w-full rounded-full ${disabled ? 'opacity-50' : ''} ${buttonClassName}`}
                textClassName={buttonVariant === 'outline' ? 'text-dark' : 'text-white'}
                disabled={disabled}
                isLoading={isLoading}
                onPress={onPress}
            >
                {buttonText}
            </Button>
        </Surface>
    );
}
