import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, Dimensions, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, Magicpen, Share, Refresh, TickCircle, Crown, Star1 } from 'iconsax-react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography } from '../../../components/ui/Typography';
import { IconButton } from '../../../components/ui/IconButton';
import { Button } from '../../../components/ui/Button';
import { useTheme } from '../../../contexts/ThemeContext';
import axiosInstance from '../../../lib/axios';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import Toast from 'react-native-toast-message';
import { VirtualTryOnIcon, SelectDesignIcon } from '../../../components/ui/CustomIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRevenueCat } from '../../../hooks/useRevenueCat';
import { SubscriptionModal } from '../../../components/SubscriptionModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CAROUSEL_IMAGES = [
    require('../../../assets/ai-lab/v-tryon.png'),
    require('../../../assets/ai-lab/v-tryon2.png'),
    require('../../../assets/ai-lab/v-tryon3.png'),
];

export default function VirtualTryOn() {
    const { isDark } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { isPro } = useRevenueCat();

    // Paywall Modal State
    const [isSubModalVisible, setIsSubModalVisible] = useState(false);
    const [activeSlide, setActiveSlide] = useState(0);

    // Endless Auto Fade Opacities
    const opacities = useRef([
        new Animated.Value(1),
        new Animated.Value(0),
        new Animated.Value(0),
    ]).current;

    // Auto Switch interval
    useEffect(() => {
        if (!isPro) {
            const interval = setInterval(() => {
                setActiveSlide((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [isPro]);

    // Animate fade transitions when activeSlide changes
    useEffect(() => {
        if (!isPro) {
            const animations = CAROUSEL_IMAGES.map((_, idx) => {
                return Animated.timing(opacities[idx], {
                    toValue: idx === activeSlide ? 1 : 0,
                    duration: 800,
                    useNativeDriver: true,
                });
            });
            Animated.parallel(animations).start();
        }
    }, [activeSlide, isPro]);

    // Try-on States
    const [personImage, setPersonImage] = useState<string | null>(null);
    const [garmentImage, setGarmentImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [resultImage, setResultImage] = useState<string | null>(null);

    const pickImage = async (type: 'person' | 'garment') => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled && result.assets[0].uri) {
            if (type === 'person') setPersonImage(result.assets[0].uri);
            else setGarmentImage(result.assets[0].uri);
        }
    };

    const handleGenerate = async () => {
        if (!personImage || !garmentImage) {
            Toast.show({
                type: 'error',
                text1: 'Images Required',
                text2: 'Please select both a person image and a garment image.',
            });
            return;
        }

        setIsLoading(true);
        try {
            const formData = new FormData();

            // @ts-ignore
            formData.append('personImage', {
                uri: personImage,
                name: 'person.jpg',
                type: 'image/jpeg',
            });

            // @ts-ignore
            formData.append('garmentImage', {
                uri: garmentImage,
                name: 'garment.jpg',
                type: 'image/jpeg',
            });

            const response = await axiosInstance.post('/ai/tryon', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success && response.data.result) {
                setResultImage(`data:image/jpeg;base64,${response.data.result}`);
            } else {
                throw new Error(response.data.error || 'Failed to generate try-on');
            }
        } catch (error: any) {
            console.error('Try-on error:', error);
            Alert.alert('Error', error.response?.data?.error || error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleShare = async () => {
        try {
            if (!resultImage) return;
            const isSharingAvailable = await Sharing.isAvailableAsync();
            if (!isSharingAvailable) {
                Alert.alert('Error', 'Sharing is not available on this device');
                return;
            }

            const base64Data = resultImage.split(',')[1];
            const filename = `${FileSystem.cacheDirectory}tryon_${Date.now()}.jpg`;
            await FileSystem.writeAsStringAsync(filename, base64Data, { encoding: 'base64' });
            await Sharing.shareAsync(filename, { mimeType: 'image/jpeg', dialogTitle: 'Share your try-on' });
        } catch (error: any) {
            console.error('Share error:', error);
            Alert.alert('Error', 'Failed to share image: ' + error.message);
        }
    };

    // --- RENDER INTRODUCTORY & PAYWALL VIEW FOR FREE USERS ---
    if (!isPro) {
        const IMAGE_WIDTH = SCREEN_WIDTH - 80;
        const IMAGE_HEIGHT = IMAGE_WIDTH * 1.02;

        return (
            <View className={`flex-1 ${isDark ? 'bg-zinc-950' : 'bg-white'}`}>
                {/* Header */}
                <View className={`px-4 pt-2 pb-2 flex-row items-center border-b ${isDark ? 'bg-zinc-950 border-white/5' : 'bg-white border-gray-100'}`}>
                    <IconButton
                        icon={<ArrowLeft size={22} color={isDark ? 'white' : 'black'} />}
                        onPress={() => router.back()}
                        variant="ghost"
                    />
                    <Typography variant="h3" weight="bold" className="ml-1">Virtual Try-on</Typography>
                </View>

                <ScrollView contentContainerClassName="p-6 pb-36" showsVerticalScrollIndicator={false}>
                    {/* Explanatory Typography */}
                    <Typography variant="h2" weight="black" className="mb-2 text-2xl text-left font-bold">Bring Designs to Life</Typography>
                    <Typography variant="body" color="gray" className="mb-8 text-left leading-6">
                        Render fabrics and patterns onto realistic model figures instantly with advanced AI.
                    </Typography>

                    {/* Visual Graphic Carousel Showcase Container */}
                    <View className="mb-8 items-center">
                        <View style={{ width: IMAGE_WIDTH, height: IMAGE_HEIGHT, position: 'relative' }}>
                            {CAROUSEL_IMAGES.map((img, idx) => (
                                <Animated.Image
                                    key={idx}
                                    source={img}
                                    style={{
                                        width: IMAGE_WIDTH,
                                        height: IMAGE_HEIGHT,
                                        borderRadius: 24,
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        opacity: opacities[idx],
                                    }}
                                    resizeMode="contain"
                                />
                            ))}
                        </View>

                        {/* Paging Indicators */}
                        <View className="flex-row gap-2 mt-4 justify-center">
                            {CAROUSEL_IMAGES.map((_, idx) => (
                                <View
                                    key={idx}
                                    className={`h-2 rounded-full ${idx === activeSlide ? 'w-6 bg-indigo-600' : 'w-2 bg-gray-300 dark:bg-zinc-800'}`}
                                />
                            ))}
                        </View>
                    </View>
                </ScrollView>

                {/* Fixed Paywall Button Footer */}
                <View
                    style={{ paddingBottom: Math.max(insets.bottom, 20), paddingHorizontal: 20 }}
                    className={`pt-4 ${isDark ? 'bg-zinc-950' : 'bg-white'}`}
                >
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setIsSubModalVisible(true)}
                        className="h-16 rounded-full bg-indigo-600 flex-row items-center justify-center"
                        style={{ elevation: 0, shadowOpacity: 0 }}
                    >
                        <Crown size={20} color="white" variant="Bold" />
                        <Typography color="white" className="ml-2 font-bold text-lg">Unlock with Pro</Typography>
                    </TouchableOpacity>
                </View>

                {/* Global Premium Subscription Modal */}
                <SubscriptionModal
                    visible={isSubModalVisible}
                    onClose={() => setIsSubModalVisible(false)}
                />
            </View>
        );
    }

    // --- RENDER ORIGINAL AI WORKSPACE FOR PRO MEMBERS ---
    return (
        <View className={`flex-1 ${isDark ? 'bg-zinc-950' : 'bg-gray-50'}`}>
            <View className={`px-4 pt-2 pb-2 flex-row items-center border-b ${isDark ? 'bg-zinc-950 border-white/5' : 'bg-white border-gray-100'}`}>
                <IconButton
                    icon={<ArrowLeft size={22} color={isDark ? 'white' : 'black'} />}
                    onPress={() => router.back()}
                    variant="ghost"
                />
                <Typography variant="h3" weight="bold" className="ml-1">Virtual Try-on</Typography>
                <View className="ml-3 px-2 py-0.5 bg-indigo-500 rounded-lg">
                    <Typography weight="bold" className="text-[9px] text-white">PRO</Typography>
                </View>
            </View>

            <ScrollView contentContainerClassName="p-5 pb-32" showsVerticalScrollIndicator={false}>
                {!resultImage ? (
                    <>
                        <Typography variant="body" color="gray" className="mb-6">
                            Upload a photo of a person and a garment to see how they look together.
                        </Typography>

                        <View className="gap-y-6 mb-8">
                            <View>
                                <Typography variant="caption" weight="bold" color="gray" className="mb-2 uppercase">Person Photo</Typography>
                                <TouchableOpacity
                                    onPress={() => pickImage('person')}
                                    className={`w-full aspect-[16/9] rounded-3xl items-center justify-center border-2 border-dashed ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} overflow-hidden`}
                                >
                                    {personImage ? (
                                        <Image source={{ uri: personImage }} className="w-full h-full" resizeMode="cover" />
                                    ) : (
                                        <>
                                            <VirtualTryOnIcon size={40} color={isDark ? '#ff8fa3' : '#FF5678'} />
                                            <Typography variant="small" color="gray" className="mt-2">Select Person</Typography>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>

                            <View>
                                <Typography variant="caption" weight="bold" color="gray" className="mb-2 uppercase">Garment Photo</Typography>
                                <TouchableOpacity
                                    onPress={() => pickImage('garment')}
                                    className={`w-full aspect-[16/9] rounded-3xl items-center justify-center border-2 border-dashed ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} overflow-hidden`}
                                >
                                    {garmentImage ? (
                                        <Image source={{ uri: garmentImage }} className="w-full h-full" resizeMode="cover" />
                                    ) : (
                                        <>
                                            <SelectDesignIcon size={40} color={isDark ? '#ff8fa3' : '#FF5678'} />
                                            <Typography variant="small" color="gray" className="mt-2">Select Design</Typography>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </>
                ) : (
                    <View className="items-center">
                        <Typography variant="h2" weight="bold" className="mb-2">Your Result</Typography>
                        <Typography variant="body" color="gray" className="mb-6 text-center">
                            AI has generated a preview of the person wearing the garment.
                        </Typography>

                        <View className={`w-full aspect-[16/9] rounded-[32px] overflow-hidden mb-8 ${isDark ? 'bg-zinc-900' : 'bg-white shadow-xl shadow-gray-200'}`}>
                            <Image source={{ uri: resultImage }} className="w-full h-full" resizeMode="cover" />
                        </View>

                        <View className="flex-row gap-4 w-full">
                            <TouchableOpacity
                                onPress={() => setResultImage(null)}
                                className={`flex-1 h-14 rounded-full flex-row items-center justify-center ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-100'}`}
                                style={{ elevation: 0, shadowOpacity: 0 }}
                            >
                                <Refresh size={20} color={isDark ? '#e4e4e7' : '#3f3f46'} />
                                <Typography className="ml-2 font-bold">Try Again</Typography>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleShare}
                                className="flex-1 h-14 rounded-full bg-indigo-600 flex-row items-center justify-center"
                                style={{ elevation: 0, shadowOpacity: 0 }}
                            >
                                <Share size={20} color="white" variant="Bold" />
                                <Typography color="white" className="ml-2 font-bold">Share Result</Typography>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>

            {!resultImage && (
                <View
                    style={{ paddingBottom: Math.max(insets.bottom, 20), paddingHorizontal: 20 }}
                    className={`pt-4 border-t ${isDark ? 'bg-zinc-950 border-white/5' : 'bg-white border-gray-100'}`}
                >
                    <Button
                        onPress={handleGenerate}
                        isLoading={isLoading}
                        className="h-16 rounded-full bg-indigo-600 border-0 shadow-none"
                        textClassName="text-white font-bold text-lg"
                        style={{ elevation: 0, shadowOpacity: 0 }}
                    >
                        Generate Try-on
                    </Button>
                </View>
            )}
        </View>
    );
}
