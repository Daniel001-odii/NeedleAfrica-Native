import React, { useState } from 'react';
import { View, ScrollView, Image, Linking, Pressable, Modal, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, User, Call, Sms, MessageText1, Ruler, Gallery, CloseCircle } from 'iconsax-react-native';
import { Typography } from '../components/ui/Typography';
import { IconButton } from '../components/ui/IconButton';
import { Button } from '../components/ui/Button';
import { useTheme } from '../contexts/ThemeContext';
import { OrderRequest } from '../services/OrderRequestService';
import { Surface } from '../components/ui/Surface';

export default function OrderRequestDetailsScreen() {
    const { isDark } = useTheme();
    const params = useLocalSearchParams();

    // Full screen image view
    const [viewerVisible, setViewerVisible] = useState(false);
    const [selectedImage, setSelectedImage] = useState<{ uri: string; label: string } | null>(null);

    const openViewer = (uri: string, label: string) => {
        setSelectedImage({ uri, label });
        setViewerVisible(true);
    };

    let orderRequest: OrderRequest | null = null;

    try {
        if (typeof params.data === 'string') {
            orderRequest = JSON.parse(params.data);
        }
    } catch (e) {
        console.error('Failed to parse order request data', e);
    }

    if (!orderRequest) {
        return (
            <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-white'} items-center justify-center`}>
                <Typography variant="body" className={isDark ? 'text-white' : 'text-black'}>
                    Order Request not found.
                </Typography>
                <Pressable onPress={() => router.back()} className="mt-4 p-3 bg-gray-100 rounded-lg">
                    <Typography>Go Back</Typography>
                </Pressable>
            </View>
        );
    }

    const handleCall = () => {
        if (orderRequest?.phoneNumber) {
            Linking.openURL(`tel:${orderRequest.phoneNumber}`);
        }
    };

    const handleWhatsApp = () => {
        if (orderRequest?.phoneNumber) {
            const cleanPhone = orderRequest.phoneNumber.replace(/\D/g, '');
            Linking.openURL(`whatsapp://send?phone=${cleanPhone}`);
        }
    };

    const handleEmail = () => {
        if (orderRequest?.email) {
            Linking.openURL(`mailto:${orderRequest.email}`);
        }
    };

    return (
        <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-white'}`}>
            <SafeAreaView edges={['top']} className="flex-1">
                <View className="flex-row items-center px-4 py-3">
                    <IconButton
                        icon={<ArrowLeft size={24} color={isDark ? 'white' : 'black'} />}
                        onPress={() => router.back()}
                        variant="ghost"
                        className="-ml-2"
                    />
                    <View className="flex-1 items-center -ml-10">
                        <Typography variant="h3" weight="bold" className={isDark ? 'text-white' : 'text-black'}>
                            Order Details
                        </Typography>
                    </View>
                </View>

                <ScrollView className="flex-1" contentContainerClassName="p-4 pb-20">
                    {/* Header Info */}
                    <Surface variant="white" className="p-4 mb-3" rounded="3xl">
                        <View className="flex-row items-center mb-4">
                            <View className="w-12 h-12 rounded-full bg-[#FF5678] items-center justify-center mr-4">
                                <User size={24} color="white" />
                            </View>
                            <View className="flex-1">
                                <Typography variant="h3" weight="bold" className={isDark ? 'text-white' : 'text-black'}>
                                    {orderRequest.fullName}
                                </Typography>
                                <Typography variant="small" color="gray">
                                    {new Date(orderRequest.createdAt).toLocaleDateString()} at {new Date(orderRequest.createdAt).toLocaleTimeString()}
                                </Typography>
                            </View>
                        </View>

                        {/* Contact Details */}
                        {(orderRequest.phoneNumber || orderRequest.email) && (
                            <View className="border-t border-gray-200 dark:border-zinc-800 pt-4 mt-2 mb-3">
                                {orderRequest.phoneNumber && (
                                    <Pressable onPress={handleCall} className="flex-row items-center mb-3">
                                        <View className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 items-center justify-center mr-3">
                                            <Call size={18} color="#3b82f6" variant="Bold" />
                                        </View>
                                        <View className="flex-1">
                                            <Typography variant="small" color="gray" className="text-[10px] uppercase tracking-wider mb-0.5">
                                                Phone
                                            </Typography>
                                            <Typography variant="body" weight="semibold" className={isDark ? 'text-white' : 'text-black'}>
                                                {orderRequest.phoneNumber}
                                            </Typography>
                                        </View>
                                    </Pressable>
                                )}
                                {orderRequest.email && (
                                    <Pressable onPress={handleEmail} className="flex-row items-center">
                                        <View className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-900 items-center justify-center mr-3">
                                            <Sms size={18} color="#f97316" variant="Bold" />
                                        </View>
                                        <View className="flex-1">
                                            <Typography variant="small" color="gray" className="text-[10px] uppercase tracking-wider mb-0.5">
                                                Email
                                            </Typography>
                                            <Typography variant="body" weight="semibold" className={isDark ? 'text-white' : 'text-black'}>
                                                {orderRequest.email}
                                            </Typography>
                                        </View>
                                    </Pressable>
                                )}
                            </View>
                        )}

                        {/* Quick Actions */}
                        <View className="flex-row justify-around border-t border-gray-200 dark:border-zinc-800 pt-4">
                            {orderRequest.phoneNumber && (
                                <>
                                    <Pressable onPress={handleCall} className="items-center">
                                        <View className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 items-center justify-center mb-1">
                                            <Call size={20} color="#3b82f6" variant="Bold" />
                                        </View>
                                        <Typography variant="small" className={isDark ? 'text-white' : 'text-black'}>Call</Typography>
                                    </Pressable>
                                    <Pressable onPress={handleWhatsApp} className="items-center">
                                        <View className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 items-center justify-center mb-1">
                                            <MessageText1 size={20} color="#22c55e" variant="Bold" />
                                        </View>
                                        <Typography variant="small" className={isDark ? 'text-white' : 'text-black'}>WhatsApp</Typography>
                                    </Pressable>
                                </>
                            )}
                            {orderRequest.email && (
                                <Pressable onPress={handleEmail} className="items-center">
                                    <View className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 items-center justify-center mb-1">
                                        <Sms size={20} color="#f97316" variant="Bold" />
                                    </View>
                                    <Typography variant="small" className={isDark ? 'text-white' : 'text-black'}>Email</Typography>
                                </Pressable>
                            )}
                        </View>
                    </Surface>

                    {/* Description */}
                    {orderRequest.description && (
                        <Surface variant="white" className="p-4 mb-3" rounded="3xl">
                            <View className="flex-row items-center mb-2">
                                <Typography weight="bold" className={`${isDark ? 'text-white' : 'text-black'} font-semibold`}>
                                    Notes
                                </Typography>
                            </View>
                            <Typography variant="body" className={`mt-2 ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
                                {orderRequest.description}
                            </Typography>
                        </Surface>
                    )}

                    {/* Measurements */}
                    {(orderRequest.bust || orderRequest.waist || orderRequest.hips || orderRequest.length ||
                        (orderRequest.customMeasurements && orderRequest.customMeasurements.length > 0)) && (
                            <Surface variant="white" className="p-4 mb-3" rounded="3xl">
                                <View className="flex-row items-center mb-4">
                                    <Typography weight="bold" className={`${isDark ? 'text-white' : 'text-black'} font-semibold`}>
                                        Measurements
                                    </Typography>
                                </View>

                                <View className="flex-row flex-wrap">
                                    {[
                                        { label: 'Bust', value: orderRequest.bust },
                                        { label: 'Waist', value: orderRequest.waist },
                                        { label: 'Hips', value: orderRequest.hips },
                                        { label: 'Length', value: orderRequest.length },
                                    ].map((m, i) => m.value ? (
                                        <View key={i} className="w-1/2 mb-3">
                                            <Typography variant="small" color="gray" className="uppercase tracking-wider text-[10px] mb-1">
                                                {m.label}
                                            </Typography>
                                            <Typography variant="body" weight="semibold" className={isDark ? 'text-white' : 'text-black'}>
                                                {m.value}
                                            </Typography>
                                        </View>
                                    ) : null)}

                                    {orderRequest.customMeasurements && orderRequest.customMeasurements.map((cm, i) => (
                                        <View key={`cm-${i}`} className="w-1/2 mb-3">
                                            <Typography variant="small" color="gray" className="uppercase tracking-wider text-[10px] mb-1">
                                                {cm.name}
                                            </Typography>
                                            <Typography variant="body" weight="semibold" className={isDark ? 'text-white' : 'text-black'}>
                                                {cm.value}
                                            </Typography>
                                        </View>
                                    ))}
                                </View>
                            </Surface>
                        )}

                    {/* Images */}
                    {orderRequest.inspoImages && orderRequest.inspoImages.length > 0 && (
                        <Surface variant="white" className="p-4 mb-3" rounded="3xl">
                            <View className="flex-row items-center mb-4">
                                <Typography weight="bold" className={`${isDark ? 'text-white' : 'text-black'} font-semibold`}>
                                    Reference Images
                                </Typography>
                            </View>
                            <View className="flex-row flex-wrap gap-2">
                                {orderRequest.inspoImages.map((img, i) => (
                                    <Pressable key={i} onPress={() => openViewer(img, `Reference ${i + 1}`)} className="flex-1">
                                        <Image
                                            source={{ uri: img }}
                                            className="h-[150] aspect-square rounded-lg bg-gray-200"
                                            resizeMode="cover"
                                        />
                                    </Pressable>
                                ))}
                            </View>
                        </Surface>
                    )}

                    {/* Action Buttons */}
                    <View className="flex-row gap-3 pb-6">

                        <Button
                            onPress={() => { }}
                            className="flex-1 h-14 rounded-full bg-blue-600 border-0 shadow-none"
                            textClassName="text-white font-bold"
                        >
                            Accept Request
                        </Button>
                        <Button
                            onPress={() => { }}
                            className="h-14 rounded-full bg-red-500 border-0 shadow-none flex-0"
                            textClassName="text-white font-bold"
                            style={{ paddingHorizontal: 24 }}
                        >
                            Decline
                        </Button>
                    </View>

                </ScrollView>

                {/* Image Viewer Modal */}
                <Modal
                    visible={viewerVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setViewerVisible(false)}
                >
                    <View className="flex-1 bg-black justify-center items-center">
                        <SafeAreaView className="absolute top-0 left-0 right-0 z-10 p-6 flex-row justify-between items-center">
                            <Typography variant="body" weight="bold" color="white">{selectedImage?.label}</Typography>
                            <TouchableOpacity
                                onPress={() => setViewerVisible(false)}
                                className="bg-white/10 p-2 rounded-full"
                            >
                                <CloseCircle size={28} color="white" />
                            </TouchableOpacity>
                        </SafeAreaView>

                        {selectedImage?.uri && (
                            <Image
                                source={{ uri: selectedImage.uri }}
                                className="w-full h-full"
                                resizeMode="contain"
                            />
                        )}
                    </View>
                </Modal>
            </SafeAreaView>
        </View>
    );
}
