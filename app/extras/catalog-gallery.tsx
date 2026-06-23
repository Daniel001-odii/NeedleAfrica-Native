import React, { useState, useEffect, useCallback } from 'react';
import { View, Image, TouchableOpacity, Pressable, Platform, Modal, TextInput, ActivityIndicator, Linking, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Add, Gallery, Setting4, Magicpen, CloudAdd, ArchiveTick, Trash, Edit2, ShoppingBag, CloseCircle, Camera, ArrowRight, Eye, Refresh2, Share, Crown1, Menu } from 'iconsax-react-native';
import { Typography } from '../../components/ui/Typography';
import { IconButton } from '../../components/ui/IconButton';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path } from 'react-native-svg';
import { WebView } from 'react-native-webview';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';

export default function CatalogGallery() {
    const { isDark } = useTheme();
    const { user } = useAuth();
    const router = useRouter();

    const [items, setItems] = useState<any[]>([]);
    const isFreemium = !user?.subscriptionPlan || user.subscriptionPlan === 'FREE';
    const FREEMIUM_LIMIT = 3;
    const [isLoading, setIsLoading] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingItem, setDeletingItem] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [catalogViews, setCatalogViews] = useState(0);
    const [catalogId, setCatalogId] = useState<string | null>(null);
    const insets = useSafeAreaInsets();

    const [showWebView, setShowWebView] = useState(false);
    const [webViewLoading, setWebViewLoading] = useState(true);
    const [webViewKey, setWebViewKey] = useState(0);
    const [webViewUrl, setWebViewUrl] = useState('');

    const handleOpenOwnStorefront = () => {
        if (!catalogId) return;
        setWebViewUrl(`https://catalog.needleafrica.com/cg/${catalogId}`);
        setShowWebView(true);
    };

    const handleOpenSampleStorefront = () => {
        setWebViewUrl('https://catalog.needleafrica.com/cg/cmnn5zgkr0001js04pmveqepo');
        setShowWebView(true);
    };

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
            const { default: axiosInstance } = await import('../../lib/axios');
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
            const { default: axiosInstance } = await import('../../lib/axios');
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

    const handleOpenEditItem = (item: any) => {
        setEditingItem(item);
        setName(item.name || '');
        setPrice(item.price ? String(item.price) : '');
        setDescription(item.description || '');
        setImages(item.images || []);
        setShowEditModal(true);
    };

    const handleUpdateItem = async () => {
        if (!editingItem) return;
        if (!name || images.length === 0) {
            Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Name and at least 1 image are required.' });
            return;
        }
        setIsSaving(true);
        try {
            const { default: axiosInstance } = await import('../../lib/axios');
            await axiosInstance.patch(`/catalog/items/${editingItem.id}`, {
                name,
                price,
                description,
                images
            });
            Toast.show({ type: 'success', text1: 'Success', text2: 'Item updated successfully' });
            setShowEditModal(false);
            setEditingItem(null);
            resetForm();
            fetchData();
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Update Error', text2: error.response?.data?.error || error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeletePrompt = (item: any) => {
        setDeletingItem(item);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingItem) return;
        setIsDeleting(true);
        try {
            const { default: axiosInstance } = await import('../../lib/axios');
            await axiosInstance.delete(`/catalog/items/${deletingItem.id}`);
            setItems(items.filter(i => i.id !== deletingItem.id));
            setShowDeleteModal(false);
            setDeletingItem(null);
            Toast.show({ type: 'success', text1: 'Deleted', text2: `${deletingItem.name} has been removed.` });
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Delete Error' });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDragEnd = useCallback(async ({ data }: { data: any[] }) => {
        // Optimistically update local state
        setItems(data);

        // Persist the new order to the backend
        try {
            const { default: axiosInstance } = await import('../../lib/axios');
            const orderedIds = data.map((item: any) => item.id);
            await axiosInstance.put('/catalog/items/reorder', { orderedIds });
        } catch (error: any) {
            console.error('Reorder error:', error);
            Toast.show({ type: 'error', text1: 'Reorder Failed', text2: 'Could not save the new order. Please try again.' });
            // Re-fetch to restore correct order
            fetchData();
        }
    }, []);

    const resetForm = () => {
        setName('');
        setPrice('');
        setDescription('');
        setImages([]);
    };

    const cardBaseStyle = isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-100 shadow-sm shadow-gray-100/50';
    const inputClass = `px-4 py-3 rounded-2xl border ${isDark ? 'bg-zinc-800/50 border-zinc-800 text-white' : 'bg-gray-50 border-gray-100 text-gray-900'} font-semibold text-[15px] mb-4`;

    const renderItem = useCallback(({ item, drag, isActive, getIndex }: RenderItemParams<any>) => {
        const index = getIndex() ?? 0;
        const isBeyondFreemiumLimit = isFreemium && index >= FREEMIUM_LIMIT;
        return (
            <ScaleDecorator>
                <TouchableOpacity
                    activeOpacity={0.6}
                    onPress={() => handleOpenEditItem(item)}
                    className={`flex-row items-center p-4 ${index !== items.length - 1 ? 'border-b border-gray-50 dark:border-white/5' : ''}`}
                    style={{ opacity: isBeyondFreemiumLimit ? 0.35 : 1, backgroundColor: isActive ? (isDark ? '#27272a' : '#f4f4f5') : 'transparent' }}
                >
                    {/* Drag Handle */}
                    <TouchableOpacity
                        onLongPress={drag}
                        delayLongPress={100}
                        className="mr-3 p-1"
                        activeOpacity={0.6}
                    >
                        <Menu size={20} color={isDark ? '#71717a' : '#a1a1aa'} variant="Bold" />
                    </TouchableOpacity>

                    <View className={`w-14 h-14 rounded-2xl overflow-hidden mr-4 ${isDark ? 'bg-zinc-800' : 'bg-gray-100'} items-center justify-center`}>
                        {item.images?.[0] ? <Image source={{ uri: item.images[0] }} className="w-full h-full" /> : <Gallery size={24} color={isDark ? '#52525b' : '#d1d5db'} variant="Bulk" />}
                    </View>
                    <View className="flex-1">
                        <Typography weight="bold" className="text-[15px] mb-0.5">{item.name}</Typography>
                        <View className="flex-row items-center">
                            {item.price && <Typography variant="small" weight="bold" color="primary" className="mr-3">{item.currency} {item.price}</Typography>}
                            <View className="flex-row items-center mr-3">
                                <Eye size={12} color="#9CA3AF" variant="Linear" />
                                <Typography variant="small" color="gray" className="ml-1 text-[11px]">{item.views ?? 0}</Typography>
                            </View>
                            <View className="bg-green-500/10 px-2 rounded-md">
                                <Typography className="text-[10px] text-green-600 font-bold uppercase">{item.status}</Typography>
                            </View>
                        </View>
                    </View>
                    <View className="flex-row gap-2">
                        <TouchableOpacity onPress={() => handleDeletePrompt(item)} className={`p-2 rounded-full ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                            <Trash size={16} color="#EF4444" variant="Bulk" />
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </ScaleDecorator>
        );
    }, [isDark, isFreemium, items.length]);

    const ListFooterComponent = useCallback(() => {
        if (isFreemium && items.length > FREEMIUM_LIMIT) {
            return (
                <View
                    className="mt-4 p-4 rounded-2xl items-center"
                    style={{
                        backgroundColor: isDark ? '#1C1C1E' : '#FFF7ED',
                        borderWidth: 1,
                        borderColor: isDark ? '#FDB02233' : '#FDB022',
                    }}
                >
                    <View className="flex-row items-center mb-2">
                        <Crown1 size={18} color="#FDB022" variant="Bold" style={{ marginRight: 6 }} />
                        <Typography weight="bold" className="text-[13px]" style={{ color: '#FDB022' }}>
                            Freemium Limit
                        </Typography>
                    </View>
                    <Typography variant="small" color="gray" className="text-center text-[12px] mb-3 leading-[18px]">
                        Only your first {FREEMIUM_LIMIT} items are visible on your catalog website. Upgrade to Pro to showcase all {items.length} items.
                    </Typography>
                    <TouchableOpacity
                        onPress={() => router.push('/(tabs)/profile/subscription' as any)}
                        activeOpacity={0.8}
                        style={{
                            backgroundColor: '#FDB022',
                            paddingHorizontal: 24,
                            paddingVertical: 10,
                            borderRadius: 20,
                        }}
                    >
                        <Typography weight="bold" color="white" className="text-[13px]">Upgrade to Pro</Typography>
                    </TouchableOpacity>
                </View>
            );
        }
        return null;
    }, [isFreemium, items.length, isDark]);

    return (
        <SafeAreaView className={`flex-1 ${isDark ? 'bg-black' : 'bg-white'}`} edges={['top']}>
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

            {isLoading ? (
                <View className="flex-1 items-center justify-center pb-32">
                    <ActivityIndicator color="#3b82f6" />
                </View>
            ) : items.length > 0 ? (
                <View className="flex-1 px-5 pb-24">
                    {/* Dashboard Stats */}
                    <View className="flex-row gap-4 mb-8">
                        <View className={`flex-1 p-4 rounded-[24px] ${cardBaseStyle}`}>
                            <Typography variant="caption" color="gray" weight="bold" className="uppercase text-[10px] mb-1">Total Items</Typography>
                            <Typography variant="h2" weight="bold">{items.length}</Typography>
                        </View>
                        <View className={`flex-1 p-4 rounded-[24px] ${cardBaseStyle}`}>
                            <Typography variant="caption" color="gray" weight="bold" className="uppercase text-[10px] mb-1">Catalog Views</Typography>
                            <Typography variant="h2" weight="bold">{catalogViews}</Typography>
                        </View>
                    </View>

                    <View className="flex-row items-center justify-between mb-4 px-1">
                        <Typography variant="caption" color="gray" weight="bold" className="uppercase tracking-wider text-[11px]">
                            Published Styles
                        </Typography>
                        <Typography variant="small" color="gray" className="text-[10px]">
                            Hold & drag to reorder
                        </Typography>
                    </View>

                    <View className={`rounded-[28px] overflow-hidden ${cardBaseStyle}`}>
                        <DraggableFlatList
                            data={items}
                            onDragEnd={handleDragEnd}
                            keyExtractor={(item) => item.id}
                            renderItem={renderItem}
                            scrollEnabled={true}
                            ListFooterComponent={ListFooterComponent}
                        />
                    </View>
                </View>
            ) : (
                <View className="flex-1 justify-center p-8 pb-32">
                    <EmptyState
                        onUpload={() => catalogId ? setShowUploadModal(true) : router.push('/(tabs)/profile/catalog' as any)}
                        onViewSample={handleOpenSampleStorefront}
                        isDark={isDark}
                        isCatalogSetup={!!catalogId}
                    />
                </View>
            )}

            {/* Floating Action Button (FAB) for Upload - Disabled if no catalog */}
            {catalogId && (
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setShowUploadModal(true)}
                    className="w-16 h-16 rounded-full items-center justify-center z-50 bg-blue-600"
                    style={{
                        position: 'absolute',
                        right: 20,
                        bottom: insets.bottom + 20,
                    }}
                >
                    <Add size={32} color="white" variant="Linear" />
                </TouchableOpacity>
            )}

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
                                    <Image key={i} source={{ uri: img }} className="h-28 w-24 rounded-2xl mr-3" />
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

            {/* Edit Modal */}
            <Modal visible={showEditModal} transparent animationType="slide">
                <View className="flex-1 bg-black/60 justify-end">
                    <View className={`rounded-t-[32px] p-6 pt-8 ${isDark ? 'bg-[#1C1C1E]' : 'bg-[#F2F2F7]'} h-[85%]`}>
                        <View className="flex-row justify-between items-center mb-6">
                            <Typography variant="h2" weight="bold">Edit Style</Typography>
                            <TouchableOpacity onPress={() => { setShowEditModal(false); setEditingItem(null); resetForm(); }}>
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
                                    <Image key={i} source={{ uri: img }} className="h-28 w-24 rounded-2xl mr-3" />
                                ))}
                                {images.length < 1 && (
                                    <TouchableOpacity onPress={handlePickImages} className={`h-28 w-24 rounded-2xl items-center justify-center border-2 border-dashed ${isDark ? 'border-gray-700 bg-zinc-800' : 'border-gray-300 bg-gray-100'}`}>
                                        <Camera size={24} color="#9CA3AF" />
                                        <Typography variant="small" color="gray" className="mt-1 text-[10px]">Add Photo</Typography>
                                    </TouchableOpacity>
                                )}
                            </ScrollView>

                            <Button onPress={handleUpdateItem} isLoading={isSaving} className="h-16 rounded-full bg-blue-600 border-0 mb-8" textClassName="text-white text-[16px] font-bold">
                                Update Style
                            </Button>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* DELETE CONFIRMATION MODAL (bottom sheet) */}
            <Modal visible={showDeleteModal} transparent animationType="slide">
                <View className="flex-1 bg-black/60 justify-end p-2 pb-8">
                    <View className={`rounded-[32px] p-6 pt-8 ${isDark ? 'bg-[#1C1C1E]' : 'bg-[#F2F2F7]'}`}>
                        <View className="items-center mb-6 mt-2">
                            <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${isDark ? 'bg-red-500/20' : 'bg-red-50'}`}>
                                <Trash size={28} color="#EF4444" variant="Bulk" />
                            </View>
                            <Typography variant="h3" weight="bold" className="text-center mb-2">
                                Delete Style?
                            </Typography>
                            <Typography variant="body" color="gray" className="text-center text-[14px] leading-[20px] px-2">
                                Are you sure you want to delete "{deletingItem?.name}"? This action cannot be undone.
                            </Typography>
                        </View>
                        <View className="flex-row gap-3 mt-4">
                            <TouchableOpacity
                                onPress={() => { setShowDeleteModal(false); setDeletingItem(null); }}
                                className={`flex-1 h-14 rounded-full items-center justify-center border ${isDark ? 'border-zinc-700 bg-zinc-800' : 'border-gray-200 bg-gray-50'}`}
                                disabled={isDeleting}
                            >
                                <Typography weight="bold" className="text-[15px]">Cancel</Typography>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleConfirmDelete}
                                className="flex-1 h-14 rounded-full items-center justify-center bg-red-500"
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Typography weight="bold" color="white" className="text-[15px]">Delete</Typography>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* LIVE PREVIEW MODAL */}
            <Modal
                visible={showWebView}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowWebView(false)}
            >
                <SafeAreaView className={`flex-1 ${isDark ? 'bg-zinc-950' : 'bg-white'}`} edges={['top']}>
                    <View className={`px-4 py-3 flex-row items-center justify-between border-b ${isDark ? 'bg-zinc-950 border-white/10' : 'bg-white border-gray-100'}`}>
                        <View className="flex-row items-center">
                            <IconButton
                                icon={<CloseCircle size={24} color={isDark ? 'white' : 'black'} />}
                                onPress={() => setShowWebView(false)}
                                variant="ghost"
                            />
                            <Typography variant="h3" weight="bold" className="ml-2">Live Storefront</Typography>
                        </View>
                        <View className="flex-row items-center">
                            <IconButton
                                icon={<Refresh2 size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />}
                                onPress={() => {
                                    setWebViewLoading(true);
                                    setWebViewKey(prev => prev + 1);
                                }}
                                variant="ghost"
                            />
                        </View>
                    </View>

                    <View className="flex-1 relative">
                        <WebView
                            key={webViewKey}
                            source={{ uri: webViewUrl }}
                            style={{ flex: 1, backgroundColor: isDark ? '#09090b' : '#ffffff' }}
                            onLoadStart={() => setWebViewLoading(true)}
                            onLoadEnd={() => setWebViewLoading(false)}
                            javaScriptEnabled={true}
                            domStorageEnabled={true}
                            startInLoadingState={true}
                            originWhitelist={['*']}
                        />
                        {webViewLoading && (
                            <View className="absolute inset-0 items-center justify-center bg-white/50 dark:bg-black/50">
                                <ActivityIndicator size="large" color="#2563EB" />
                            </View>
                        )}
                    </View>
                </SafeAreaView>
            </Modal>

            {/* FLOATING EYE BUTTON */}
            {catalogId && (
                <TouchableOpacity
                    onPress={handleOpenOwnStorefront}
                    activeOpacity={0.8}
                    style={{
                        position: 'absolute',
                        right: 20,
                        bottom: insets.bottom + 100, // Positioned above the Add FAB
                        backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 999,
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                    }}
                >
                    <Eye size={28} color="#2563EB" variant="Bulk" />
                </TouchableOpacity>
            )}
        </SafeAreaView>
    );
}

