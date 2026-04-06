import React, { useState, useEffect } from 'react';
import { View, ScrollView, Image, TouchableOpacity, Pressable, Platform, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Add, Gallery, Setting4, Magicpen, CloudAdd, ArchiveTick, Trash, Edit2, ShoppingBag, CloseCircle, Camera } from 'iconsax-react-native';
import { Typography } from '../../../components/ui/Typography';
import { IconButton } from '../../../components/ui/IconButton';
import { Button } from '../../../components/ui/Button';
import { useTheme } from '../../../contexts/ThemeContext';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';

export default function CatalogGallery() {
    const { isDark } = useTheme();
    const router = useRouter();
    
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [catalogViews, setCatalogViews] = useState(0);
    const [catalogId, setCatalogId] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { default: axiosInstance } = await import('../../../lib/axios');
            const itemsRes = await axiosInstance.get('/catalog/items');
            setItems(itemsRes.data || []);
            const catalogRes = await axiosInstance.get('/catalog');
            if (catalogRes.data && catalogRes.data.id) {
                setCatalogId(catalogRes.data.id);
                setCatalogViews(catalogRes.data.views || 0);
            } else {
                setCatalogId(null);
            }
        } catch (error) {
            console.log('Error fetching catalog data', error);
            setCatalogId(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePickImages = async () => {
        if (images.length >= 1) {
            Toast.show({ type: 'info', text1: 'Limit Reached', text2: 'You can select only 1 image per style for now.' });
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, aspect: [4, 5], quality: 0.8, base64: true
        });
        if (!result.canceled && result.assets[0].base64) {
            const extension = result.assets[0].uri.split('.').pop()?.toLowerCase() || 'jpg';
            const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
            const dataUrl = `data:${mimeType};base64,${result.assets[0].base64}`;
            setImages([...images, dataUrl]);
        }
    };

    const handleUploadItem = async () => {
        if (!catalogId) {
            Toast.show({ type: 'error', text1: 'Action Denied', text2: 'Initialize your storefront settings first.' });
            return;
        }
        if (!name || images.length === 0) {
            Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Name and at least 1 image are required.' });
            return;
        }
        setIsSaving(true);
        try {
            const { default: axiosInstance } = await import('../../../lib/axios');
            await axiosInstance.post('/catalog/items', {
                name,
                price,
                description,
                images
            });
            Toast.show({ type: 'success', text1: 'Success', text2: 'Style uploaded successfully' });
            setShowUploadModal(false);
            resetForm();
            fetchData();
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Upload Error', text2: error.response?.data?.error || error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteItem = async (id: string) => {
        try {
             const { default: axiosInstance } = await import('../../../lib/axios');
             await axiosInstance.delete(`/catalog/items/${id}`);
             setItems(items.filter(i => i.id !== id));
        } catch(error) {
            Toast.show({ type: 'error', text1: 'Delete Error' });
        }
    };

    const resetForm = () => {
        setName('');
        setPrice('');
        setDescription('');
        setImages([]);
    };

    const cardBaseStyle = isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-100 shadow-sm shadow-gray-100/50';
    const inputClass = `px-4 py-3 rounded-2xl border ${isDark ? 'bg-zinc-800/50 border-zinc-800 text-white' : 'bg-gray-50 border-gray-100 text-gray-900'} font-semibold text-[15px] mb-4`;

    return (
        <View className={`flex-1 ${isDark ? 'bg-zinc-950' : 'bg-gray-50'}`}>
            {/* Header */}
            <View className={`px-4 pt-2 pb-2 flex-row items-center justify-between ${isDark ? 'bg-zinc-950 border-b border-white/5' : 'bg-white border-b border-gray-50'}`}>
                <View className="flex-row items-center">
                    <IconButton
                        icon={<ArrowLeft size={22} color={isDark ? 'white' : 'black'} />}
                        onPress={() => router.back()}
                        variant="ghost"
                    />
                    <Typography variant="h3" weight="bold" className="ml-1">Catalog Gallery</Typography>
                </View>
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => router.push('/(tabs)/profile/catalog' as any)} className="px-2">
                        <Typography color="primary" weight="bold" className="text-[13px]">Settings</Typography>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Disclaimer for Missing Storefront */}
            {!isLoading && !catalogId && (
                <View className="px-5 pt-4">
                    <Pressable 
                        onPress={() => router.push('/(tabs)/profile/catalog' as any)}
                        className={`flex-row items-center p-4 rounded-[20px] ${isDark ? 'bg-amber-900/20 border border-amber-900/30' : 'bg-amber-50 border border-amber-100'}`}
                    >
                        <Magicpen size={24} color="#D97706" variant="Bulk" className="mr-3" />
                        <View className="flex-1">
                            <Typography weight="bold" className="text-amber-700 dark:text-amber-500 text-[14px]">Initialize Storefront Required</Typography>
                            <Typography variant="small" className="text-amber-600/80 dark:text-amber-500/80">Setup your storefront profile before uploading styles.</Typography>
                        </View>
                        <Setting4 size={20} color="#D97706" variant="Linear" />
                    </Pressable>
                </View>
            )}

            <ScrollView contentContainerClassName="p-5 pb-24" showsVerticalScrollIndicator={false}>
                
                {/* Dashboard Stats (Lite) */}
                <View className="flex-row gap-4 mb-8">
                    <View className={`flex-1 p-4 rounded-[24px] ${cardBaseStyle}`}>
                        <Typography variant="caption" color="gray" weight="bold" className="uppercase text-[10px] mb-1">Total Items</Typography>
                        <Typography variant="h2" weight="bold">{items.length}</Typography>
                    </View>
                    <View className={`flex-1 p-4 rounded-[24px] ${cardBaseStyle}`}>
                        <Typography variant="caption" color="gray" weight="bold" className="uppercase text-[10px] mb-1">Live Views</Typography>
                        <Typography variant="h2" weight="bold">{catalogViews}</Typography>
                    </View>
                </View>

                {isLoading ? (
                     <ActivityIndicator color="#3b82f6" />
                ) : (
                items.length > 0 ? (
                    <View>
                        <View className="flex-row items-center justify-between mb-4 px-1">
                            <Typography variant="caption" color="gray" weight="bold" className="uppercase tracking-wider text-[11px]">
                                Published Styles
                            </Typography>
                        </View>

                        {/* Tabular View (List) */}
                        <View className={`rounded-[28px] overflow-hidden ${cardBaseStyle}`}>
                            {items.map((item, index) => (
                                <View 
                                    key={item.id} 
                                    className={`flex-row items-center p-4 ${index !== items.length - 1 ? 'border-b border-gray-50 dark:border-white/5' : ''}`}
                                >
                                    <View className={`w-14 h-14 rounded-2xl overflow-hidden mr-4 ${isDark ? 'bg-zinc-800' : 'bg-gray-100'} items-center justify-center`}>
                                        {item.images?.[0] ? <Image source={{uri: item.images[0]}} className="w-full h-full" /> : <Gallery size={24} color={isDark ? '#52525b' : '#d1d5db'} variant="Bulk" />}
                                    </View>
                                    <View className="flex-1">
                                        <Typography weight="bold" className="text-[15px] mb-0.5">{item.name}</Typography>
                                        <View className="flex-row items-center">
                                            {item.price && <Typography variant="small" weight="bold" color="primary" className="mr-3">{item.currency} {item.price}</Typography>}
                                            <View className="bg-green-500/10 px-2 rounded-md">
                                                <Typography className="text-[10px] text-green-600 font-bold uppercase">{item.status}</Typography>
                                            </View>
                                        </View>
                                    </View>
                                    <View className="flex-row gap-2">
                                        <TouchableOpacity onPress={() => handleDeleteItem(item.id)} className={`p-2 rounded-full ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                            <Trash size={16} color="#EF4444" variant="Bulk" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>

                    </View>
                ) : (
                    <EmptyState onUpload={() => catalogId ? setShowUploadModal(true) : router.push('/(tabs)/profile/catalog' as any)} onReset={() => {}} isDark={isDark} />
                ) )}
            </ScrollView>

            {/* Floating Action Button (FAB) for Upload - Disabled if no catalog */}
            <TouchableOpacity 
                activeOpacity={catalogId ? 0.8 : 0.5}
                onPress={() => catalogId ? setShowUploadModal(true) : Toast.show({ type: 'info', text1: 'Action Required', text2: 'Setup Storefront Settings first' })}
                className={`absolute bottom-8 right-6 w-16 h-16 rounded-full items-center justify-center shadow-lg z-50 ${catalogId ? 'bg-blue-600 shadow-blue-500/50' : 'bg-gray-400 opacity-50 shadow-black/20'}`}
            >
                <Add size={32} color="white" variant="Linear" />
            </TouchableOpacity>

            {/* Upload Modal */}
            <Modal visible={showUploadModal} transparent animationType="slide">
                <View className="flex-1 bg-black/60 justify-end">
                    <View className={`rounded-t-[32px] p-6 pt-8 ${isDark ? 'bg-[#1C1C1E]' : 'bg-[#F2F2F7]'} h-[85%]`}>
                        <View className="flex-row justify-between items-center mb-6">
                            <Typography variant="h2" weight="bold">Add New Style</Typography>
                            <TouchableOpacity onPress={() => { setShowUploadModal(false); resetForm(); }}>
                                <CloseCircle size={28} color="#6B7280" variant="Bold" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <TextInput placeholder="Style Name" value={name} onChangeText={setName} className={inputClass} />
                            <TextInput placeholder="Price Amount" value={price} onChangeText={setPrice} keyboardType="numeric" className={inputClass} />
                            <TextInput placeholder="Description (Optional)" value={description} onChangeText={setDescription} multiline className={`${inputClass} min-h-[100px] text-left pt-4`} />
                            <Typography variant="small" weight="bold" color="gray" className="mb-2 uppercase">Images ({images.length}/1)</Typography>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6 h-28">
                                {images.map((img, i) => (
                                    <Image key={i} source={{uri: img}} className="h-28 w-24 rounded-2xl mr-3" />
                                ))}
                                {images.length < 1 && (
                                    <TouchableOpacity onPress={handlePickImages} className={`h-28 w-24 rounded-2xl items-center justify-center border-2 border-dashed ${isDark ? 'border-gray-700 bg-zinc-800' : 'border-gray-300 bg-gray-100'}`}>
                                        <Camera size={24} color="#9CA3AF" />
                                        <Typography variant="small" color="gray" className="mt-1 text-[10px]">Add Photo</Typography>
                                    </TouchableOpacity>
                                )}
                            </ScrollView>
                            
                            <Button onPress={handleUploadItem} isLoading={isSaving} className="h-16 rounded-full bg-blue-600 border-0 mb-8" textClassName="text-white text-[16px] font-bold">
                                Upload Style
                            </Button>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// ----------------------------------------------------------------------
// Specialized Empty State Component
// ----------------------------------------------------------------------

function EmptyState({ onUpload, onReset, isDark }: { onUpload: () => void, onReset: () => void, isDark: boolean }) {
    return (
        <View className="items-center justify-center py-10 px-6">
            <View className={`w-32 h-32 rounded-full items-center justify-center mb-8 ${isDark ? 'bg-zinc-900' : 'bg-white shadow-xl shadow-gray-200'}`}>
                <ShoppingBag size={64} color="#3b82f6" variant="Bulk" opacity={0.8} />
                <View className="absolute -bottom-1 -right-1 bg-blue-600 p-2 rounded-full border-4 border-gray-50 dark:border-zinc-950">
                    <CloudAdd size={20} color="white" />
                </View>
            </View>

            <Typography variant="h2" weight="bold" className="mb-3 text-center">Your Gallery is Empty</Typography>
            <Typography variant="body" color="gray" className="text-center mb-10 px-4 leading-6">
                Start building your digital showroom! Upload your best designs to reach more clients and showcase them in your catalog.
            </Typography>

            <Button 
                onPress={onUpload}
                className="w-full h-16 rounded-full bg-blue-600 border-0 mb-4"
                textClassName="text-white text-[16px] font-bold"
            >
                <Add size={20} color="white" className="mr-2" />
                <Typography color="white" weight="bold" className="text-[16px]">Upload First Style</Typography>
            </Button>

            <TouchableOpacity onPress={onReset} className="py-2">
                <Typography color="primary" weight="bold" className="text-[14px]">View Sample Gallery</Typography>
            </TouchableOpacity>
        </View>
    );
}
