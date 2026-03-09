import React, { useEffect, useState, useCallback } from 'react';
import Constants from 'expo-constants';
import { View, ScrollView, Image, Pressable, Linking, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Setting2, ArrowRight, User, Gallery, MessageQuestion, Logout, DocumentDownload, CloudChange, ShieldSecurity, Crown, DocumentText, ArrowRight2 } from 'iconsax-react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { useConfirm } from '../../../contexts/ConfirmContext';
import { Surface } from '../../../components/ui/Surface';
import { Typography } from '../../../components/ui/Typography';
import { IconButton } from '../../../components/ui/IconButton';
import { Button } from '../../../components/ui/Button';
import { useRevenueCat } from '../../../hooks/useRevenueCat';
import { SubscriptionModal } from '../../../components/SubscriptionModal';
import { useTheme } from '../../../contexts/ThemeContext';

export default function Profile() {
    const { user, logout, refreshUser } = useAuth();
    // const { isPro, subscriptionStatus } = useRevenueCat();
    const { confirm } = useConfirm();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const { isDark } = useTheme();
    const [isSubscriptionModalVisible, setIsSubscriptionModalVisible] = useState(false);

    const userIsPro = user?.subscriptionPlan === 'PRO' && user?.subscriptionStatus === 'ACTIVE';
    const planType = user?.currentPlanCode || 'monthly';

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refreshUser();
        setRefreshing(false);
    }, [refreshUser]);

    // Refresh user data when profile page mounts
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

    return (
        <View className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-background-default'}`}>
            <ScrollView contentContainerClassName="p-8 pb-12" showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}>
                {/* Header */}
                {/* <View className="mb-8">
                    <Typography variant="h1" weight="bold">Profile</Typography>
                    <Typography variant="body" color="gray">Manage your account</Typography>
                </View> */}

                {/* User Card */}
                {/* <Surface variant="lavender" className="flex-row items-center p-6 mb-6" rounded="3xl"> */}
                <View className="flex-row items-center mb-10 rounded-[36px]">
                    {user?.profilePicture ? (
                        <Image
                            source={{ uri: user.profilePicture }}
                            className="w-20 h-20 rounded-full mr-5"
                        />
                    ) : (
                        <View className={`w-20 h-20 items-center justify-center mr-5 ${isDark ? 'bg-dark-700' : 'bg-black'} rounded-full`}>
                            <Typography variant="h1" weight="bold" className="text-white">
                                {(user?.username || 'J')[0].toUpperCase()}
                                {(user?.username || 'D').split(' ')[1]?.[0]?.toUpperCase() || ''}
                            </Typography>
                        </View>
                    )}
                    <View className="flex-1">
                        <Typography variant="h3" weight="bold">{user?.username || 'Jane Doe'}</Typography>
                        <Typography variant="caption" color="gray" className="mb-2">{user?.businessName || user?.email || 'jane@needleafrica.com'}</Typography>
                        <View className="bg-blue-500/50 self-start px-3 py-1 rounded-full">
                            <Typography variant="small" weight="bold">{user?.role || 'Tailor'}</Typography>
                        </View>
                    </View>
                    {/* <IconButton icon={<Setting2 size={20} color="black" />} variant="white" /> */}
                    {/* </Surface> */}
                </View>

                {/* Stats Section */}
                {/*  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mb-10 flex-row"
                    contentContainerClassName="pr-6"
                >
                    <Surface variant="peach" className="px-6 py-4 mr-3 min-w-[120px]" rounded="3xl">
                        <Typography variant="h3" weight="bold">24</Typography>
                        <Typography variant="small" color="gray">Orders Done</Typography>
                    </Surface>
                    <Surface variant="blue" className="px-6 py-4 mr-3 min-w-[120px]" rounded="3xl">
                        <Typography variant="h3" weight="bold">12</Typography>
                        <Typography variant="small" color="gray">Pending</Typography>
                    </Surface>
                    <Surface variant="green" className="px-6 py-4 mr-3 min-w-[120px]" rounded="3xl">
                        <Typography variant="h3" weight="bold">4.8</Typography>
                        <Typography variant="small" color="gray">Rating</Typography>
                    </Surface>
                </ScrollView> */}

                {/* Account Section */}
                <View className="mb-10">
                    <Typography variant="caption" color="gray" weight="bold" className="mb-4 uppercase tracking-widest">Account</Typography>
                    <View className="gap-1">
                        <ProfileItem
                            icon={<User size={20} color={isDark ? "#818CF8" : "#3b82f6"} variant="Bulk" />}
                            title="Personal Information"
                            onPress={() => router.push('/(tabs)/profile/personal')}
                        />
                        <ProfileItem
                            icon={<Setting2 size={20} color={isDark ? "#818CF8" : "#3b82f6"} variant="Bulk" />}
                            title="Preferences"
                            onPress={() => router.push('/(tabs)/profile/preferences')}
                        />
                        <ProfileItem
                            icon={<Crown size={20} color={isDark ? "#818CF8" : "#3b82f6"} variant="Bulk" />}
                            title="Subscription"
                            subtitle="Manage your plan & billing"
                            badge={userIsPro ? (planType === 'monthly' ? 'PRO' : 'PRO') : 'Free Plan'}
                            badgeColor={userIsPro ? 'bg-yellow-500' : 'bg-blue-600'}
                            onPress={() => setIsSubscriptionModalVisible(true)}
                        />
                    </View>
                </View>

                {/* Data & Security Section */}
                <View className="mb-10">
                    <Typography variant="caption" color="gray" weight="bold" className="mb-4 uppercase tracking-widest">Data & Security</Typography>
                    <View className="gap-1">
                        <ProfileItem
                            icon={<CloudChange size={20} color={isDark ? "#818CF8" : "#3b82f6"} variant="Bulk" />}
                            title="Backup Data"
                            subtitle="Securely sync your workshop data to cloud"
                            onPress={() => router.push('/(tabs)/profile/backup')}
                        />
                    </View>
                </View>

                {/* Support Section */}
                <View className="mb-12">
                    <Typography variant="caption" color="gray" weight="bold" className="mb-4 uppercase tracking-widest">Support</Typography>
                    <View className="gap-1">
                        <ProfileItem
                            icon={<MessageQuestion size={20} color={isDark ? "#818CF8" : "#3b82f6"} variant="Bulk" />}
                            title="Help & Support"
                            onPress={() => Linking.openURL('https://twitter.com/needleafrica')}
                        />
                        <ProfileItem
                            icon={<MessageQuestion size={20} color={isDark ? "#818CF8" : "#3b82f6"} variant="Bulk" />}
                            title="Send Feedback"
                            subtitle="Help us improve NeedleAfrica"
                            onPress={() => Linking.openURL('mailto:support@needleafrica.com?subject=Feedback for NeedleAfrica')}
                        />
                        <ProfileItem
                            icon={<DocumentText size={20} color={isDark ? "#818CF8" : "#3b82f6"} variant="Bulk" />}
                            title="Privacy Policy"
                            subtitle="View our privacy policy"
                            onPress={() => Linking.openURL('https://needleafrica.com/privacy-policy')}
                        />
                    </View>
                </View>

                {/* Logout Action */}
                <Pressable
                    onPress={handleLogout}
                    className="h-16 rounded-full border-red-500 bg-red-500/30 flex-row items-center justify-center gap-3 active:bg-blue-500/20"
                >
                    <Logout size={20} color="#f63b3bff" />
                    <Typography weight="bold" className="text-red-500">Log Out</Typography>
                </Pressable>

                {/* App Version */}
                <View className="mt-8 items-center opacity-30">
                    <Typography variant="small" color="gray">
                        Version {Constants.expoConfig?.version || '1.0.0'}
                    </Typography>
                </View>

            </ScrollView >

            <SubscriptionModal
                visible={isSubscriptionModalVisible}
                onClose={() => setIsSubscriptionModalVisible(false)}
            />
        </View >
    );
}

