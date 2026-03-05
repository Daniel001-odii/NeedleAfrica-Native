import React, { useState } from 'react';
import { View, ScrollView, Image, TouchableOpacity, FlatList, Dimensions, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, PenTool, MagicStar, Heart, Gallery, Filter } from 'iconsax-react-native';
import { Typography } from '../../../components/ui/Typography';
import { Surface } from '../../../components/ui/Surface';
import { IconButton } from '../../../components/ui/IconButton';
import { Button } from '../../../components/ui/Button';
import { useTheme } from '../../../contexts/ThemeContext';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48 - 16) / 2;

interface Pattern {
    id: string;
    title: string;
    category: string;
    image: string;
    difficulty: 'Easy' | 'Medium' | 'Advanced';
}

const PATTERNS: Pattern[] = [
    {
        id: '1',
        title: 'Floral Agbada',
        category: 'Traditional',
        image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&fit=crop',
        difficulty: 'Advanced'
    },
    {
        id: '2',
        title: 'Geometric Lace',
        category: 'Modern',
        image: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=800&fit=crop',
        difficulty: 'Medium'
    },
    {
        id: '3',
        title: 'Golden Mandalas',
        category: 'Wedding',
        image: 'https://images.unsplash.com/photo-1582037928827-42774a386991?w=800&fit=crop',
        difficulty: 'Advanced'
    },
    {
        id: '4',
        title: 'Minimalist Stems',
        category: 'Casual',
        image: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800&fit=crop',
        difficulty: 'Easy'
    },
    {
        id: '5',
        title: 'Tribal Motifs',
        category: 'Traditional',
        image: 'https://images.unsplash.com/photo-1574241604938-db812472d239?w=800&fit=crop',
        difficulty: 'Medium'
    },
    {
        id: '6',
        title: 'Abstract Waves',
        category: 'Abstract',
        image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=800&fit=crop',
        difficulty: 'Easy'
    }
];

const CATEGORIES = ['All', 'Traditional', 'Modern', 'Wedding', 'Casual', 'Abstract'];

export default function EmbroideryScreen() {
    const router = useRouter();
    const { isDark } = useTheme();
    const [selectedCategory, setSelectedCategory] = useState('All');

    const filteredPatterns = selectedCategory === 'All'
        ? PATTERNS
        : PATTERNS.filter(p => p.category === selectedCategory);

    return (
        <View className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-white'}`}>
            {/* Header */}
            <View className={`px-6 py-4 flex-row justify-between items-center border-b ${isDark ? 'border-border-dark' : 'border-gray-50'}`}>
                <View className="flex-row items-center">
                    <IconButton
                        icon={<ArrowLeft size={20} color={isDark ? "white" : "black"} />}
                        onPress={() => router.back()}
                        variant="ghost"
                        className="-ml-2"
                    />
                    <Typography variant="h3" weight="bold" className="ml-2">Embroidery</Typography>
                </View>
                <IconButton
                    icon={<Filter size={20} color={isDark ? "white" : "black"} />}
                    variant="glass"
                />
            </View>

            {/* Categories */}
            <View className="py-4">
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerClassName="px-6 gap-3"
                >
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            onPress={() => setSelectedCategory(cat)}
                            className={`px-6 py-2.5 rounded-full border ${selectedCategory === cat
                                ? (isDark ? 'bg-white border-white' : 'bg-dark border-dark')
                                : (isDark ? 'bg-dark-800 border-border-dark' : 'bg-gray-50 border-gray-100')}`}
                        >
                            <Typography
                                variant="small"
                                weight="bold"
                                className={selectedCategory === cat
                                    ? (isDark ? 'text-black' : 'text-white')
                                    : (isDark ? 'text-gray-400' : 'text-gray-600')}
                            >
                                {cat}
                            </Typography>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Patterns Grid */}
            <FlatList
                data={filteredPatterns}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerClassName="p-6 pb-32 gap-4"
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <TouchableOpacity style={{ width: COLUMN_WIDTH }} activeOpacity={0.9}>
                        <Surface variant="white" className="p-2 border border-black/5" rounded="3xl">
                            <View className="h-44 rounded-2xl overflow-hidden relative">
                                <Image source={{ uri: item.image }} className="w-full h-full" />
                                <View className="absolute top-2 right-2 flex-row gap-1">
                                    <Surface variant="white" className="w-8 h-8 items-center justify-center opacity-90 shadow-sm" rounded="full">
                                        <Heart size={14} color="#EF4444" variant="Bold" />
                                    </Surface>
                                </View>
                                <View className="absolute bottom-2 left-2">
                                    <Surface variant="dark" className="px-2 py-1 opacity-90" rounded="md">
                                        <Typography variant="small" color="white" weight="bold" className="text-[9px] uppercase">{item.difficulty}</Typography>
                                    </Surface>
                                </View>
                            </View>
                            <View className="p-2">
                                <Typography variant="body" weight="bold" numberOfLines={1}>{item.title}</Typography>
                                <Typography variant="caption" color="gray">{item.category}</Typography>
                            </View>
                        </Surface>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View className="items-center justify-center py-20 px-10">
                        <Gallery size={48} color={isDark ? "#4B5563" : "#9CA3AF"} variant="Bulk" />
                        <Typography variant="subtitle" weight="bold" className="mt-4 mb-2">No Patterns Found</Typography>
                        <Typography variant="small" color="gray" className="text-center">Try selecting a different category for more inspiration.</Typography>
                    </View>
                }
            />

            {/* AI Generation Sticky Button */}
            <View className="absolute bottom-10 left-6 right-6">
                <Surface variant={isDark ? "white" : "dark"} className="p-4 flex-row items-center justify-between shadow-2xl" rounded="full">
                    <View className="flex-row items-center ml-2">
                        <MagicStar size={24} color={isDark ? "#4F46E5" : "#818CF8"} variant="Bulk" />
                        <Typography weight="bold" color={isDark ? "black" : "white"} className="ml-3">AI Pattern Generator</Typography>
                    </View>
                    <IconButton
                        icon={<ArrowRight size={20} color={isDark ? "white" : "black"} />}
                        variant={isDark ? "dark" : "white"}
                    />
                </Surface>
            </View>
        </View>
    );
}
