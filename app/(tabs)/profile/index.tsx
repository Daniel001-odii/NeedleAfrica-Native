import React, { useEffect, useState, useCallback } from 'react';
import Constants from 'expo-constants';
import { View, ScrollView, Image, Pressable, Linking, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Setting2, ArrowRight, User, Gallery, MessageQuestion, Logout, DocumentDownload, CloudChange, ShieldSecurity, Crown, DocumentText, ArrowRight2, People } from 'iconsax-react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { useConfirm } from '../../../contexts/ConfirmContext';
import { Surface } from '../../../components/ui/Surface';
import { Typography } from '../../../components/ui/Typography';
import { IconButton } from '../../../components/ui/IconButton';
import { Button } from '../../../components/ui/Button';
import { useRevenueCat } from '../../../hooks/useRevenueCat';
import { SubscriptionModal } from '../../../components/SubscriptionModal';
import { useTheme } from '../../../contexts/ThemeContext';
import Svg, { Path } from 'react-native-svg';

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
                            className="w-16 h-16 rounded-full mr-5"
                        />
                    ) : (
                        <View className={`w-16 h-16 items-center justify-center mr-5 ${isDark ? 'bg-dark-700' : 'bg-black'} rounded-full`}>
                            <Typography variant="h3" weight="bold" className="text-white">
                                {(user?.username || 'J')[0].toUpperCase()}
                                {(user?.username || 'D').split(' ')[1]?.[0]?.toUpperCase() || ''}
                            </Typography>
                        </View>
                    )}
                    <View className="flex-1">
                        <Typography variant="h3" weight="bold">{user?.username || 'Jane Doe'}</Typography>
                        <Typography variant="caption" color="gray" className="mb-2">{user?.businessName || user?.email || 'jane@needleafrica.com'}</Typography>
                    </View>
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
                            subtitle="Update your name, business & contact info"
                            onPress={() => router.push('/(tabs)/profile/personal')}
                        />
                        <ProfileItem
                            icon={<Setting2 size={20} color={isDark ? "#818CF8" : "#3b82f6"} variant="Bulk" />}
                            title="Preferences"
                            subtitle="App theme, notifications & currency"
                            onPress={() => router.push('/(tabs)/profile/preferences')}
                        />
                        <ProfileItem
                            icon={<Crown size={20} color={isDark ? "#818CF8" : "#3b82f6"} variant="Bulk" />}
                            title="Subscription"
                            subtitle="Manage your plan & billing"
                            badge={userIsPro ? (planType === 'monthly' ? 'PRO' : 'PRO') : ''}
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
                            subtitle="Get assistance or reach out to us"
                            onPress={() => Linking.openURL('https://twitter.com/needleafrica')}
                        />
                        <ProfileItem
                            icon={
                                <Svg width="20" height="20" color={isDark ? "#818CF8" : "#3b82f6"} viewBox="0 0 24 24">{/* Icon from Solar by 480 Design - https://creativecommons.org/licenses/by/4.0/ */}
                                    <Path fill="currentColor" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2S2 6.477 2 12c0 1.6.376 3.112 1.043 4.453c.178.356.237.763.134 1.148l-.595 2.226a1.3 1.3 0 0 0 1.591 1.592l2.226-.596a1.63 1.63 0 0 1 1.149.133A9.96 9.96 0 0 0 12 22" opacity=".5" /><Path fill="currentColor" d="M7.825 12.85a.825.825 0 0 0 0 1.65h6.05a.825.825 0 0 0 0-1.65zm0-3.85a.825.825 0 0 0 0 1.65h8.8a.825.825 0 0 0 0-1.65z" />
                                </Svg>}
                            title="Send Feedback"
                            subtitle="Help us improve NeedleX"
                            onPress={() => Linking.openURL('mailto:hello@needleafrica.com?subject=Feedback for NeedleX')}
                        />
                    </View>
                </View>

                {/* Community Section */}
                <View className="mb-12">
                    <Typography variant="caption" color="gray" weight="bold" className="mb-4 uppercase tracking-widest">Community</Typography>
                    <View className="gap-1">
                        <ProfileItem
                            icon={
                                <People size="20" color={isDark ? "#818CF8" : "#3b82f6"} variant="Bulk" />
                            }
                            title="Join our Community"
                            subtitle="Connect with other designers & tailors"
                            onPress={() => Linking.openURL('https://chat.whatsapp.com/FTIvYiBIyfE4ZLniuOJWmL?mode=gi_t')}
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
                <View className="mt-12 items-center py-8">
                    <Pressable
                        onPress={() => Linking.openURL('https://needleafrica.com/privacy-policy')}
                        className="mb-4"
                    >
                        <Typography variant="small" color="primary" weight="bold" className="underline opacity-60">Privacy Policy</Typography>
                    </Pressable>
                    <View className="items-center opacity-40">
                        <Typography variant="small" color="gray" className="mb-2">
                            Version {Constants.expoConfig?.version || '1.0.0'} from
                        </Typography>
                        <Image
                            source={{ uri: "https://whatsell-git-main-daniel001odiis-projects.vercel.app/_nuxt/muna.eTG7Ant_.png" }}
                            className="w-20 h-8"
                            resizeMode="contain"
                        />
                    </View>
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
