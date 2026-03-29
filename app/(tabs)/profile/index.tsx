import React, { useEffect, useState, useCallback } from 'react';
import Constants from 'expo-constants';
import { View, ScrollView, Image, Pressable, Linking, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import {
    Setting2,
    User,
    MessageQuestion,
    Logout,
    CloudChange,
    Crown,
    ArrowRight2,
    People
} from 'iconsax-react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { useConfirm } from '../../../contexts/ConfirmContext';
import { Typography } from '../../../components/ui/Typography';
import { SubscriptionModal } from '../../../components/SubscriptionModal';
import { useTheme } from '../../../contexts/ThemeContext';
import Svg, { Path } from 'react-native-svg';

export default function Profile() {
    const { user, logout, refreshUser } = useAuth();
    const { confirm } = useConfirm();
    const router = useRouter();
    const { isDark } = useTheme();

    const [refreshing, setRefreshing] = useState(false);
    const [isSubscriptionModalVisible, setIsSubscriptionModalVisible] = useState(false);

    const userIsPro = user?.subscriptionPlan === 'PRO' && user?.subscriptionStatus === 'ACTIVE';
    const planType = user?.currentPlanCode || 'monthly';

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refreshUser();
        setRefreshing(false);
    }, [refreshUser]);

    useEffect(() => {
        refreshUser();
    }, []);

    const handleLogout = () => {
        confirm({
            title: 'Log Out',
            message: 'Are you sure you want to log out? You will need to sign in again to access your account.',
            confirmText: 'Log Out',
            type: 'danger',
            onConfirm: logout
        });
    };

    // Shared style for the grouping cards
    const cardBaseStyle = isDark
        ? 'bg-[#1C1C1E] border border-white/5'
        : 'bg-white border border-gray-100 shadow-sm shadow-gray-100/50';

    return (
        <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-[#F2F2F7]'}`}>
            <ScrollView
                contentContainerClassName="p-5 pb-12 pt-6"
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
            >
                {/* User Info Card */}
                <View className={`flex-row items-center mb-8`}>
                    {user?.profilePicture ? (
                        <Image
                            source={{ uri: user.profilePicture }}
                            className="w-16 h-16 rounded-full mr-4 border border-gray-100"
                        />
                    ) : (
                        <View className={`w-16 h-16 items-center justify-center mr-4 ${isDark ? 'bg-indigo-900/50' : 'bg-blue-50'} rounded-full`}>
                            <Typography variant="h2" weight="bold" color="primary">
                                {(user?.username || 'J')[0].toUpperCase()}
                                {(user?.username || 'D').split(' ')[1]?.[0]?.toUpperCase() || ''}
                            </Typography>
                        </View>
                    )}
                    <View className="flex-1">
                        <Typography variant="h3" weight="bold" className="mb-0.5">{user?.username || 'Jane Doe'}</Typography>
                        <Typography variant="caption" color="primary" weight="medium" className="mb-1">
                            {user?.businessType} • {user?.businessName || 'Workspace'}
                        </Typography>
                        <Typography variant="caption" color="gray" className="text-[11px]">
                            {user?.email || 'jane@needleafrica.com'}
                        </Typography>
                    </View>
                </View>

                {/* Account Section */}
                <View className="mb-8">
                    <Typography variant="caption" color="gray" weight="bold" className="ml-4 mb-2 uppercase tracking-wider text-[11px]">
                        Account
                    </Typography>
                    <View className={`rounded-[24px] overflow-hidden ${cardBaseStyle}`}>
                        <ProfileItem
                            icon={<User size={20} color={isDark ? "#818CF8" : "#3b82f6"} variant="Bulk" />}
                            title="Personal Information"
                            subtitle="Update your name, business & contact info"
                            onPress={() => router.push('/(tabs)/profile/personal')}
                            isDark={isDark}
                        />
                        <ProfileItem
                            icon={<Setting2 size={20} color={isDark ? "#818CF8" : "#3b82f6"} variant="Bulk" />}
                            title="Preferences"
                            subtitle="App theme, notifications & currency"
                            onPress={() => router.push('/(tabs)/profile/preferences')}
                            isDark={isDark}
                        />
                        <ProfileItem
                            icon={<Crown size={20} color={isDark ? "#818CF8" : "#3b82f6"} variant="Bulk" />}
                            title="Subscription"
                            subtitle="Manage your plan & billing"
                            badge={userIsPro ? (planType === 'monthly' ? 'PRO' : 'PRO') : ''}
                            badgeColor={userIsPro ? 'bg-yellow-500' : 'bg-blue-600'}
                            onPress={() => setIsSubscriptionModalVisible(true)}
                            isDark={isDark}
                            isLast
                        />
                    </View>
                </View>

                {/* Data & Security Section */}
                <View className="mb-8">
                    <Typography variant="caption" color="gray" weight="bold" className="ml-4 mb-2 uppercase tracking-wider text-[11px]">
                        Data & Security
                    </Typography>
                    <View className={`rounded-[24px] overflow-hidden ${cardBaseStyle}`}>
                        <ProfileItem
                            icon={<CloudChange size={20} color={isDark ? "#818CF8" : "#3b82f6"} variant="Bulk" />}
                            title="Backup Data"
                            subtitle="Securely sync your workshop data to cloud"
                            onPress={() => router.push('/(tabs)/profile/backup')}
                            isDark={isDark}
                            isLast
                        />
                    </View>
                </View>

                {/* Support Section */}
                <View className="mb-8">
                    <Typography variant="caption" color="gray" weight="bold" className="ml-4 mb-2 uppercase tracking-wider text-[11px]">
                        Support & Community
                    </Typography>
                    <View className={`rounded-[24px] overflow-hidden ${cardBaseStyle}`}>
                        <ProfileItem
                            icon={<MessageQuestion size={20} color={isDark ? "#818CF8" : "#3b82f6"} variant="Bulk" />}
                            title="Help & Support"
                            subtitle="Get assistance or reach out to us"
                            onPress={() => Linking.openURL('https://twitter.com/needleafrica')}
                            isDark={isDark}
                        />
                        <ProfileItem
                            icon={<People size={20} color={isDark ? "#818CF8" : "#3b82f6"} variant="Bulk" />}
                            title="Join our Community"
                            subtitle="Connect with other designers & tailors"
                            onPress={() => Linking.openURL('https://chat.whatsapp.com/FTIvYiBIyfE4ZLniuOJWmL?mode=gi_t')}
                            isDark={isDark}
                        />
                        <ProfileItem
                            icon={
                                <Svg width="20" height="20" color={isDark ? "#818CF8" : "#3b82f6"} viewBox="0 0 24 24">
                                    <Path fill="currentColor" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2S2 6.477 2 12c0 1.6.376 3.112 1.043 4.453c.178.356.237.763.134 1.148l-.595 2.226a1.3 1.3 0 0 0 1.591 1.592l2.226-.596a1.63 1.63 0 0 1 1.149.133A9.96 9.96 0 0 0 12 22" opacity=".5" />
                                    <Path fill="currentColor" d="M7.825 12.85a.825.825 0 0 0 0 1.65h6.05a.825.825 0 0 0 0-1.65zm0-3.85a.825.825 0 0 0 0 1.65h8.8a.825.825 0 0 0 0-1.65z" />
                                </Svg>
                            }
                            title="Send Feedback"
                            subtitle="Help us improve NeedleX"
                            onPress={() => Linking.openURL('mailto:hello@needleafrica.com?subject=Feedback for NeedleX')}
                            isDark={isDark}
                            isLast
                        />
                    </View>
                </View>

                {/* Logout Action */}
                <Pressable
                    onPress={handleLogout}
                    className={`h-14 rounded-[24px] flex-row items-center justify-center gap-2 mb-8 ${cardBaseStyle} active:opacity-70`}
                >
                    <Logout size={20} color="#EF4444" variant="Bulk" />
                    <Typography weight="bold" className="text-red-500 text-[16px]">Log Out</Typography>
                </Pressable>

                {/* App Version & Legal */}
                <View className="items-center pb-4 opacity-60">
                    <Pressable onPress={() => Linking.openURL('https://needleafrica.com/privacy-policy')} className="mb-4">
                        <Typography variant="small" color="primary" weight="bold" className="underline">Privacy Policy</Typography>
                    </Pressable>
                    <View className="items-center">
                        <Typography variant="small" color="gray" className="mb-2 text-[11px]">
                            Version {Constants.expoConfig?.version || '1.0.0'} from
                        </Typography>
                        <Image
                            source={{ uri: "https://whatsell-git-main-daniel001odiis-projects.vercel.app/_nuxt/muna.eTG7Ant_.png" }}
                            className="w-16 h-6 opacity-60"
                            resizeMode="contain"
                        />
                    </View>
                </View>

            </ScrollView>

            <SubscriptionModal
                visible={isSubscriptionModalVisible}
                onClose={() => setIsSubscriptionModalVisible(false)}
            />
        </View>
    );
}

