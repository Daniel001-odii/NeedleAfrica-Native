import React, { useState, useMemo, useEffect } from 'react';
import {
    View,
    Modal,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    TouchableWithoutFeedback,
    Keyboard,
    Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Typography } from './ui/Typography';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../lib/axios';
import Toast from 'react-native-toast-message';
import { useFeatureFlag, usePostHog } from 'posthog-react-native';
import Animated, {
    FadeInRight,
    FadeInLeft,
    FadeInDown,
    FadeInUp,
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    withSequence,
    Easing,
} from 'react-native-reanimated';
import {
    Star1,
    ArrowLeft2,
    TickCircle,
    Gift,
    MagicStar,
    Award,
} from 'iconsax-react-native';

export type BusinessTrack = 'CUSTOM_TAILOR' | 'RTW' | 'TEAMS';

interface SurveyModalProps {
    visible: boolean;
    onClose: () => void;
    onCompleted?: () => void;
}

export const detectBusinessTrack = (user: any): { track: BusinessTrack; label: string } => {
    const noOfEmployees = user?.noOfEmployees;
    const businessType = user?.businessType || '';

    if ((noOfEmployees && noOfEmployees !== '1-5') || businessType === 'Fashion House / Studio') {
        return {
            track: 'TEAMS',
            label: 'Growing Businesses & Teams',
        };
    }

    if (businessType === 'Ready-to-Wear Brand') {
        return {
            track: 'RTW',
            label: 'Ready-to-Wear Brands',
        };
    }

    return {
        track: 'CUSTOM_TAILOR',
        label: 'Custom Tailors & Fashion Designers',
    };
};

export const getPricingOptions = (currency?: string, country?: string): string[] => {
    const cur = (currency || '').toUpperCase();
    const ctry = (country || '').toLowerCase();

    if (cur === 'NGN' || ctry.includes('nigeria')) {
        return [
            'Under ₦3,000 / month',
            '₦3,000 – ₦6,999 / month',
            '₦7,000 – ₦14,999 / month',
            '₦15,000 – ₦30,000 / month',
            'Above ₦30,000 / month',
        ];
    }
    if (cur === 'GHS' || ctry.includes('ghana')) {
        return [
            'Under GH₵50 / month',
            'GH₵50 – GH₵100 / month',
            'GH₵101 – GH₵200 / month',
            'GH₵201 – GH₵400 / month',
            'Above GH₵400 / month',
        ];
    }
    if (cur === 'KES' || ctry.includes('kenya')) {
        return [
            'Under KSh 500 / month',
            'KSh 500 – KSh 1,500 / month',
            'KSh 1,501 – KSh 3,000 / month',
            'KSh 3,001 – KSh 6,000 / month',
            'Above KSh 6,000 / month',
        ];
    }
    if (cur === 'GBP' || ctry.includes('united kingdom') || ctry === 'uk') {
        return [
            'Under £5 / month',
            '£5 – £10 / month',
            '£11 – £20 / month',
            '£21 – £40 / month',
            'Above £40 / month',
        ];
    }
    if (cur === 'EUR') {
        return [
            'Under €5 / month',
            '€5 – €12 / month',
            '€13 – €25 / month',
            '€26 – €50 / month',
            'Above €50 / month',
        ];
    }
    if (cur === 'ZAR' || ctry.includes('south africa')) {
        return [
            'Under R100 / month',
            'R100 – R200 / month',
            'R201 – R400 / month',
            'R401 – R800 / month',
            'Above R800 / month',
        ];
    }

    return [
        'Under $5 / month',
        '$5 – $10 / month',
        '$11 – $25 / month',
        '$26 – $50 / month',
        'Above $50 / month',
    ];
};

interface AnimatedStarProps {
    star: number;
    isSelected: boolean;
    onPress: (star: number) => void;
    isDark: boolean;
}

