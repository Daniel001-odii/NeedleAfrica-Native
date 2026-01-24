import React, { useCallback, useState } from 'react';
import { View, ScrollView, Pressable, Image, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchNormal, Notification, Calendar, Profile2User, Box, MagicStar, ArrowRight } from 'iconsax-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Surface } from '../../components/ui/Surface';
import { Typography } from '../../components/ui/Typography';
import { IconButton } from '../../components/ui/IconButton';

export default function Home() {
    const { user } = useAuth();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1500);
    }, []);

    // Helper for date formatting
    const today = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <ScrollView
                contentContainerClassName="p-6 pb-12"
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Header */}
                <View className="flex-row justify-between items-center mb-6">
                    <View className="flex-row items-center justify-between">
                        <Image
                            source={{ uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop' }}
                            className="w-12 h-12 rounded-full mr-3"
                        />

                    </View>
                    <View className="text-center flex flex-col justify-center items-center">
                        <Typography variant="h3" weight="bold" color="black">Hello, {user?.name || 'Sandra'}</Typography>
                        <Typography variant="caption" weight="bold" color="gray">Today {today}</Typography>
                    </View>
                    <View>
                        <IconButton
                            icon={<SearchNormal size={20} color="black" />}
                            variant="white"
                        />
                    </View>
                </View>

                {/* Daily Activity Card */}
                <Surface variant="lavender" className="p-6 mb-8 relative" rounded="3xl">
                    <View className="z-10 w-2/3">
                        <Typography variant="h2" weight="bold" className="mb-1 leading-tight">Production goal</Typography>
                        <Typography variant="caption" color="gray" className="mb-4">Do your plan before 09:00 AM</Typography>

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
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8">
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
                </ScrollView>

                {/* Section Header */}
                <View className="flex-row justify-between items-center mb-6">
                    <Typography variant="h2" weight="bold">Your plan</Typography>
                </View>

                {/* Plan Grid */}
                <View className="flex-row gap-4">
                    <View className="flex-1 gap-4">
                        <Surface variant="peach" className="p-4 min-h-[160px]" rounded="3xl">
                            <View className="bg-accent-peach/50 self-start px-3 py-1 rounded-full mb-3">
                                <Typography variant="small" weight="bold">High</Typography>
                            </View>
                            <Typography variant="subtitle" weight="bold" className="mb-1">Senator Suit</Typography>
                            <Typography variant="caption" color="gray" className="mb-4">25 Nov • 14:00</Typography>

                            <View className="mt-auto flex-row items-center">
                                <Image source={{ uri: 'https://i.pravatar.cc/100?u=johndoe' }} className="w-6 h-6 rounded-full mr-2" />
                                <Typography variant="small" weight="medium">John Doe</Typography>
                            </View>
                        </Surface>

                        <Surface variant="muted" className="p-4" rounded="3xl">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row gap-2">
                                    <IconButton icon={<Notification size={16} color="#6B7280" />} size="sm" variant="ghost" />
                                    <IconButton icon={<Calendar size={16} color="#6B7280" />} size="sm" variant="ghost" />
                                </View>
                            </View>
                        </Surface>
                    </View>

                    <View className="flex-1 gap-4">
                        <Surface variant="blue" className="p-4" rounded="3xl">
                            <View className="bg-accent-blue/50 self-start px-3 py-1 rounded-full mb-3">
                                <Typography variant="small" weight="bold">Medium</Typography>
                            </View>
                            <Typography variant="subtitle" weight="bold">Fitting</Typography>
                            <Typography variant="caption" color="gray">Sarah K.</Typography>
                        </Surface>

                        <Surface variant="green" className="p-4 min-h-[140px]" rounded="3xl">
                            <View className="flex-row justify-between mb-2">
                                <Typography variant="small" weight="bold">Status</Typography>
                                <ArrowRight size={16} color="black" />
                            </View>
                            <Typography variant="h3" weight="bold">80%</Typography>
                            <Typography variant="caption" color="gray">Order Done</Typography>
                            <View className="w-full h-1 bg-black/10 rounded-full mt-4">
                                <View className="w-[80%] h-1 bg-black rounded-full" />
                            </View>
                        </Surface>
                    </View>

                </View>

            </ScrollView>
        </SafeAreaView>
    );
}
