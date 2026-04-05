import React, { useState } from 'react';
import { View, ScrollView, Image, TouchableOpacity, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Add, Gallery, Setting4, Magicpen, CloudAdd, ArchiveTick, Trash, Edit2, ShoppingBag } from 'iconsax-react-native';
import { Typography } from '../../../components/ui/Typography';
import { IconButton } from '../../../components/ui/IconButton';
import { Button } from '../../../components/ui/Button';
import { useTheme } from '../../../contexts/ThemeContext';
import Toast from 'react-native-toast-message';

// Dummy data for tabular view
const CATALOG_ITEMS = [
    { id: '1', name: 'Classic Senator Suit', price: '₦25,000', sales: 12, status: 'Active' },
    { id: '2', name: 'Agbada Royale (3pc)', price: '₦145,000', sales: 4, status: 'Active' },
    { id: '3', name: 'Ankara Office Wear', price: '₦15,000', sales: 28, status: 'Active' },
];

export default function CatalogGallery() {
    const { isDark } = useTheme();
    const router = useRouter();
    
    // Toggle state just for demonstration of empty state vs list
    const [hasItems, setHasItems] = useState(true);

    const handleUpload = () => {
        Toast.show({
            type: 'info',
            text1: 'Feature Coming Soon',
            text2: 'Image selection and cloud sync will be ready in the next update.'
        });
    };

    const cardBaseStyle = isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-100 shadow-sm shadow-gray-100/50';

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
                    <Typography variant="h3" weight="bold" className="ml-1">Online Style Hub</Typography>
                </View>
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => router.push('/(tabs)/profile/catalog' as any)} className="px-2">
                        <Typography color="primary" weight="bold" className="text-[13px]">Settings</Typography>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerClassName="p-5 pb-24" showsVerticalScrollIndicator={false}>
                
                {/* Dashboard Stats (Lite) */}
                <View className="flex-row gap-4 mb-8">
                    <View className={`flex-1 p-4 rounded-[24px] ${cardBaseStyle}`}>
                        <Typography variant="caption" color="gray" weight="bold" className="uppercase text-[10px] mb-1">Total Items</Typography>
                        <Typography variant="h2" weight="bold">14</Typography>
                    </View>
                    <View className={`flex-1 p-4 rounded-[24px] ${cardBaseStyle}`}>
                        <Typography variant="caption" color="gray" weight="bold" className="uppercase text-[10px] mb-1">Live Views</Typography>
                        <Typography variant="h2" weight="bold">1.2k</Typography>
                    </View>
                </View>

                {hasItems ? (
                    <View>
                        <View className="flex-row items-center justify-between mb-4 px-1">
                            <Typography variant="caption" color="gray" weight="bold" className="uppercase tracking-wider text-[11px]">
                                Published Styles
                            </Typography>
                            <TouchableOpacity onPress={() => setHasItems(false)}>
                                <Typography variant="small" color="primary" weight="bold">Show Empty State Demo</Typography>
                            </TouchableOpacity>
                        </View>

                        {/* Tabular View (List) */}
                        <View className={`rounded-[28px] overflow-hidden ${cardBaseStyle}`}>
                            {CATALOG_ITEMS.map((item, index) => (
                                <View 
                                    key={item.id} 
                                    className={`flex-row items-center p-4 ${index !== CATALOG_ITEMS.length - 1 ? 'border-b border-gray-50 dark:border-white/5' : ''}`}
                                >
                                    <View className={`w-14 h-14 rounded-2xl overflow-hidden mr-4 ${isDark ? 'bg-zinc-800' : 'bg-gray-100'} items-center justify-center`}>
                                        <Gallery size={24} color={isDark ? '#52525b' : '#d1d5db'} variant="Bulk" />
                                    </View>
                                    <View className="flex-1">
                                        <Typography weight="bold" className="text-[15px] mb-0.5">{item.name}</Typography>
                                        <View className="flex-row items-center">
                                            <Typography variant="small" weight="bold" color="primary" className="mr-3">{item.price}</Typography>
                                            <Typography variant="small" color="gray" className="mr-3">• {item.sales} sales</Typography>
                                            <View className="bg-green-500/10 px-2 rounded-md">
                                                <Typography className="text-[10px] text-green-600 font-bold uppercase">{item.status}</Typography>
                                            </View>
                                        </View>
                                    </View>
                                    <View className="flex-row gap-2">
                                        <TouchableOpacity className={`p-2 rounded-full ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                            <Trash size={16} color="#EF4444" variant="Bulk" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>

                    </View>
                ) : (
                    <EmptyState onUpload={handleUpload} onReset={() => setHasItems(true)} isDark={isDark} />
                )}

            </ScrollView>

            {/* Floating Action Button (FAB) for Upload */}
            <TouchableOpacity 
                activeOpacity={0.8}
                onPress={handleUpload}
                className="absolute bottom-8 right-6 w-16 h-16 bg-blue-600 rounded-full items-center justify-center shadow-lg shadow-blue-500/50 z-50"
            >
                <Add size={32} color="white" variant="Linear" />
            </TouchableOpacity>
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

            <Typography variant="h2" weight="bold" className="mb-3 text-center">Your Catalog is Empty</Typography>
            <Typography variant="body" color="gray" className="text-center mb-10 px-4 leading-6">
                Start building your digital showroom! Upload your best designs to reach more clients and automate your orders via WhatsApp.
            </Typography>

            <Button 
                onPress={onUpload}
                className="w-full h-16 rounded-full bg-blue-600 border-0 mb-4"
                textClassName="text-white text-[16px] font-bold"
            >
                <Add size={20} color="white" className="mr-2" />
                <Typography color="white" weight="bold" className="text-[16px]">Upload First Item</Typography>
            </Button>

            <TouchableOpacity onPress={onReset} className="py-2">
                <Typography color="primary" weight="bold" className="text-[14px]">View Sample Catalog</Typography>
            </TouchableOpacity>
        </View>
    );
}
