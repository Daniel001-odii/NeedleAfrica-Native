import React, { useState } from 'react';
import { View, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, Magicpen, Share, Refresh } from 'iconsax-react-native';
import * as ImagePicker from 'expo-image-picker';
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

export default function VirtualTryOn() {
    const { isDark } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
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

    return (
        <View className={`flex-1 ${isDark ? 'bg-zinc-950' : 'bg-gray-50'}`}>
            <View className={`px-4 pt-2 pb-2 flex-row items-center border-b ${isDark ? 'bg-zinc-950 border-white/5' : 'bg-white border-gray-100'}`}>
                <IconButton
                    icon={<ArrowLeft size={22} color={isDark ? 'white' : 'black'} />}
                    onPress={() => router.back()}
                    variant="ghost"
                />
                <Typography variant="h3" weight="bold" className="ml-1">Virtual Try-on</Typography>
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
                                className={`flex-1 h-14 rounded-2xl flex-row items-center justify-center ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-100'}`}
                            >
                                <Refresh size={20} color={isDark ? '#e4e4e7' : '#3f3f46'} />
                                <Typography className="ml-2 font-bold">Try Again</Typography>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleShare}
                                className="flex-1 h-14 rounded-2xl bg-indigo-600 flex-row items-center justify-center"
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
                        className="h-16 rounded-3xl bg-indigo-600 border-0 shadow-none"
                        textClassName="text-white font-bold text-lg"
                    >
                        Generate Try-on
                    </Button>
                </View>
            )}
        </View>
    );
}