// ----------------------------------------------------------------------
// Reusable List Item
// ----------------------------------------------------------------------

interface ProfileItemProps {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    badge?: string;
    onPress?: () => void;
    badgeColor?: string;
    isLast?: boolean;
    isDark?: boolean;
}

function ProfileItem({
    icon,
    title,
    subtitle,
    badge,
    onPress,
    badgeColor = 'bg-blue-600',
    isLast = false,
    isDark = false
}: ProfileItemProps) {

    // Bottom border for all items except the last one in a block
    const borderStyle = !isLast
        ? (isDark ? 'border-b border-white/5' : 'border-b border-gray-100')
        : '';

    return (
        <Pressable
            className={`active:bg-gray-50/50 dark:active:bg-white/5 flex-row items-center py-5 px-4 ${borderStyle}`}
            onPress={onPress}
        >
            <View className={`w-10 h-10 items-center justify-center rounded-[14px] mr-4 ${isDark ? 'bg-indigo-900/20' : 'bg-blue-50'}`}>
                {icon}
            </View>

            <View className="flex-1 mr-2">
                <Typography variant="body" weight="bold" className="text-[15px] mb-0.5">{title}</Typography>
                {subtitle && (
                    <Typography
                        variant="small"
                        color="gray"
                        className={`leading-tight text-[12px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                    >
                        {subtitle}
                    </Typography>
                )}
            </View>

            <View className="flex-row items-center">
                {badge && (
                    <View className={`${badgeColor} px-2.5 py-0.5 rounded-full mr-2`}>
                        <Typography variant="small" color="white" weight="bold" className="text-[10px] uppercase">
                            {badge}
                        </Typography>
                    </View>
                )}
                <ArrowRight2 size={16} color="#9CA3AF" />
            </View>
        </Pressable>
    );
}