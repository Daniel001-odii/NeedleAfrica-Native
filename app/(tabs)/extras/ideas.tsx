import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    Pressable,
    ActivityIndicator,
    Image,
    Dimensions,
    Linking,
    ScrollView,
    Animated as RNAnimated,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, SearchNormal1, CloseCircle } from 'iconsax-react-native';
import { FlashList } from '@shopify/flash-list';
const MasonryFlashList = FlashList as any;
import { WebView } from 'react-native-webview';
import { Typography } from '../../../components/ui/Typography';
import { IconButton } from '../../../components/ui/IconButton';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { StoreReviewService } from '../../../services/StoreReviewService';
import { PinterestIcon, UnsplashIcon } from '../../../components/ui/CustomIcons';
import axiosInstance from '../../../lib/axios';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLUMNS = 2;
const COLUMN_GAP = 8;
const HORIZONTAL_PADDING = 12;
const COLUMN_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - COLUMN_GAP) / NUM_COLUMNS;

// Skeleton heights to mimic a masonry layout
const SKELETON_HEIGHTS = [200, 260, 180, 240, 220, 300, 190, 270, 210, 250];

function SkeletonCard({ height, isDark }: { height: number; isDark: boolean }) {
    const opacity = useRef(new RNAnimated.Value(0.3)).current;

    useEffect(() => {
        const animation = RNAnimated.loop(
            RNAnimated.sequence([
                RNAnimated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
                RNAnimated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, []);

    return (
        <RNAnimated.View
            style={{
                width: COLUMN_WIDTH,
                height,
                borderRadius: 16,
                backgroundColor: isDark ? '#27272a' : '#e4e4e7',
                marginBottom: COLUMN_GAP,
                opacity,
            }}
        />
    );
}

function MasonrySkeleton({ isDark }: { isDark: boolean }) {
    const leftColumn = SKELETON_HEIGHTS.filter((_, i) => i % 2 === 0);
    const rightColumn = SKELETON_HEIGHTS.filter((_, i) => i % 2 === 1);

    return (
        <View style={{ flex: 1, flexDirection: 'row', paddingHorizontal: HORIZONTAL_PADDING, paddingTop: 8, gap: COLUMN_GAP }}>
            <View style={{ flex: 1 }}>
                {leftColumn.map((h, i) => (
                    <SkeletonCard key={`l-${i}`} height={h} isDark={isDark} />
                ))}
            </View>
            <View style={{ flex: 1 }}>
                {rightColumn.map((h, i) => (
                    <SkeletonCard key={`r-${i}`} height={h} isDark={isDark} />
                ))}
            </View>
        </View>
    );
}

interface UnsplashPhoto {
    id: string;
    width: number;
    height: number;
    color: string;
    description: string;
    urls: {
        small: string;
        regular: string;
        thumb: string;
    };
    user: {
        name: string;
        username: string;
        profile_image?: string;
    };
    links: {
        html: string;
    };
}

const SUGGESTION_CHIPS = [
    'African fashion',
    'Ankara styles',
    'Aso ebi',
    'Fashion runway',
    'Street style',
    'Bridal fashion',
    'Menswear',
    'Haute couture',
];

export default function StyleInspirations() {
    const { isDark } = useTheme();
    const { user, updateProfile } = useAuth();

    // Tab source: 'unsplash' or 'pinterest'
    const [activeTab, setActiveTab] = useState<'unsplash' | 'pinterest'>('unsplash');

    // Unsplash States
    const [query, setQuery] = useState('');
    const [activeQuery, setActiveQuery] = useState('African fashion');
    const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const searchInputRef = useRef<TextInput>(null);

    // Pinterest States
    const [pinterestLoading, setPinterestLoading] = useState(true);
    const searchKeyword = encodeURIComponent('African fashion styles');
    const pinterestUrl = `https://www.pinterest.com/search/pins/?q=${searchKeyword}`;

    // Set initial tab based on user preference from backend DB
    useEffect(() => {
        if (user?.styleInspoPreference === 'pinterest') {
            setActiveTab('pinterest');
        } else {
            setActiveTab('unsplash');
        }
    }, [user?.styleInspoPreference]);

    const fetchPhotos = useCallback(async (searchQuery: string, pageNum: number, append = false) => {
        if (loading) return;
        setLoading(true);
        try {
            const res = await axiosInstance.get('/unsplash/search', {
                params: { query: searchQuery, page: pageNum, per_page: 20 },
            });

            const data = res.data;
            if (append) {
                setPhotos(prev => [...prev, ...data.photos]);
            } else {
                setPhotos(data.photos);
            }
            setTotalPages(data.total_pages);
            setPage(pageNum);
        } catch (error) {
            console.error('Error fetching photos:', error);
        } finally {
            setLoading(false);
            setInitialLoad(false);
        }
    }, [loading]);

    // Initial fetch for Unsplash
    useEffect(() => {
        fetchPhotos('African fashion', 1);
    }, []);

    // Handle tab change
    const handleTabChange = async (tab: 'unsplash' | 'pinterest') => {
        if (tab === activeTab) return;
        setActiveTab(tab);

        // 1. Prompt store review using the professional auto-check (triggers dialog elegantly)
        StoreReviewService.requestReview(false);

        // 2. Persist the selection to the database asynchronously
        try {
            await updateProfile({ styleInspoPreference: tab });
        } catch (err) {
            console.error('Failed to sync style preference to DB:', err);
        }
    };

    const handleSearch = () => {
        const trimmed = query.trim();
        if (!trimmed) return;
        setActiveQuery(trimmed);
        setPhotos([]);
        setPage(1);
        fetchPhotos(trimmed, 1);
        searchInputRef.current?.blur();
    };

    const handleChipPress = (chip: string) => {
        setQuery(chip);
        setActiveQuery(chip);
        setPhotos([]);
        setPage(1);
        fetchPhotos(chip, 1);
    };

    const handleLoadMore = () => {
        if (!loading && page < totalPages) {
            fetchPhotos(activeQuery, page + 1, true);
        }
    };

    const handlePhotoPress = (photo: UnsplashPhoto) => {
        Linking.openURL(photo.links.html + '?utm_source=needlex&utm_medium=referral');
    };

    const renderPhoto = ({ item }: { item: UnsplashPhoto }) => {
        const aspectRatio = item.width / item.height;
        const imageHeight = COLUMN_WIDTH / aspectRatio;

        return (
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handlePhotoPress(item)}
                style={{
                    width: COLUMN_WIDTH,
                    marginBottom: COLUMN_GAP,
                    borderRadius: 16,
                    overflow: 'hidden',
                    backgroundColor: item.color || (isDark ? '#27272a' : '#f4f4f5'),
                }}
            >
                <Image
                    source={{ uri: item.urls.small }}
                    style={{ width: COLUMN_WIDTH, height: imageHeight }}
                    resizeMode="cover"
                />
                <View style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    paddingHorizontal: 8,
                    paddingVertical: 6,
                    backgroundColor: 'rgba(0,0,0,0.45)',
                }}>
                    <Typography variant="caption" className="text-white" weight="semibold" numberOfLines={1}>
                        {item.user.name}
                    </Typography>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
            {/* Header */}
            <View className={`px-4 pt-2 pb-2 flex-row items-center ${isDark ? 'border-b border-zinc-800' : 'border-b border-gray-100'}`}>
                <IconButton
                    icon={<ArrowLeft size={22} color={isDark ? 'white' : 'black'} />}
                    onPress={() => router.back()}
                    variant="ghost"
                    className="-ml-2"
                />
                <Typography variant="h3" weight="bold" className="ml-2">Style Inspirations</Typography>
            </View>

            {/* Segmented Control Tabs */}
            <View className="px-4 py-3">
                <View className={`flex-row p-1 rounded-full ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-gray-100'}`}>
                    <Pressable
                        onPress={() => handleTabChange('unsplash')}
                        className={`flex-1 flex-row items-center justify-center py-2.5 rounded-full ${
                            activeTab === 'unsplash'
                                ? isDark ? 'bg-zinc-800' : 'bg-white'
                                : ''
                        }`}
                        style={({ pressed }) => [
                            { opacity: pressed ? 0.7 : 1 },
                            (!isDark && activeTab === 'unsplash') ? {
                                shadowColor: '#E5E7EB',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.15,
                                shadowRadius: 1,
                                elevation: 1,
                            } : {}
                        ]}
                    >
                        <UnsplashIcon size={16} color={activeTab === 'unsplash' ? (isDark ? '#fff' : '#000') : '#9CA3AF'} />
                        <Typography
                            variant="small"
                            weight="bold"
                            className={`ml-2 ${
                                activeTab === 'unsplash'
                                    ? isDark ? 'text-white' : 'text-zinc-900'
                                    : 'text-gray-400'
                            }`}
                        >
                            Unsplash
                        </Typography>
                    </Pressable>

                    <Pressable
                        onPress={() => handleTabChange('pinterest')}
                        className={`flex-1 flex-row items-center justify-center py-2.5 rounded-full ${
                            activeTab === 'pinterest'
                                ? isDark ? 'bg-zinc-800' : 'bg-white'
                                : ''
                        }`}
                        style={({ pressed }) => [
                            { opacity: pressed ? 0.7 : 1 },
                            (!isDark && activeTab === 'pinterest') ? {
                                shadowColor: '#E5E7EB',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.15,
                                shadowRadius: 1,
                                elevation: 1,
                            } : {}
                        ]}
                    >
                        <PinterestIcon size={16} color={activeTab === 'pinterest' ? '#E60023' : '#9CA3AF'} />
                        <Typography
                            variant="small"
                            weight="bold"
                            className={`ml-2 ${
                                activeTab === 'pinterest'
                                    ? isDark ? 'text-white' : 'text-zinc-900'
                                    : 'text-gray-400'
                            }`}
                        >
                            Pinterest
                        </Typography>
                    </Pressable>
                </View>
            </View>

            {/* Tab Contents */}
            {activeTab === 'unsplash' ? (
                <View className="flex-1">
                    {/* Unsplash Search Bar */}
                    <View className={`px-3 pb-2 ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
                        <View className={`flex-row items-center h-12 rounded-2xl px-3 ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-200'}`}>
                            <SearchNormal1 size={18} color="#9CA3AF" />
                            <TextInput
                                ref={searchInputRef}
                                className={`flex-1 ml-2 font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}
                                placeholder="Search fashion inspiration..."
                                placeholderTextColor="#9CA3AF"
                                value={query}
                                onChangeText={setQuery}
                                onSubmitEditing={handleSearch}
                                returnKeyType="search"
                                autoCorrect={false}
                            />
                            {query.length > 0 && (
                                <TouchableOpacity onPress={() => setQuery('')}>
                                    <CloseCircle size={18} color="#9CA3AF" variant="Bulk" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Suggestion Chips */}
                        <ScrollView className="flex-row mt-2 gap-2" horizontal={true} showsHorizontalScrollIndicator={false}>
                            {SUGGESTION_CHIPS.map((chip) => {
                                const isActive = activeQuery === chip;
                                return (
                                    <TouchableOpacity
                                        key={chip}
                                        onPress={() => handleChipPress(chip)}
                                        className={`px-3 py-1.5 rounded-full ${isActive
                                            ? 'bg-blue-500'
                                            : isDark ? 'bg-zinc-800' : 'bg-white border border-gray-200'
                                            }`}
                                    >
                                        <Typography
                                            variant="caption"
                                            weight={isActive ? 'bold' : 'medium'}
                                            className={isActive ? 'text-white' : isDark ? 'text-zinc-300' : 'text-zinc-600'}
                                        >
                                            {chip}
                                        </Typography>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>

                    {/* Unsplash Native Grid */}
                    {initialLoad ? (
                        <MasonrySkeleton isDark={isDark} />
                    ) : photos.length === 0 ? (
                        <View className="flex-1 items-center justify-center px-8">
                            <Typography variant="h3" weight="bold" className="mb-2">No results</Typography>
                            <Typography variant="small" color="gray" className="text-center">
                                Try a different search term to find fashion inspiration.
                            </Typography>
                        </View>
                    ) : (
                        <MasonryFlashList
                            data={photos}
                            renderItem={renderPhoto}
                            numColumns={NUM_COLUMNS}
                            estimatedItemSize={250}
                            contentContainerStyle={{ paddingHorizontal: HORIZONTAL_PADDING, paddingTop: 8 }}
                            onEndReached={handleLoadMore}
                            onEndReachedThreshold={0.5}
                            keyExtractor={(item: UnsplashPhoto) => item.id}
                            showsVerticalScrollIndicator={false}
                            ListFooterComponent={
                                loading && photos.length > 0 ? (
                                    <View className="py-6 items-center">
                                        <ActivityIndicator size="small" color={isDark ? '#60a5fa' : '#3b82f6'} />
                                    </View>
                                ) : null
                            }
                        />
                    )}

                    {/* Unsplash Attribution */}
                    <View className={`py-2 items-center ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
                        <TouchableOpacity onPress={() => Linking.openURL('https://unsplash.com/?utm_source=needlex&utm_medium=referral')}>
                            <Typography variant="caption" color="gray" className="text-[10px]">
                                Photos by Unsplash
                            </Typography>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                /* Pinterest WebView tab */
                <View className="flex-1">
                    <WebView
                        source={{ uri: pinterestUrl }}
                        style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#ffffff' }}
                        onLoadStart={() => setPinterestLoading(true)}
                        onLoadEnd={() => setPinterestLoading(false)}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        startInLoadingState={true}
                        renderLoading={() => (
                            <View className="absolute inset-0 items-center justify-center bg-transparent">
                                <ActivityIndicator size="large" color="#E60023" />
                            </View>
                        )}
                    />
                    {pinterestLoading && (
                        <View className="absolute inset-0 items-center justify-center">
                            <ActivityIndicator size="large" color="#E60023" />
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}