interface ProfileItemProps {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    badge?: string;
    onPress?: () => void;
    iconBgColor?: string;
    badgeColor?: string;
}

function ProfileItem({ icon, title, subtitle, badge, onPress, badgeColor = 'bg-blue-600' }: ProfileItemProps) {
    const { isDark } = useTheme();
    return (
        <Pressable className="active:opacity-75" onPress={onPress}>
            <View className="flex-row items-center py-3">
                <View className={`w-12 h-12 items-center justify-center rounded-2xl mr-4 border-2 border-black/5 ${isDark ? 'bg-indigo-900/20' : 'bg-blue-50'}`}>
                    {icon}
                </View>
                <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                        <Typography variant="body" weight="bold">{title}</Typography>
                        {!badge && <ArrowRight2 size={18} color="#9CA3AF" />}
                        {badge && (
                            <View className={`${badgeColor} px-3 py-1 rounded-full`}>
                                <Typography variant="small" color="white" weight="bold" className="text-[10px] uppercase">{badge}</Typography>
                            </View>
                        )}
                    </View>
                    {subtitle && (
                        <Typography variant="small" color="gray" className={`mt-1 pr-6 leading-tight max-w-[90%] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {subtitle}
                        </Typography>
                    )}
                </View>
            </View>
        </Pressable>
    );
}
