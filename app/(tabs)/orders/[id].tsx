import React from 'react';
import { View, ScrollView, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Edit2, Timer1, Verify, DocumentText, Money, Call, User } from 'iconsax-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../../../components/ui/Typography';
import { Surface } from '../../../components/ui/Surface';
import { IconButton } from '../../../components/ui/IconButton';
import { Button } from '../../../components/ui/Button';

export default function OrderDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    // Mock data based on ID (normally fetch from DB)
    const order = {
        id: id,
        title: 'Senator Suit',
        client: 'John Doe',
        status: 'Pending',
        dueDate: '25 Nov',
        price: '$450',
        notes: 'Double vent, slim fit trousers. Client prefers extra room in the thigh area.',
        fabricImage: 'https://images.unsplash.com/photo-1550926435-0da37aa0350d?w=400&h=400&fit=crop',
        styleImage: 'https://images.unsplash.com/photo-1594938298603-c8148c47e356?w=400&h=600&fit=crop'
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <View className="px-6 py-4 flex-row justify-between items-center border-b border-gray-50">
                <IconButton
                    icon={<ArrowLeft size={20} color="black" />}
                    onPress={() => router.back()}
                    variant="ghost"
                    className="-ml-2"
                />
                <Typography variant="h3" weight="bold">Order Details</Typography>
                <IconButton
                    icon={<Edit2 size={20} color="black" />}
                    variant="ghost"
                    className="-mr-2"
                />
            </View>

            <ScrollView contentContainerClassName="p-6 pb-24" showsVerticalScrollIndicator={false}>

                {/* Status Header */}
                <View className="flex-row justify-between items-start mb-6">
                    <View className="flex-1">
                        <Typography variant="h1" weight="bold" className="mb-2 leading-tight">{order.title}</Typography>
                        <View className="flex-row items-center">
                            <Surface variant="peach" className="px-3 py-1 mr-2" rounded="full">
                                <Typography variant="small" weight="bold" color="red" className="text-orange-700">In Progress</Typography>
                            </Surface>
                            <Typography variant="caption" color="gray">#{order.id}</Typography>
                        </View>
                    </View>
                    <Surface variant="muted" className="w-16 h-16 items-center justify-center" rounded="2xl">
                        <Calendar size={24} color="#6B7280" variant="Bulk" />
                    </Surface>
                </View>

                {/* Client Info Card */}
                <Surface variant="white" className="p-4 mb-6 border border-gray-100 flex-row items-center" rounded="2xl">
                    <View className="w-12 h-12 bg-lavender items-center justify-center rounded-xl mr-4">
                        <Typography weight="bold" className="text-brand-primary">JD</Typography>
                    </View>
                    <View className="flex-1">
                        <Typography weight="bold">{order.client}</Typography>
                        <Typography variant="small" color="gray">08012345678</Typography>
                    </View>
                    <IconButton icon={<Call size={20} color="black" />} variant="ghost" />
                </Surface>

                {/* Grid Info */}
                <View className="flex-row gap-4 mb-6">
                    <Surface variant="blue" className="flex-1 p-4" rounded="3xl">
                        <View className="flex-row items-center mb-2 opacity-60">
                            <Timer1 size={16} color="black" className="mr-2" />
                            <Typography variant="small" weight="bold">Due Date</Typography>
                        </View>
                        <Typography variant="h3" weight="bold">{order.dueDate}</Typography>
                    </Surface>
                    <Surface variant="green" className="flex-1 p-4" rounded="3xl">
                        <View className="flex-row items-center mb-2 opacity-60">
                            <Money size={16} color="black" className="mr-2" />
                            <Typography variant="small" weight="bold">Price</Typography>
                        </View>
                        <Typography variant="h3" weight="bold">{order.price}</Typography>
                    </Surface>
                </View>

                {/* Reference Images */}
                <Typography variant="caption" weight="bold" color="gray" className="mb-3 uppercase ml-1">References</Typography>
                <View className="flex-row gap-4 mb-8 h-48">
                    <Surface variant="muted" className="flex-1 overflow-hidden" rounded="3xl">
                        <Image source={{ uri: order.fabricImage }} className="w-full h-full" resizeMode="cover" />
                        <View className="absolute bottom-3 left-3 bg-white/80 px-2 py-1 rounded-lg">
                            <Typography variant="small" weight="bold">Fabric</Typography>
                        </View>
                    </Surface>
                    <Surface variant="muted" className="flex-1 overflow-hidden" rounded="3xl">
                        <Image source={{ uri: order.styleImage }} className="w-full h-full" resizeMode="cover" />
                        <View className="absolute bottom-3 left-3 bg-white/80 px-2 py-1 rounded-lg">
                            <Typography variant="small" weight="bold">Style</Typography>
                        </View>
                    </Surface>
                </View>

                {/* Notes */}
                <View className="mb-10">
                    <View className="flex-row items-center mb-3">
                        <DocumentText size={20} color="#6B7280" variant="Bulk" />
                        <Typography variant="caption" weight="bold" color="gray" className="uppercase ml-2">Notes</Typography>
                    </View>
                    <Surface variant="muted" className="p-5" rounded="2xl">
                        <Typography variant="body" className="leading-relaxed">{order.notes}</Typography>
                    </Surface>
                </View>

                <Button className="h-16 rounded-full bg-dark">
                    Mark as Delivered
                </Button>

            </ScrollView>
        </SafeAreaView>
    );
}
