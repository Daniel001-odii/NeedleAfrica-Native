import React, { useEffect, useState, useCallback } from 'react';
import Svg, { Path, G } from 'react-native-svg';
import {
    View,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Share,
    RefreshControl,
    Dimensions,
    Image,
    Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ArrowLeft,
    Copy,
    ExportCurve,
    People,
    Gift,
    InfoCircle,
    TickCircle,
    Clock,
    Award,
    Lock
} from 'iconsax-react-native';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import axiosInstance from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Typography } from './ui/Typography';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

interface ReferralModalProps {
    visible: boolean;
    onClose: () => void;
}

interface ReferredUser {
    name: string;
    registeredAt: string;
}

interface Referral {
    id: string;
    status: 'PENDING' | 'ACTIVATED';
    createdAt: string;
    referredUser: ReferredUser;
}

interface ReferralDetailsResponse {
    referralCode: string;
    referralPoints: number;
    referrals: Referral[];
}

export const ReferralModal: React.FC<ReferralModalProps> = ({ visible, onClose }) => {
    const { isDark } = useTheme();
    const { refreshUser } = useAuth();
    const insets = useSafeAreaInsets();

    const [activeTab, setActiveTab] = useState<'referrals' | 'rewards'>('rewards');
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const triggerToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage(null);
        }, 2000);
    };
    const [data, setData] = useState<ReferralDetailsResponse | null>(null);

    const fetchReferralDetails = useCallback(async (isSilent = false) => {
        if (!isSilent) setIsLoading(true);
        try {
            const response = await axiosInstance.get('/referrals');
            if (response.data.status === 'success') {
                setData(response.data);
            }
        } catch (error) {
            console.error('Fetch referrals details error:', error);
            Toast.show({
                type: 'error',
                text1: 'Failed to load details',
                text2: 'Please try again later'
            });
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([fetchReferralDetails(true), refreshUser()]);
    }, [fetchReferralDetails, refreshUser]);

    useEffect(() => {
        if (visible) {
            fetchReferralDetails();
        }
    }, [visible, fetchReferralDetails]);

    const handleCopyCode = async () => {
        if (!data?.referralCode) return;
        await Clipboard.setStringAsync(data.referralCode);
        triggerToast('Referral code copied to clipboard!');
    };

    const handleShareInvite = async () => {
        if (!data?.referralCode) return;
        try {
            const shareMessage = `Join me on NeedleX to manage clients, measurements, orders, and invoices easily! Use my referral code: ${data.referralCode} when signing up. Download here: https://needleafrica.com`;
            await Share.share({
                message: shareMessage,
            });
        } catch (error) {
            console.error('Error sharing code:', error);
        }
    };

    const containerBg = isDark ? 'bg-black' : 'bg-white';
    const cardBg = isDark ? 'bg-[#1C1C1E] border border-white/5' : 'bg-white border border-gray-100 shadow-sm';
    const tabInactiveText = isDark ? 'text-gray-400' : 'text-gray-500';

    if (!visible) return null;

    // Dynamic calculations for dynamic limit overview in Rewards tab
    const activatedCount = data?.referrals.filter(r => r.status === 'ACTIVATED').length || 0;
    const dynamicLimits = {
        orders: 5 + activatedCount * 5,
        customers: 5 + activatedCount * 5,
        templates: 3 + activatedCount * 3,
        invoices: 5 + activatedCount * 5,
        catalogItems: 3 + activatedCount * 5,
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            presentationStyle="fullScreen"
            onRequestClose={onClose}
        >
            <View className={`flex-1 ${containerBg}`}>
                <ScrollView
                    contentContainerClassName="pb-12"
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
                    }
                >
                    {/* Header Section with Image and Overlay */}
                    <View style={{ height: 360 }} className="w-full relative">
                        <Image
                            source={require('../assets/images/referral_bg.png')}
                            className="w-full h-full absolute top-0 left-0"
                            resizeMode="cover"
                        />
                        <View className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }} />

                        <LinearGradient
                            colors={['transparent', isDark ? 'black' : 'white']}
                            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 110 }}
                        />

                        {/* Back Arrow directly on top of the image (utilizing safe insets) */}
                        <TouchableOpacity
                            onPress={onClose}
                            style={{ position: 'absolute', top: insets.top || 52, left: 20, zIndex: 10 }}
                            activeOpacity={0.8}
                        >
                            <ArrowLeft size={24} color="white" />
                        </TouchableOpacity>

                        {/* Content on top of image */}
                        <View className="flex-1 items-center justify-center pt-16 px-6">
                            {/* <View className="mb-4 bg-white/10 p-4 rounded-full">
                                <Gift size={44} color="white" variant="Bulk" />
                            </View> */}
                            <Typography variant="h1" color="white" weight="bold" className="text-center text-3xl font-bold leading-7 px-4">
                                Invite friends,

                            </Typography>
                            <Typography color="white" weight="bold" className="text-center text-3xl font-bold leading-7 px-4">
                                earn points for free!
                            </Typography>
                        </View>
                    </View>

                    {/* Loading State or Content */}
                    {isLoading ? (
                        <View className="py-20 items-center justify-center">
                            <ActivityIndicator size="large" color="#3b82f6" />
                        </View>
                    ) : (
                        <>
                            {/* Referral Code Box overlapping the bottom of the image */}
                            <View style={{ marginTop: -36 }} className="mb-6 z-10">
                                <View className={`flex-row items-center p-3 rounded-[10px] mx-4 ${isDark ? 'bg-[#2C2C2E] border border-white/5 shadow-black/45' : 'bg-white shadow-gray-200/40'
                                    }`}>
                                    <View className="flex-1 p-3">
                                        <Typography variant="caption" color="gray" className="text-[10px] uppercase font-bold tracking-wider mb-0.5">
                                            Referral code
                                        </Typography>
                                        <Typography variant="h2" weight="bold" className="text-xl text-gray-900 dark:text-white">
                                            {data?.referralCode || 'NXCODE'}
                                        </Typography>
                                    </View>
                                    <TouchableOpacity
                                        onPress={handleCopyCode}
                                        className={`px-4 py-2.5 rounded-xl mr-2 ${isDark ? 'bg-white/10 active:bg-white/20' : 'bg-gray-100 active:bg-gray-205'}`}
                                        activeOpacity={0.8}
                                        style={!isDark ? { backgroundColor: '#F3F4F6' } : {}}
                                    >
                                        <Typography weight="bold" className={isDark ? 'text-white' : 'text-gray-700'} style={{ fontSize: 13 }}>
                                            Copy
                                        </Typography>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={handleShareInvite}
                                        className="px-4 py-2.5 rounded-xl"
                                        style={{ backgroundColor: '#ff5678' }}
                                    >
                                        <Typography weight="bold" color="white" style={{ fontSize: 13 }}>
                                            Share
                                        </Typography>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Footnote under the code box */}
                            <View className="flex-row items-center justify-center opacity-70 px-6 mb-8">
                                {/* <InfoCircle size={14} color={isDark ? '#9CA3AF' : '#6B7280'} className="mr-1.5" /> */}
                                <Typography variant="caption" color="gray" className="text-[11px] text-center leading-4">
                                    Friends get 2 points, you get 5 points when they activate!
                                </Typography>
                            </View>

                            {/* Tab selector pills */}
                            <View
                                className={`flex-row p-1 rounded-full mb-6 mx-4 ${isDark ? 'bg-[#1C1C1E] border border-white/10' : ''
                                    }`}
                                style={!isDark ? { backgroundColor: '#F3F4F6' } : {}}
                            >
                                <TouchableOpacity
                                    onPress={() => setActiveTab('rewards')}
                                    className={`flex-1 py-3 rounded-full items-center ${activeTab === 'rewards'
                                        ? (isDark ? 'bg-[#3A3A3C] border border-white/10 shadow-md' : '')
                                        : ''
                                        }`}
                                    style={activeTab === 'rewards' ? (!isDark ? { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1, elevation: 1 } : {}) : {}}
                                    activeOpacity={0.8}
                                >
                                    <Typography weight="bold" className={activeTab === 'rewards' ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-gray-400' : 'text-gray-500')}>
                                        Rewards
                                    </Typography>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setActiveTab('referrals')}
                                    className={`flex-1 py-3 rounded-full items-center ${activeTab === 'referrals'
                                        ? (isDark ? 'bg-[#3A3A3C] border border-white/10 shadow-md' : '')
                                        : ''
                                        }`}
                                    style={activeTab === 'referrals' ? (!isDark ? { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1, elevation: 1 } : {}) : {}}
                                    activeOpacity={0.8}
                                >
                                    <Typography weight="bold" className={activeTab === 'referrals' ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-gray-400' : 'text-gray-500')}>
                                        My Referrals
                                    </Typography>
                                </TouchableOpacity>
                            </View>

                            {/* Tab Content */}
                            {activeTab === 'referrals' ? (
                                <Animated.View entering={FadeInUp.duration(400)} className="px-4">
                                    <Typography variant="h3" weight="bold" className="mb-3 ml-2 text-gray-900 dark:text-white">
                                        Referrals List ({data?.referrals.length || 0})
                                    </Typography>
                                    {data?.referrals && data.referrals.length > 0 ? (
                                        data.referrals.map((item, index) => {
                                            const isActivated = item.status === 'ACTIVATED';
                                            const statusColor = isActivated ? 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/30' : 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30';

                                            return (
                                                <View key={item.id} className={`rounded-3xl p-4 mb-3 flex-row items-center ${cardBg}`}>
                                                    <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                                                        <People size={20} color={isDark ? '#E5E7EB' : '#4B5563'} />
                                                    </View>
                                                    <View className="flex-1 pr-2">
                                                        <Typography variant="body" weight="semibold" className="text-gray-900 dark:text-white" numberOfLines={1}>
                                                            {item.referredUser.name}
                                                        </Typography>
                                                        <Typography variant="caption" className="text-[11.5px] mt-0.5 text-gray-500 dark:text-gray-400">
                                                            Registered {new Date(item.referredUser.registeredAt).toLocaleDateString()}
                                                        </Typography>
                                                    </View>
                                                    <View className="items-end">
                                                        <View className={`px-2.5 py-1 rounded-full ${statusColor} flex-row items-center`}>
                                                            {isActivated ? (
                                                                <TickCircle size={12} color={isDark ? '#34D399' : '#059669'} className="mr-1" />
                                                            ) : (
                                                                <Clock size={12} color={isDark ? '#FBBF24' : '#D97706'} className="mr-1" />
                                                            )}
                                                            <Typography variant="caption" className="font-bold text-[10px] uppercase">
                                                                {item.status}
                                                            </Typography>
                                                        </View>
                                                        {!isActivated && (
                                                            <Typography variant="caption" className="text-[9.5px] mt-1 italic text-right text-amber-600 dark:text-amber-400">
                                                                Needs 1 client, 1 order & 1 invoice
                                                            </Typography>
                                                        )}
                                                    </View>
                                                </View>
                                            );
                                        })
                                    ) : (
                                        <View className="items-center py-10 opacity-60">
                                            <Typography className="text-center mb-1 text-gray-500 dark:text-gray-400">
                                                No referrals yet
                                            </Typography>
                                            <Typography variant="small" className="text-center px-6 text-gray-500 dark:text-gray-400">
                                                Share your link above to invite tailors to join NeedleX!
                                            </Typography>
                                        </View>
                                    )}
                                </Animated.View>
                            ) : (
                                <Animated.View entering={FadeInUp.duration(400)} className="px-4 gap-6">
                                    {/* Available Points */}
                                    <View className="flex-row items-center justify-between mx-2 mb-2">
                                        <View className="flex-1">
                                            <Typography variant="caption" color="gray" className="uppercase font-bold tracking-wider text-[11px] mb-1">
                                                Available Points
                                            </Typography>
                                            <Typography variant="h1" weight="bold" className="text-4xl text-blue-600 dark:text-blue-400">
                                                {data?.referralPoints || 0} pts
                                            </Typography>
                                            <Typography variant="caption" color="gray" className="mt-1">
                                                Earn 5 points per activated referral!
                                            </Typography>
                                        </View>
                                        <View className={`w-16 h-16 rounded-full items-center justify-center ${isDark ? 'bg-[#2A1F10]' : 'bg-amber-50'}`}>
                                            <HugeiconsCoinsDollar width={36} height={36} color="#F59E0B" />
                                        </View>
                                    </View>

                                    {/* Partner Tiers List (Simulating concept style) */}
                                    <View>
                                        <Typography variant="h3" weight="bold" className="mb-1 ml-2 font-bold mt-12 text-gray-900 dark:text-white">
                                            Rewards Tiers
                                        </Typography>
                                        <Typography variant="body" color="gray" className="mb-4 ml-2 leading-5">
                                            Unlock levels as your referrals activate accounts.
                                        </Typography>

                                        <RewardTierRow
                                            title="Bronze Partner"
                                            perks={["orders +5", "customers +5", "invoices +5", "catalog +5"]}
                                            pointsRequired={5}
                                            currentPoints={data?.referralPoints || 0}
                                            isDark={isDark}
                                        />
                                        <RewardTierRow
                                            title="Silver Partner"
                                            perks={["orders +25", "customers +25", "invoices +25", "templates +15", "catalog +25"]}
                                            pointsRequired={25}
                                            currentPoints={data?.referralPoints || 0}
                                            isDark={isDark}
                                        />
                                        <RewardTierRow
                                            title="Gold Partner"
                                            perks={["orders +50", "customers +50", "invoices +50", "templates +30", "catalog +50"]}
                                            pointsRequired={50}
                                            currentPoints={data?.referralPoints || 0}
                                            isDark={isDark}
                                        />
                                        <RewardTierRow
                                            title="Platinum Partner"
                                            perks={["orders +100", "customers +100", "invoices +100", "templates +60", "catalog +100"]}
                                            pointsRequired={100}
                                            currentPoints={data?.referralPoints || 0}
                                            isDark={isDark}
                                        />
                                    </View>


                                </Animated.View>
                            )}
                        </>
                    )}
                </ScrollView>

                {toastMessage && (
                    <Animated.View
                        entering={FadeInUp.duration(250)}
                        style={{
                            position: 'absolute',
                            top: insets.top + 12,
                            minHeight: 56,
                            width: '90%',
                            backgroundColor: isDark ? '#1A2F22' : '#F0FFF4',
                            borderRadius: 16,
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: isDark ? 0.3 : 0.05,
                            shadowRadius: 10,
                            elevation: 2,
                            alignSelf: 'center',
                            borderWidth: 1,
                            borderColor: isDark ? '#276749' : '#48BB78',
                            zIndex: 999
                        }}
                    >
                        <TickCircle size={24} color="#48BB78" variant="Bold" />
                        <View className="ml-3 flex-1">
                            <Typography variant="body" weight="medium" color="black" numberOfLines={2}>
                                Copied!
                            </Typography>
                            <Typography variant="small" color="gray" className="mt-0.5">
                                {toastMessage}
                            </Typography>
                        </View>
                    </Animated.View>
                )}
            </View>
        </Modal>
    );
};