const AnimatedStar: React.FC<AnimatedStarProps> = ({ star, isSelected, onPress, isDark }) => {
    const scale = useSharedValue(1);

    const handlePress = () => {
        scale.value = withSequence(
            withSpring(1.28, { damping: 9, stiffness: 220 }),
            withSpring(1.0, { damping: 14, stiffness: 160 })
        );
        onPress(star);
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <TouchableOpacity onPress={handlePress} activeOpacity={0.8} className="p-1">
            <Animated.View style={animatedStyle}>
                <Star1
                    size={34}
                    color={isSelected ? '#F59E0B' : isDark ? '#4B5563' : '#D1D5DB'}
                    variant={isSelected ? 'Bold' : 'Outline'}
                />
            </Animated.View>
        </TouchableOpacity>
    );
};

export function SurveyModal({ visible, onClose, onCompleted }: SurveyModalProps) {
    const posthog = usePostHog();
    const inAppSurveyFlag = useFeatureFlag('in_app_survey');
    const isSurveyFeatureEnabled = Boolean(inAppSurveyFlag ?? posthog?.isFeatureEnabled('in_app_survey'));

    const { isDark } = useTheme();
    const { user, refreshUser } = useAuth();

    const { track, label: trackLabel } = useMemo(() => detectBusinessTrack(user), [user]);
    const pricingOptions = useMemo(() => getPricingOptions(user?.currency, user?.country), [user?.currency, user?.country]);

    // Current step: 0 = Intro, 1..11 = Questions, 12 = Success
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Answers State
    const [rating, setRating] = useState<number>(0);
    const [ratingComment, setRatingComment] = useState('');
    const [mostUseful, setMostUseful] = useState('');
    const [doBetter, setDoBetter] = useState('');
    const [missMost, setMissMost] = useState('');

    // Track Answers
    const [trackQ1, setTrackQ1] = useState('');
    const [trackQ2, setTrackQ2] = useState('');
    const [trackQ3, setTrackQ3] = useState('');

    // Value & Pricing Answers
    const [valuableFeatures, setValuableFeatures] = useState('');
    const [worthPayingMonthly, setWorthPayingMonthly] = useState('');
    const [selectedPriceRange, setSelectedPriceRange] = useState('');
    const [oneThingToChange, setOneThingToChange] = useState('');

    const totalQuestions = 11;

    // Progress animation
    const progressWidth = useSharedValue(0);

    useEffect(() => {
        if (currentStep >= 1 && currentStep <= totalQuestions) {
            const target = (currentStep / totalQuestions) * 100;
            progressWidth.value = withTiming(target, {
                duration: 260,
                easing: Easing.bezier(0.23, 1, 0.32, 1),
            });
        }
    }, [currentStep]);

    const animatedProgressStyle = useAnimatedStyle(() => ({
        width: `${progressWidth.value}%`,
    }));

    const goToStep = (targetStep: number) => {
        setDirection(targetStep > currentStep ? 'forward' : 'backward');
        setCurrentStep(targetStep);
    };

    // Handle skip / dismiss from intro
    const handleDismiss = async () => {
        try {
            await AsyncStorage.setItem('survey_last_dismissed_at', Date.now().toString());
        } catch (e) {
            console.error('Failed to save survey dismissal time:', e);
        }
        onClose();
    };

    // Submit Survey
    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const answers = {
                core_experience_rating: rating,
                core_experience_comment: ratingComment,
                core_most_useful: mostUseful,
                core_do_better: doBetter,
                core_miss_most: missMost,
                track_business_type: track,
                track_q1_workflow: trackQ1,
                track_q2_hardest_part: trackQ2,
                track_q3_essential_need: trackQ3,
                value_valuable_features: valuableFeatures,
                value_worth_paying_monthly: worthPayingMonthly,
                value_price_range: selectedPriceRange,
                value_one_thing_to_change: oneThingToChange,
            };

            const response = await axiosInstance.post('/survey/submit', {
                businessTrack: track,
                answers,
            });

            if (response.data.status === 'success') {
                await refreshUser();
                goToStep(12); // Go to success slide
                onCompleted?.();
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Submission Issue',
                    text2: response.data.message || 'Please try again',
                });
            }
        } catch (error: any) {
            console.error('Survey submission error:', error);
            Toast.show({
                type: 'error',
                text1: 'Failed to Submit',
                text2: error.response?.data?.error || 'Please check your connection and try again',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!visible || !isSurveyFeatureEnabled) return null;

    // Track Question Definitions
    const getTrackQuestions = () => {
        if (track === 'RTW') {
            return {
                q1Title: 'How do you currently manage your products, sizes, availability, customers and orders?',
                q1Hint: 'Describe your current ready-to-wear workflow...',
                q2Title: 'What is the hardest part of running your RTW business today?',
                q2Hint: 'Inventory, batch production, sizing, demand forecasting...',
                q3Title: "What would you want NeedleX to help you manage that it currently doesn't?",
                q3Hint: 'What features would make running RTW seamless?',
            };
        }
        if (track === 'TEAMS') {
            return {
                q1Title: 'How do you currently divide and manage work between yourself and your team?',
                q1Hint: 'Delegating tasks, tracking status, who handles what...',
                q2Title: 'What becomes difficult when multiple people are handling customers, orders, measurements or other parts of the business?',
                q2Hint: 'Communication gaps, lost info, mistakes, accountability...',
                q3Title: 'If NeedleX allowed you to add team members, assign roles and manage the business together, what would you want it to help you do?',
                q3Hint: 'Tailor assignments, permissions, progress tracking...',
            };
        }
        // CUSTOM_TAILOR (Default)
        return {
            q1Title: 'How do you currently manage a customer from their first request to when you deliver their outfit?',
            q1Hint: 'Walk us through your typical bespoke workflow...',
            q2Title: 'Which part of managing your customers, measurements, orders, pricing or payments is the hardest for you today?',
            q2Hint: 'Where do you experience the most friction or delays?',
            q3Title: 'What would NeedleX need to do better for it to become an essential part of how you run your business?',
            q3Hint: 'What would make NeedleX an everyday essential for your craft?',
        };
    };

    const trackQuestions = getTrackQuestions();
    const starLabels = ['', 'Very Poor 😕', 'Needs Work 😐', 'Good 🙂', 'Great 😊', 'Amazing! 🤩'];

    // Render individual question content
    const renderQuestionContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <View className="py-2">
                        <Typography variant="h3" weight="bold" className="mb-1">
                            How has your experience with NeedleX been so far?
                        </Typography>
                        <Typography variant="caption" color="gray" className="mb-3">
                            Tap a star to rate your overall experience:
                        </Typography>

                        {/* Interactive Animated Stars */}
                        <View className="flex-row items-center justify-center gap-3 py-2 mb-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <AnimatedStar
                                    key={star}
                                    star={star}
                                    isSelected={rating >= star}
                                    onPress={setRating}
                                    isDark={isDark}
                                />
                            ))}
                        </View>

                        {rating > 0 && (
                            <Animated.View entering={FadeInDown.duration(180)}>
                                <Typography
                                    variant="caption"
                                    weight="bold"
                                    className="text-center text-amber-500 mb-3 text-[14px]"
                                >
                                    {starLabels[rating]}
                                </Typography>
                            </Animated.View>
                        )}

                        <Typography variant="small" weight="semibold" color="gray" className="mb-1.5">
                            Tell us a bit more about why (optional):
                        </Typography>
                        <TextInput
                            multiline
                            numberOfLines={3}
                            value={ratingComment}
                            onChangeText={setRatingComment}
                            placeholder="What stood out or what could be better?"
                            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                            className={`p-3.5 rounded-2xl text-[14px] border leading-5 ${isDark
                                    ? 'bg-white/5 border-white/10 text-white'
                                    : 'bg-gray-50 border-gray-200 text-gray-900'
                                }`}
                            style={{ minHeight: 70, textAlignVertical: 'top' }}
                        />
                    </View>
                );

            case 2:
                return (
                    <View className="py-2">
                        <Typography variant="h3" weight="bold" className="mb-1">
                            What do you find most useful about NeedleX?
                        </Typography>
                        <Typography variant="caption" color="gray" className="mb-4">
                            What is the one thing that saves you the most time or stress?
                        </Typography>
                        <TextInput
                            multiline
                            numberOfLines={4}
                            value={mostUseful}
                            onChangeText={setMostUseful}
                            placeholder="e.g., Client measurements, invoices, order tracking, catalog..."
                            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                            className={`p-4 rounded-2xl text-[15px] border leading-5 ${isDark
                                    ? 'bg-white/5 border-white/10 text-white'
                                    : 'bg-gray-50 border-gray-200 text-gray-900'
                                }`}
                            style={{ minHeight: 95, textAlignVertical: 'top' }}
                        />
                    </View>
                );

            case 3:
                return (
                    <View className="py-2">
                        <Typography variant="h3" weight="bold" className="mb-1">
                            What is the biggest thing you think NeedleX could do better?
                        </Typography>
                        <Typography variant="caption" color="gray" className="mb-4">
                            Be as frank as you like — your honest thoughts guide our updates.
                        </Typography>
                        <TextInput
                            multiline
                            numberOfLines={4}
                            value={doBetter}
                            onChangeText={setDoBetter}
                            placeholder="Tell us what slows you down or needs fixing..."
                            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                            className={`p-4 rounded-2xl text-[15px] border leading-5 ${isDark
                                    ? 'bg-white/5 border-white/10 text-white'
                                    : 'bg-gray-50 border-gray-200 text-gray-900'
                                }`}
                            style={{ minHeight: 95, textAlignVertical: 'top' }}
                        />
                    </View>
                );

            case 4:
                return (
                    <View className="py-2">
                        <Typography variant="h3" weight="bold" className="mb-1">
                            If NeedleX disappeared tomorrow, what would you miss most?
                        </Typography>
                        <Typography variant="caption" color="gray" className="mb-4">
                            What would be hardest to replace?
                        </Typography>
                        <TextInput
                            multiline
                            numberOfLines={4}
                            value={missMost}
                            onChangeText={setMissMost}
                            placeholder="The one thing you rely on most..."
                            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                            className={`p-4 rounded-2xl text-[15px] border leading-5 ${isDark
                                    ? 'bg-white/5 border-white/10 text-white'
                                    : 'bg-gray-50 border-gray-200 text-gray-900'
                                }`}
                            style={{ minHeight: 95, textAlignVertical: 'top' }}
                        />
                    </View>
                );

            case 5:
                return (
                    <View className="py-2">
                        <View className="bg-brand-primary/10 px-2.5 py-1 rounded-full self-start mb-2">
                            <Typography variant="small" weight="bold" color="primary">
                                {trackLabel}
                            </Typography>
                        </View>
                        <Typography variant="h3" weight="bold" className="mb-1">
                            {trackQuestions.q1Title}
                        </Typography>
                        <Typography variant="caption" color="gray" className="mb-4">
                            We want to understand your real day-to-day workflow.
                        </Typography>
                        <TextInput
                            multiline
                            numberOfLines={4}
                            value={trackQ1}
                            onChangeText={setTrackQ1}
                            placeholder={trackQuestions.q1Hint}
                            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                            className={`p-4 rounded-2xl text-[15px] border leading-5 ${isDark
                                    ? 'bg-white/5 border-white/10 text-white'
                                    : 'bg-gray-50 border-gray-200 text-gray-900'
                                }`}
                            style={{ minHeight: 95, textAlignVertical: 'top' }}
                        />
                    </View>
                );

            case 6:
                return (
                    <View className="py-2">
                        <View className="bg-brand-primary/10 px-2.5 py-1 rounded-full self-start mb-2">
                            <Typography variant="small" weight="bold" color="primary">
                                {trackLabel}
                            </Typography>
                        </View>
                        <Typography variant="h3" weight="bold" className="mb-1">
                            {trackQuestions.q2Title}
                        </Typography>
                        <Typography variant="caption" color="gray" className="mb-4">
                            Your operational pain points help us prioritize what to automate.
                        </Typography>
                        <TextInput
                            multiline
                            numberOfLines={4}
                            value={trackQ2}
                            onChangeText={setTrackQ2}
                            placeholder={trackQuestions.q2Hint}
                            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                            className={`p-4 rounded-2xl text-[15px] border leading-5 ${isDark
                                    ? 'bg-white/5 border-white/10 text-white'
                                    : 'bg-gray-50 border-gray-200 text-gray-900'
                                }`}
                            style={{ minHeight: 95, textAlignVertical: 'top' }}
                        />
                    </View>
                );

            case 7:
                return (
                    <View className="py-2">
                        <View className="bg-brand-primary/10 px-2.5 py-1 rounded-full self-start mb-2">
                            <Typography variant="small" weight="bold" color="primary">
                                {trackLabel}
                            </Typography>
                        </View>
                        <Typography variant="h3" weight="bold" className="mb-1">
                            {trackQuestions.q3Title}
                        </Typography>
                        <Typography variant="caption" color="gray" className="mb-4">
                            Tell us what would make NeedleX indispensable to your business.
                        </Typography>
                        <TextInput
                            multiline
                            numberOfLines={4}
                            value={trackQ3}
                            onChangeText={setTrackQ3}
                            placeholder={trackQuestions.q3Hint}
                            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                            className={`p-4 rounded-2xl text-[15px] border leading-5 ${isDark
                                    ? 'bg-white/5 border-white/10 text-white'
                                    : 'bg-gray-50 border-gray-200 text-gray-900'
                                }`}
                            style={{ minHeight: 95, textAlignVertical: 'top' }}
                        />
                    </View>
                );

            case 8:
                return (
                    <View className="py-2">
                        <Typography variant="h3" weight="bold" className="mb-1">
                            Which parts of NeedleX would you consider valuable enough to pay for?
                        </Typography>
                        <Typography variant="caption" color="gray" className="mb-4">
                            Features or tools that deliver real value to your craft or team.
                        </Typography>
                        <TextInput
                            multiline
                            numberOfLines={4}
                            value={valuableFeatures}
                            onChangeText={setValuableFeatures}
                            placeholder="e.g., Cloud backup, client portals, virtual try-ons, analytics..."
                            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                            className={`p-4 rounded-2xl text-[15px] border leading-5 ${isDark
                                    ? 'bg-white/5 border-white/10 text-white'
                                    : 'bg-gray-50 border-gray-200 text-gray-900'
                                }`}
                            style={{ minHeight: 95, textAlignVertical: 'top' }}
                        />
                    </View>
                );

            case 9:
                return (
                    <View className="py-2">
                        <Typography variant="h3" weight="bold" className="mb-1">
                            What would make NeedleX worth paying for every month?
                        </Typography>
                        <Typography variant="caption" color="gray" className="mb-4">
                            What outcome or continuous service would justify a monthly plan?
                        </Typography>
                        <TextInput
                            multiline
                            numberOfLines={4}
                            value={worthPayingMonthly}
                            onChangeText={setWorthPayingMonthly}
                            placeholder="What would give you 10x return on your investment?"
                            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                            className={`p-4 rounded-2xl text-[15px] border leading-5 ${isDark
                                    ? 'bg-white/5 border-white/10 text-white'
                                    : 'bg-gray-50 border-gray-200 text-gray-900'
                                }`}
                            style={{ minHeight: 95, textAlignVertical: 'top' }}
                        />
                    </View>
                );

            case 10:
                return (
                    <View className="py-2">
                        <Typography variant="h3" weight="bold" className="mb-1">
                            How much would you realistically be comfortable paying each month?
                        </Typography>
                        <Typography variant="caption" color="gray" className="mb-3">
                            Select the price range that matches your budget:
                        </Typography>

                        <View className="gap-2 mb-1">
                            {pricingOptions.map((range) => {
                                const isSelected = selectedPriceRange === range;
                                return (
                                    <TouchableOpacity
                                        key={range}
                                        onPress={() => setSelectedPriceRange(range)}
                                        activeOpacity={0.8}
                                        className={`flex-row items-center justify-between py-2.5 px-4 rounded-2xl border ${isSelected
                                                ? 'bg-brand-primary/10 border-brand-primary dark:bg-brand-primary/20'
                                                : isDark
                                                    ? 'bg-white/5 border-white/10'
                                                    : 'bg-gray-50 border-gray-200'
                                            }`}
                                    >
                                        <Typography
                                            weight={isSelected ? 'bold' : 'medium'}
                                            className={`text-[14px] ${isSelected ? 'text-brand-primary' : isDark ? 'text-white' : 'text-gray-900'
                                                }`}
                                        >
                                            {range}
                                        </Typography>
                                        {isSelected && (
                                            <Animated.View entering={FadeInRight.duration(160)}>
                                                <TickCircle size={18} color="#2563EB" variant="Bold" />
                                            </Animated.View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                );

            case 11:
                return (
                    <View className="py-2">
                        <Typography variant="h3" weight="bold" className="mb-1">
                            If you could change, remove or add one thing to NeedleX today, what would it be?
                        </Typography>
                        <Typography variant="caption" color="gray" className="mb-4">
                            Final question! After this, your 10 points will be credited immediately.
                        </Typography>
                        <TextInput
                            multiline
                            numberOfLines={4}
                            value={oneThingToChange}
                            onChangeText={setOneThingToChange}
                            placeholder="Your top wish or suggestion for NeedleX..."
                            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                            className={`p-4 rounded-2xl text-[15px] border leading-5 ${isDark
                                    ? 'bg-white/5 border-white/10 text-white'
                                    : 'bg-gray-50 border-gray-200 text-gray-900'
                                }`}
                            style={{ minHeight: 95, textAlignVertical: 'top' }}
                        />
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={currentStep === 0 ? handleDismiss : () => goToStep(Math.max(0, currentStep - 1))}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View className="flex-1 bg-black/60 justify-end">
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    >
                        <Animated.View
                            entering={FadeInUp.duration(280).springify().damping(22)}
                            className={`m-4 mb-8 rounded-[32px] p-6 shadow-2xl border ${isDark ? 'bg-[#1C1C1E] border-white/10' : 'bg-white border-gray-100'
                                }`}
                        >
                            {/* Header Row (Step > 0 & Step < 12) */}
                            {currentStep > 0 && currentStep < 12 && (
                                <View className="mb-4">
                                    <View className="flex-row items-center justify-between mb-2">
                                        <Typography variant="small" weight="bold" color="primary">
                                            QUESTION {currentStep} OF {totalQuestions}
                                        </Typography>
                                    </View>
                                    {/* Liquid Smooth Animated Progress Bar */}
                                    <View
                                        className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-100'
                                            }`}
                                    >
                                        <Animated.View
                                            className="h-full bg-brand-primary rounded-full"
                                            style={animatedProgressStyle}
                                        />
                                    </View>
                                </View>
                            )}

                            {/* Non-scrollable Content Container */}
                            <View className="w-full">
                                {/* ================= SLIDE 0: INTRO ================= */}
                                {currentStep === 0 && (
                                    <Animated.View
                                        key="slide-0"
                                        entering={
                                            direction === 'backward'
                                                ? FadeInLeft.duration(240).springify().damping(20)
                                                : FadeInDown.duration(260).springify().damping(18)
                                        }
                                        className="items-center py-2"
                                    >
                                        <View
                                            className={`w-16 h-16 rounded-2xl items-center justify-center mb-4 ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'
                                                }`}
                                        >
                                            <Gift size={36} color="#2563EB" variant="Bulk" />
                                        </View>

                                        <View className="bg-blue-600/10 border border-blue-500/20 px-3 py-1 rounded-full mb-3 flex-row items-center gap-1.5">
                                            <MagicStar size={14} color="#2563EB" variant="Bold" />
                                            <Typography variant="small" weight="bold" className="text-blue-600 dark:text-blue-400">
                                                EARN +10 FREE POINTS
                                            </Typography>
                                        </View>

                                        <Typography variant="h2" weight="bold" className="text-center mb-2">
                                            Help Us Shape NeedleX
                                        </Typography>

                                        <Typography variant="body" color="gray" className="text-center px-2 mb-4 leading-6 text-[15px]">
                                            Take a few minutes to answer this survey to help us make NeedleX better... and earn free 10 points credited directly to your account!
                                        </Typography>

                                        <TouchableOpacity
                                            onPress={() => goToStep(1)}
                                            activeOpacity={0.85}
                                            className="w-full bg-brand-primary py-4 rounded-full items-center justify-center mb-3"
                                        >
                                            <Typography variant="body" weight="bold" color="white" className="text-[16px]">
                                                Start Survey
                                            </Typography>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={handleDismiss}
                                            activeOpacity={0.7}
                                            className="py-2"
                                        >
                                            <Typography variant="caption" weight="semibold" color="gray">
                                                Maybe later
                                            </Typography>
                                        </TouchableOpacity>
                                    </Animated.View>
                                )}

                                {/* ================= SLIDES 1 to 11: DYNAMIC SLIDING QUESTIONS ================= */}
                                {currentStep >= 1 && currentStep <= 11 && (
                                    <View>
                                        <Animated.View
                                            key={`question-slide-${currentStep}`}
                                            entering={
                                                direction === 'forward'
                                                    ? FadeInRight.duration(240).springify().damping(20)
                                                    : FadeInLeft.duration(240).springify().damping(20)
                                            }
                                            className="w-full"
                                        >
                                            {renderQuestionContent()}
                                        </Animated.View>

                                        {/* Fixed Bottom Action Row: Previous + Next / Submit */}
                                        <View className="flex-row items-center gap-2.5 mt-5">
                                            <TouchableOpacity
                                                onPress={() => goToStep(currentStep - 1)}
                                                activeOpacity={0.85}
                                                className={`w-14 h-14 rounded-full items-center justify-center border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'
                                                    }`}
                                            >
                                                <ArrowLeft2 size={20} color={isDark ? '#FFFFFF' : '#111827'} />
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                onPress={currentStep === 11 ? handleSubmit : () => goToStep(currentStep + 1)}
                                                disabled={isSubmitting}
                                                activeOpacity={0.85}
                                                className="flex-1 bg-brand-primary py-4 rounded-full items-center justify-center flex-row gap-2"
                                            >
                                                {isSubmitting ? (
                                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                                ) : currentStep === 11 ? (
                                                    <Animated.View
                                                        entering={FadeInRight.duration(180)}
                                                        className="flex-row items-center gap-2"
                                                    >
                                                        <Typography variant="body" weight="bold" color="white">
                                                            Submit & Claim 10 Points
                                                        </Typography>
                                                        <MagicStar size={18} color="#FFFFFF" variant="Bold" />
                                                    </Animated.View>
                                                ) : (
                                                    <Typography variant="body" weight="bold" color="white">
                                                        Next Question
                                                    </Typography>
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}

                                {/* ================= SLIDE 12: SUCCESS & REWARD ================= */}
                                {currentStep === 12 && (
                                    <Animated.View
                                        key="slide-12"
                                        entering={FadeInUp.duration(300).springify().damping(16)}
                                        className="items-center py-2"
                                    >
                                        <Animated.View
                                            entering={FadeInDown.delay(100).duration(300).springify().damping(12)}
                                            className="items-center justify-center mb-2"
                                        >
                                            <Image
                                                source={require('../assets/illustrations/completed.png')}
                                                style={{ width: 120, height: 120 }}
                                                resizeMode="contain"
                                            />
                                        </Animated.View>

                                        <Typography variant="h2" weight="bold" className="text-center mb-1.5">
                                            Survey Completed! 🎉
                                        </Typography>

                                        <Typography variant="body" color="gray" className="text-center px-2 mb-4 text-[14px] leading-5">
                                            Thank you for taking the time to share your feedback. Your insights are invaluable in making NeedleX the best tool for fashion creators.
                                        </Typography>

                                        <Animated.View
                                            entering={FadeInUp.delay(180).duration(300).springify().damping(15)}
                                            className={`w-full p-3.5 rounded-2xl mb-5 items-center border ${isDark
                                                    ? 'bg-emerald-500/10 border-emerald-500/20'
                                                    : 'bg-emerald-50 border-emerald-200'
                                                }`}
                                        >
                                            <Typography variant="h3" weight="bold" className="text-emerald-600 dark:text-emerald-400 mb-0.5">
                                                +10 Points Added!
                                            </Typography>
                                            <Typography variant="caption" className="text-emerald-700 dark:text-emerald-300 text-center">
                                                Your points have been credited to your account balance.
                                            </Typography>
                                        </Animated.View>

                                        <TouchableOpacity
                                            onPress={onClose}
                                            activeOpacity={0.85}
                                            className="w-full bg-brand-primary py-4 rounded-full items-center justify-center"
                                        >
                                            <Typography variant="body" weight="bold" color="white">
                                                Done
                                            </Typography>
                                        </TouchableOpacity>
                                    </Animated.View>
                                )}
                            </View>
                        </Animated.View>
                    </KeyboardAvoidingView>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

export default SurveyModal;
