import React, { useState } from 'react';
import { View, ScrollView, Image, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, Magicpen, Share, Refresh, PenTool, Colorfilter, Setting4 } from 'iconsax-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Typography } from '../../../components/ui/Typography';
import { IconButton } from '../../../components/ui/IconButton';
import { Button } from '../../../components/ui/Button';
import { useTheme } from '../../../contexts/ThemeContext';
import axiosInstance from '../../../lib/axios';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SketchToDesign() {
    const { isDark } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [sketchImage, setSketchImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [resultImage, setResultImage] = useState<string | null>(null);

    // Options
    const [fabricType, setFabricType] = useState('');
    const [colorScheme, setColorScheme] = useState('');
    const [style, setStyle] = useState('');
    const [details, setDetails] = useState('');

    const pickSketch = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled && result.assets[0].uri) {
            setSketchImage(result.assets[0].uri);
        }
    };

    const handleGenerate = async () => {
        if (!sketchImage) {
            Toast.show({
                type: 'error',
                text1: 'Sketch Required',
                text2: 'Please upload a hand-drawn sketch first.',
            });
            return;
        }

        setIsLoading(true);
        try {
            const formData = new FormData();
            
            // @ts-ignore
            formData.append('sketchImage', {
                uri: sketchImage,
                name: 'sketch.jpg',
                type: 'image/jpeg',
            });

            if (fabricType) formData.append('fabricType', fabricType);
            if (colorScheme) formData.append('colorScheme', colorScheme);
            if (style) formData.append('style', style);
            if (details) formData.append('additionalDetails', details);

            const response = await axiosInstance.post('/ai/sketch-to-design', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success && response.data.result) {
                setResultImage(`data:image/jpeg;base64,${response.data.result}`);
            } else {
                throw new Error(response.data.error || 'Failed to convert sketch');
            }
        } catch (error: any) {
            console.error('Sketch error:', error);
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
            const filename = `${FileSystem.cacheDirectory}design_${Date.now()}.jpg`;
            await FileSystem.writeAsStringAsync(filename, base64Data, { encoding: 'base64' });
            await Sharing.shareAsync(filename, { mimeType: 'image/jpeg', dialogTitle: 'Share your design' });
        } catch (error: any) {
            console.error('Share error:', error);
            Alert.alert('Error', 'Failed to share image: ' + error.message);
        }
    };

    const inputClass = `px-5 py-4 rounded-2xl border ${isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-100 text-gray-900'} font-semibold text-[15px] mb-4`;

    return (
        <View className={`flex-1 ${isDark ? 'bg-zinc-950' : 'bg-gray-50'}`}>
            <View className={`px-4 pt-2 pb-2 flex-row items-center border-b ${isDark ? 'bg-zinc-950 border-white/5' : 'bg-white border-gray-100'}`}>
                <IconButton
                    icon={<ArrowLeft size={22} color={isDark ? 'white' : 'black'} />}
                    onPress={() => router.back()}
                    variant="ghost"
                />
                <Typography variant="h3" weight="bold" className="ml-1">Sketch to Design</Typography>
            </View>

            <ScrollView contentContainerClassName="p-5 pb-32" showsVerticalScrollIndicator={false}>
                {!resultImage ? (
                    <>
                        <Typography variant="body" color="gray" className="mb-6">
                            Convert your hand-drawn sketches into realistic fashion designs using AI.
                        </Typography>

                        <TouchableOpacity 
                            onPress={pickSketch}
                            className={`w-full aspect-[16/9] rounded-[32px] items-center justify-center border-2 border-dashed ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} overflow-hidden mb-8`}
                        >
                            {sketchImage ? (
                                <Image source={{ uri: sketchImage }} className="w-full h-full" resizeMode="cover" />
                            ) : (
                                <>
                                    <View className="w-20 h-20 rounded-full bg-amber-500/10 items-center justify-center mb-4">
                                        <PenTool size={40} color="#F59E0B" variant="Bulk" />
                                    </View>
                                    <Typography variant="h3" weight="bold">Upload Sketch</Typography>
                                    <Typography variant="small" color="gray" className="mt-1">Tap to select from gallery</Typography>
                                </>
                            )}
                        </TouchableOpacity>

                        <View className="gap-y-1">
                            <Typography variant="caption" weight="bold" color="gray" className="ml-1 mb-2 uppercase tracking-widest">Customization (Optional)</Typography>
                            
                            <View className="flex-row items-center mb-4">
                                <View className={`w-12 h-12 rounded-xl items-center justify-center mr-3 ${isDark ? 'bg-zinc-900' : 'bg-white'}`}>
                                    <Magicpen size={20} color="#FF5678" variant="Bulk" />
                                </View>
                                <TextInput 
                                    placeholder="Fabric Type (e.g. Silk, Ankara, Denim)" 
                                    value={fabricType} 
                                    onChangeText={setFabricType} 
                                    placeholderTextColor="#94a3b8"
                                    className={`flex-1 ${inputClass} mb-0`} 
                                />
                            </View>

                            <View className="flex-row items-center mb-4">
                                <View className={`w-12 h-12 rounded-xl items-center justify-center mr-3 ${isDark ? 'bg-zinc-900' : 'bg-white'}`}>
                                    <Colorfilter size={20} color="#10B981" variant="Bulk" />
                                </View>
                                <TextInput 
                                    placeholder="Color Scheme (e.g. Emerald & Gold)" 
                                    value={colorScheme} 
                                    onChangeText={setColorScheme} 
                                    placeholderTextColor="#94a3b8"
                                    className={`flex-1 ${inputClass} mb-0`} 
                                />
                            </View>

                            <View className="flex-row items-center mb-6">
                                <View className={`w-12 h-12 rounded-xl items-center justify-center mr-3 ${isDark ? 'bg-zinc-900' : 'bg-white'}`}>
                                    <Setting4 size={20} color="#F43F5E" variant="Bulk" />
                                </View>
                                <TextInput 
                                    placeholder="Style (e.g. Elegant Evening Gown)" 
                                    value={style} 
                                    onChangeText={setStyle} 
                                    placeholderTextColor="#94a3b8"
                                    className={`flex-1 ${inputClass} mb-0`} 
                                />
                            </View>
                        </View>
                    </>
                ) : (
                    <View className="items-center">
                        <Typography variant="h2" weight="bold" className="mb-2">Design Ready</Typography>
                        <Typography variant="body" color="gray" className="mb-6 text-center">
                            Your sketch has been transformed into a photorealistic design.
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
                                <Typography className="ml-2 font-bold">New Sketch</Typography>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                onPress={handleShare}
                                className="flex-1 h-14 rounded-2xl bg-amber-500 flex-row items-center justify-center"
                            >
                                <Share size={20} color="white" variant="Bold" />
                                <Typography color="white" className="ml-2 font-bold">Share Design</Typography>
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
                        className="h-16 rounded-3xl bg-amber-500 border-0 shadow-none"
                        textClassName="text-white font-bold text-lg"
                    >
                        Generate Design
                    </Button>
                </View>
            )}
        </View>
    );
}

