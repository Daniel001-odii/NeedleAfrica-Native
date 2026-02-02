import React from 'react';
import { View, ScrollView, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Setting2, ArrowRight, User, Gallery, MessageQuestion, Logout, DocumentDownload, CloudChange, ShieldSecurity } from 'iconsax-react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { Surface } from '../../../components/ui/Surface';
import { Typography } from '../../../components/ui/Typography';
import { IconButton } from '../../../components/ui/IconButton';
import { Button } from '../../../components/ui/Button';

export default function Profile() {
    const { user, logout } = useAuth();
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <ScrollView contentContainerClassName="p-6 pb-12" showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View className="mb-8">
                    <Typography variant="h1" weight="bold">Profile</Typography>
                    <Typography variant="body" color="gray">Manage your account</Typography>
                </View>

                {/* User Card */}
                {/* <Surface variant="lavender" className="flex-row items-center p-6 mb-6" rounded="3xl"> */}
                <View className="flex-row items-center mb-6">
                    <Image
                        source={{ uri: user?.profilePicture || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop' }}
                        className="w-20 h-20 rounded-full mr-5"
                    />
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
                            icon={<User size={20} color="black" variant="Bulk" />}
                            title="Personal Information"
                            onPress={() => router.push('/(tabs)/profile/personal')}
                        />
                        <ProfileItem
                            icon={<Setting2 size={20} color="black" variant="Bulk" />}
                            title="Preferences"
                            onPress={() => router.push('/(tabs)/profile/preferences')}
                        />
                        <ProfileItem
                            icon={<Gallery size={20} color="black" variant="Bulk" />}
                            title="Lookbook"
                            subtitle="Showcase your work as a digital catalogue"
                            badge="Coming Soon"
                        />
                    </View>
                </View>

                {/* Data & Security Section */}
                <View className="mb-10">
                    <Typography variant="caption" color="gray" weight="bold" className="mb-4 uppercase tracking-widest">Data & Security</Typography>
                    <View className="gap-4">
                        <ProfileItem
                            icon={<CloudChange size={20} color="black" variant="Bulk" />}
                            title="Backup Data"
                            subtitle="Securely sync your workshop data to cloud"
                            onPress={() => router.push('/(tabs)/profile/backup')}
                        />
                        <ProfileItem
                            icon={<DocumentDownload size={20} color="black" variant="Bulk" />}
                            title="Download Your Data"
                            subtitle="Get a copy of all your records"
                            onPress={() => router.push('/(tabs)/profile/download-data')}
                        />
                    </View>
                </View>

                {/* Support Section */}
                <View className="mb-12">
                    <Typography variant="caption" color="gray" weight="bold" className="mb-4 uppercase tracking-widest">Support</Typography>
                    <View className="gap-4">
                        <ProfileItem
                            icon={<MessageQuestion size={20} color="black" variant="Bulk" />}
                            title="Help & Support"
                        />
                    </View>
                </View>

                {/* Logout Action */}
                <Pressable
                    onPress={logout}
                    className="h-16 rounded-full text-white border-red-500 bg-red-500/10 flex-row shadow-none items-center justify-center gap-3 active:bg-red-500/50 active:text-white"
                >
                    <Logout size={20} color="red" />
                    <Typography weight="bold" color="red">Log Out</Typography>
                </Pressable>

            </ScrollView>
        </SafeAreaView>
    );
}

interface ProfileItemProps {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    badge?: string;
    onPress?: () => void;
}

function ProfileItem({ icon, title, subtitle, badge, onPress }: ProfileItemProps) {
    return (
        <Pressable className="active:opacity-75" onPress={onPress}>
            <Surface variant="white" className="p-4 bg-muted/50" rounded="2xl" hasBorder>
                <View className="flex-row items-center">
                    <View className="w-12 h-12 items-center justify-center bg-white rounded-2xl mr-4 shadow-sm border border-black/5">
                        {icon}
                    </View>
                    <View className="flex-1">
                        <View className="flex-row items-center justify-between">
                            <Typography variant="body" weight="bold">{title}</Typography>
                            {!badge && <ArrowRight size={18} color="#9CA3AF" />}
                            {badge && (
                                <View className="bg-dark px-3 py-1 rounded-full">
                                    <Typography variant="small" color="white" weight="bold" className="text-[10px] uppercase">{badge}</Typography>
                                </View>
                            )}
                        </View>
                        {subtitle && (
                            <Typography variant="small" color="gray" className="mt-1 pr-6 leading-tight">
                                {subtitle}
                            </Typography>
                        )}
                    </View>
                </View>
            </Surface>
        </Pressable>
    );
}
