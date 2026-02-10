import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, Image, Pressable, Linking, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Setting2, ArrowRight, User, Gallery, MessageQuestion, Logout, DocumentDownload, CloudChange, ShieldSecurity, Crown, DocumentText } from 'iconsax-react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { Surface } from '../../../components/ui/Surface';
import { Typography } from '../../../components/ui/Typography';
import { IconButton } from '../../../components/ui/IconButton';
import { Button } from '../../../components/ui/Button';

export default function Profile() {
    const { user, logout, refreshUser } = useAuth();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);

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
        Alert.alert(
            'Log Out',
            'Are you sure you want to log out? You will need to sign in again to access your account.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Log Out', style: 'destructive', onPress: logout }
            ]
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <ScrollView contentContainerClassName="p-6 pb-12" showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}>
                {/* Header */}
                <View className="mb-8">
                    <Typography variant="h1" weight="bold">Profile</Typography>
                    <Typography variant="body" color="gray">Manage your account</Typography>
                </View>

                {/* User Card */}
                {/* <Surface variant="lavender" className="flex-row items-center p-6 mb-6" rounded="3xl"> */}
                <View className="flex-row items-center mb-10 bg-lavender/30 rounded-[36px]">
                    {user?.profilePicture ? (
                        <Image
                            source={{ uri: user.profilePicture }}
                            className="w-20 h-20 rounded-full mr-5"
                        />
                    ) : (
                        <View className="w-20 h-20 items-center justify-center mr-5 bg-black rounded-full">
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
                    <View className="gap-4">
                        <ProfileItem
                            icon={<User size={20} color="#3b82f6" variant="Bulk" />}
                            iconBgColor="bg-blue-50"
                            title="Personal Information"
                            onPress={() => router.push('/(tabs)/profile/personal')}
                        />
                        <ProfileItem
                            icon={<Setting2 size={20} color="#8b5cf6" variant="Bulk" />}
                            iconBgColor="bg-violet-50"
                            title="Preferences"
                            onPress={() => router.push('/(tabs)/profile/preferences')}
                        />
                        <ProfileItem
                            icon={<Gallery size={20} color="#f97316" variant="Bulk" />}
                            iconBgColor="bg-orange-50"
                            title="Lookbook"
                            subtitle="Showcase your work as a digital catalogue"
                            badge="Coming Soon"
                        />
                        <ProfileItem
                            icon={<Crown size={20} color="#Eab308" variant="Bulk" />}
                            iconBgColor="bg-yellow-50"
                            title="Subscription"
                            subtitle="Manage your plan & billing"
                            badge={user?.subscriptionPlan === 'PRO' ? 'Pro' : user?.subscriptionPlan === 'STUDIO_AI' ? 'Studio AI' : 'Free Plan'}
                            badgeColor={user?.subscriptionPlan === 'PRO' ? 'bg-yellow-500' : user?.subscriptionPlan === 'STUDIO_AI' ? 'bg-purple-600' : 'bg-blue-600'}
                            onPress={() => router.push('/(tabs)/profile/subscription')}
                        />
                    </View>
                </View>

                {/* Data & Security Section */}
                <View className="mb-10">
                    <Typography variant="caption" color="gray" weight="bold" className="mb-4 uppercase tracking-widest">Data & Security</Typography>
                    <View className="gap-4">
                        <ProfileItem
                            icon={<CloudChange size={20} color="#06b6d4" variant="Bulk" />}
                            iconBgColor="bg-cyan-50"
                            title="Backup Data"
                            subtitle="Securely sync your workshop data to cloud"
                            onPress={() => router.push('/(tabs)/profile/backup')}
                        />
                        <ProfileItem
                            icon={<DocumentDownload size={20} color="#10b981" variant="Bulk" />}
                            iconBgColor="bg-emerald-50"
                            title="Download Your Data"
                            subtitle="Get a copy of all your records"
                            badge="Coming Soon"
                        />
                    </View>
                </View>

                {/* Support Section */}
                <View className="mb-12">
                    <Typography variant="caption" color="gray" weight="bold" className="mb-4 uppercase tracking-widest">Support</Typography>
                    <View className="gap-4">
                        <ProfileItem
                            icon={<MessageQuestion size={20} color="#db2777" variant="Bulk" />}
                            iconBgColor="bg-pink-50"
                            title="Help & Support"
                            onPress={() => Linking.openURL('https://twitter.com/needleafrica')}
                        />
                        <ProfileItem
                            icon={<MessageQuestion size={20} color="#8b5cf6" variant="Bulk" />}
                            iconBgColor="bg-purple-50"
                            title="Send Feedback"
                            subtitle="Help us improve NeedleAfrica"
                            onPress={() => Linking.openURL('mailto:support@needleafrica.com?subject=Feedback for NeedleAfrica')}
                        />
                        <ProfileItem
                            icon={<DocumentText size={20} color="#6b7280" variant="Bulk" />}
                            iconBgColor="bg-gray-50"
                            title="Privacy Policy"
                            subtitle="View our privacy policy"
                            onPress={() => Linking.openURL('https://needleafrica.com/privacy-policy')}
                        />
                    </View>
                </View>

                {/* Logout Action */}
                <Pressable
                    onPress={handleLogout}
                    className="h-16 rounded-full text-white border-red-500 bg-red-500/10 flex-row shadow-none items-center justify-center gap-3 active:bg-red-500/50 active:text-white"
                >
                    <Logout size={20} color="red" />
                    <Typography weight="bold" color="red">Log Out</Typography>
                </Pressable>

            </ScrollView >
        </SafeAreaView >
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

function ProfileItem({ icon, title, subtitle, badge, onPress, iconBgColor = 'bg-white', badgeColor = 'bg-dark' }: ProfileItemProps) {
    return (
        <Pressable className="active:opacity-75" onPress={onPress}>
            <Surface variant="white" className="p-4 bg-muted/50" rounded="2xl" hasBorder>
                <View className="flex-row items-center">
                    <View className={`w-12 h-12 items-center justify-center rounded-2xl mr-4 border-2 border-black/5 ${iconBgColor}`}>
                        {icon}
                    </View>
                    <View className="flex-1">
                        <View className="flex-row items-center justify-between">
                            <Typography variant="body" weight="bold">{title}</Typography>
                            {!badge && <ArrowRight size={18} color="#9CA3AF" />}
                            {badge && (
                                <View className={`${badgeColor} px-3 py-1 rounded-full`}>
                                    <Typography variant="small" color="white" weight="bold" className="text-[10px] uppercase">{badge}</Typography>
                                </View>
                            )}
                        </View>
                        {subtitle && (
                            <Typography variant="small" color="gray" className="mt-1 pr-6 leading-tight max-w-[80%]">
                                {subtitle}
                            </Typography>
                        )}
                    </View>
                </View>
            </Surface>
        </Pressable>
    );
}