interface LimitRowProps {
    label: string;
    base: string;
    bonus: string;
    total: string;
    isDark: boolean;
}

function LimitRow({ label, base, bonus, total, isDark }: LimitRowProps) {
    return (
        <View className="flex-row py-3 border-b border-gray-50 dark:border-white/5 items-center">
            <View className="flex-[2]">
                <Typography weight="semibold" className="text-[14px]">{label}</Typography>
            </View>
            <View className="flex-1 items-center">
                <Typography color="gray" className="text-[14px]">{base}</Typography>
            </View>
            <View className="flex-1 items-center">
                <Typography className="text-[13px] text-green-600 dark:text-green-400 font-medium">{bonus}</Typography>
            </View>
            <View className="flex-1 items-end">
                <Typography weight="bold" className="text-[14px] text-blue-600 dark:text-blue-400">{total}</Typography>
            </View>
        </View>
    );
}

interface RewardTierRowProps {
    title: string;
    perks: string[];
    pointsRequired: number;
    currentPoints: number;
    isDark: boolean;
}

function RewardTierRow({ title, perks, pointsRequired, currentPoints, isDark }: RewardTierRowProps) {
    const isUnlocked = currentPoints >= pointsRequired;
    const ptsLeft = pointsRequired - currentPoints;

    return (
        <View className={`flex-row items-center py-4 rounded-[24px] mb-3
            }`}>
            <View className={`w-16 h-16 rounded-full items-center justify-center mr-4 ${isUnlocked
                ? (isDark ? 'bg-green-500/10' : 'bg-green-50')
                : (isDark ? 'bg-ray-100' : 'bg-gray-200/80')
                }`}>
                {isUnlocked ? (
                    <TickCircle size={22} color="#10B981" variant="Bold" />
                ) : (
                    <Lock size={20} color={isDark ? '#9CA3AF' : '#6B7280'} variant="Bold" />
                )}
            </View>
            <View className="flex-1 pr-2">
                <Typography weight="bold" className="text-gray-900 dark:text-white text-[15px] mb-1">{title}</Typography>
                <View className="flex-row flex-wrap gap-x-2 gap-y-0.5">
                    {perks.map((perk, index) => (
                        <View key={index}>
                            <Typography
                                className="text-[11px] font-semibold"
                                style={{ color: '#ff8fa3' }}
                            >
                                {perk}
                            </Typography>
                        </View>
                    ))}
                </View>
            </View>
            <View className="items-end pl-2">
                {isUnlocked ? (
                    <Typography variant="caption" className="text-green-600 dark:text-green-400 font-bold uppercase text-[9px] tracking-wider">
                        Unlocked
                    </Typography>
                ) : (
                    <Typography variant="caption" color="gray" className="text-amber-600 dark:text-amber-400 font-bold text-[9px] tracking-wider whitespace-nowrap">
                        {ptsLeft} pts left
                    </Typography>
                )}
            </View>
        </View>
    );
}

export function HugeiconsCoinsDollar(props: any) {
    return (
        <Svg width={props.width || 36} height={props.height || 36} viewBox="0 0 24 24">
            <G fill="none" stroke={props.color || "currentColor"} strokeLinecap="round" strokeWidth="1.5">
                <Path d="M14 18a8 8 0 1 0 0-16a8 8 0 0 0 0 16ZM3.157 11A7.111 7.111 0 0 0 13 20.843" />
                <Path strokeLinejoin="round" d="M15.771 8.205c-.216-.912-1.316-1.735-2.637-1.12c-1.321.617-1.531 2.598.467 2.808c.903.095 1.492-.11 2.03.471c.54.581.64 2.198-.738 2.634s-2.742-.245-2.891-1.212m1.984-5.782v.87m0 6.258v.872" />
            </G>
        </Svg>
    );
}