// ----------------------------------------------------------------------
// Specialized Empty State Component
// ----------------------------------------------------------------------

function EmptyState({ onUpload, onViewSample, isDark, isCatalogSetup }: { onUpload: () => void, onViewSample: () => void, isDark: boolean, isCatalogSetup: boolean }) {
    return (
        <View className="items-center justify-center px-4">
            <Image
                source={require('../../assets/illustrations/gallery.png')}
                style={{ width: 220, height: 220, marginBottom: 28 }}
                resizeMode="contain"
            />

            <Typography variant="h2" weight="bold" className="mb-3 text-center text-[22px] leading-8">
                {isCatalogSetup ? "Your Gallery is Empty" : "Setup Digital Storefront"}
            </Typography>

            <Typography variant="body" color="gray" className="text-center mb-8 px-2 text-[14px] leading-[22px]">
                {isCatalogSetup
                    ? "Start building your digital showroom! Upload your best designs to reach more clients and showcase them in your catalog."
                    : "Create your professional storefront in seconds. Share your gallery link and easily take orders directly from your clients."}
            </Typography>

            <Button
                onPress={onUpload}
                className="w-full h-16 rounded-full bg-blue-600 border-0 mb-6"
                textClassName="text-white text-[16px] font-bold"
            >
                {isCatalogSetup ? <Add size={20} color="white" className="mr-2" /> : <Setting4 size={20} color="white" className="mr-2" />}
                <Typography color="white" weight="bold" className="text-[16px]">
                    {isCatalogSetup ? "Upload First Style" : "Activate Storefront"}
                </Typography>
            </Button>
        </View>
    );
}
