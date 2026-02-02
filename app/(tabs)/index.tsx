import React, { useCallback, useState, useEffect } from 'react';
import { View, ScrollView, Pressable, Image, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchNormal, Notification, Calendar, Profile2User, Box, MagicStar, ArrowRight, Wallet, People, Timer1, Add, Ruler, Gallery } from 'iconsax-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Surface } from '../../components/ui/Surface';
import { Typography } from '../../components/ui/Typography';
import { IconButton } from '../../components/ui/IconButton';
import { useSync } from '../../hooks/useSync';

export default function Home() {
    const { user } = useAuth();
    const router = useRouter();
    const { isSyncing, performSync } = useSync();

    const onRefresh = useCallback(async () => {
        await performSync();
    }, [performSync]);

    // Helper for date formatting
    const today = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <ScrollView
                contentContainerClassName="p-6 pb-12"
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={isSyncing} onRefresh={onRefresh} />}
            >
                {/* Header */}
                <View className="flex-row justify-between items-center mb-6">
                    <View className="flex-row items-center justify-between">
                        <Image
                            source={{ uri: user?.profilePicture || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop' }}
                            className="w-12 h-12 rounded-full mr-3"
                        />

                    </View>
                    <View className="text-center flex flex-col justify-center items-center">
                        <Typography variant="h3" weight="bold" color="black">Hello, {user?.username || 'Tailor'}</Typography>
                        <Typography variant="caption" weight="bold" color="gray">Today {today}</Typography>
                    </View>
                    <View>
                        <IconButton
                            icon={<Notification size={20} color="black" />}
                            variant="white"
                        />
                    </View>
                </View>

                {/* Daily Activity Card */}
                <Surface variant="lavender" className="p-6 mb-4 relative" rounded="3xl">
                    <View className="z-10 w-2/3">
                        <Typography variant="h2" weight="bold" className="mb-1 leading-tight">Use with your team!</Typography>
                        <Typography variant="caption" color="gray" className="mb-4">Cross-team feature</Typography>

                        <View className="flex-row items-center">
                            <View className="flex-row mr-2">
                                {[1, 2, 3].map((i) => (
                                    <Image
                                        key={i}
                                        source={{ uri: `https://i.pravatar.cc/100?u=${i + 10}` }}
                                        className={`w-8 h-8 rounded-full border-2 border-white ${i > 1 ? '-ml-3' : ''}`}
                                    />
                                ))}
                                <View className="w-8 h-8 rounded-full bg-dark border-2 border-white -ml-3 items-center justify-center">
                                    <Typography variant="small" weight="bold" color="white">+4</Typography>
                                </View>
                            </View>
                        </View>
                    </View>



                    <View className="absolute -right-[8px] -top-[36px] w-[150px] h-[180px] z-[9999] overflow-visible">
                        <Image
                            source={require('../../assets/images/bag.png')}
                            className="w-full h-full"
                            resizeMode="contain"
                        />
                    </View>
                </Surface>

                {/* Calendar / Week Strip */}
                {/*  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => {
                        const isToday = idx === 3; // Mocking Wednesday as today
                        return (
                            <View key={day} className="items-center mr-4">
                                <Typography variant="small" color="gray" className="mb-2">{day}</Typography>
                                <Surface
                                    variant={isToday ? 'dark' : 'white'}
                                    className={`w-12 h-16 items-center justify-center ${!isToday && 'border border-gray-100'}`}
                                    rounded="full"
                                >
                                    <Typography
                                        variant="subtitle"
                                        weight="bold"
                                        color={isToday ? 'white' : 'black'}
                                    >
                                        {22 + idx}
                                    </Typography>
                                    {isToday && <View className="w-1 h-1 rounded-full bg-white mt-1" />}
                                </Surface>
                            </View>
                        )
                    })}
                </ScrollView> */}

                {/* Quick Access Section */}
                <View className="mb-8">
                    <Typography variant="h3" weight="bold" className="mb-2">Quick Access</Typography>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="pr-4 gap-4">
                        <QuickAccessItem
                            icon={<Add size={24} color="white" />}
                            label="New Order"
                            bg="bg-black"
                            textColor="text-black"
                            iconColor="white"
                            onPress={() => router.push('/(tabs)/orders/new')}
                        />
                        <QuickAccessItem
                            icon={<People size={24} color="black" />}
                            label="Add Client"
                            bg="bg-accent-peach"
                            onPress={() => router.push('/(tabs)/customers/new')}
                        />
                        {/* <QuickAccessItem
                            icon={<Ruler size={24} color="black" />}
                            label="Calculator"
                            bg="bg-accent-lavender"
                        /> */}
                        <QuickAccessItem
                            icon={<Gallery size={24} color="black" />}
                            label="Lookbook"
                            bg="bg-accent-blue"
                            onPress={() => router.push('/(tabs)/profile')} // Assuming Lookbook is part of profile/extras
                        />
                    </ScrollView>
                </View>

                {/* Section Header */}
                <View className="flex-row justify-between items-center mb-3">
                    <Typography variant="h2" weight="bold">Workshop Insights</Typography>
                </View>

                {/* Insights Grid */}
                <View className="flex-row gap-4">
                    <View className="flex-1 gap-4">
                        {/* Pending Orders - Tall */}
                        <Surface variant="peach" className="p-4 min-h-[160px] justify-between" rounded="3xl">
                            <View className="flex-row justify-between items-start">
                                <View className="w-10 h-10 bg-white/50 rounded-full items-center justify-center">
                                    <Box size={20} color="#EA580C" variant="Bulk" />
                                </View>
                                <Surface variant="white" className="px-2 py-1" rounded="full">
                                    <Typography variant="small" weight="bold" className="text-[10px] text-orange-700">+2 today</Typography>
                                </Surface>
                            </View>

                            <View>
                                <Typography variant="h2" weight="bold" className="mb-1">12</Typography>
                                <Typography variant="caption" color="gray" weight="bold">Pending Orders</Typography>
                                <View className="mt-3 flex-row items-center">
                                    <View className="w-2 h-2 rounded-full bg-orange-500 mr-2" />
                                    <Typography variant="small" color="gray">5 due this week</Typography>
                                </View>
                            </View>
                        </Surface>

                        {/* Total Customers - Short */}
                        <Surface variant="muted" className="p-4" rounded="3xl">
                            <View className="flex-row items-center justify-between mb-2">
                                <View className="w-8 h-8 bg-white rounded-full items-center justify-center">
                                    <People size={16} color="black" variant="Bulk" />
                                </View>
                                <ArrowRight size={16} color="#9CA3AF" />
                            </View>
                            <Typography variant="h3" weight="bold">24</Typography>
                            <Typography variant="caption" color="gray">Total Customers</Typography>
                        </Surface>
                    </View>

                    <View className="flex-1 gap-4">
                        {/* Revenue - Short */}
                        <Surface variant="blue" className="p-4" rounded="3xl">
                            <View className="flex-row items-center justify-between mb-2">
                                <View className="w-8 h-8 bg-white/50 rounded-full items-center justify-center">
                                    <Wallet size={16} color="#3B82F6" variant="Bulk" />
                                </View>
                                <Typography variant="small" weight="bold" className="text-blue-700">Weekly</Typography>
                            </View>
                            <Typography variant="h3" weight="bold">₦450k</Typography>
                            <Typography variant="caption" color="gray">Revenue</Typography>
                        </Surface>

                        {/* Next Deadline - Tall */}
                        <Surface variant="green" className="p-4 min-h-[160px] justify-between" rounded="3xl">
                            <View className="flex-row justify-between items-start">
                                <View className="w-10 h-10 bg-white/50 rounded-full items-center justify-center">
                                    <Timer1 size={20} color="#15803d" variant="Bulk" />
                                </View>
                                <View className="bg-green-100 px-2 py-1 rounded-md">
                                    <Typography variant="small" weight="bold" className="text-[10px] text-green-800">URGENT</Typography>
                                </View>
                            </View>

                            <View>
                                <Typography variant="body" weight="bold" className="leading-tight mb-1">Chief Obi's Agbada</Typography>
                                <Typography variant="caption" color="gray" className="mb-3">Due Tomorrow</Typography>

                                <View className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden">
                                    <View className="w-[85%] h-full bg-green-600 rounded-full" />
                                </View>
                                <Typography variant="small" weight="bold" className="mt-2 text-right text-green-700">85% Done</Typography>
                            </View>
                        </Surface>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

function QuickAccessItem({ icon, label, bg, textColor = "text-black", iconColor = "black", onPress }: any) {
    return (
        <Pressable className="items-center mr-4" onPress={onPress}>
            <View className={`w-12 h-12 ${bg} rounded-[24px] items-center justify-center mb-2 shadow-sm`}>
                {icon}
            </View>
            <Typography variant="small" weight="medium" className={textColor}>{label}</Typography>
        </Pressable>
    );
}
