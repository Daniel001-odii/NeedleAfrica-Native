import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, Dimensions, Animated, Pressable, TextInput, Keyboard, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Refresh, Copy, SearchNormal1, CloseCircle } from 'iconsax-react-native';
import { Typography } from '../../components/ui/Typography';
import { IconButton } from '../../components/ui/IconButton';
import { useTheme } from '../../contexts/ThemeContext';
import Toast from 'react-native-toast-message';
import { usePostHog } from 'posthog-react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface ColorSwatch {
    hex: string;
    name: string;
}

interface Palette {
    id: string;
    name: string;
    colors: ColorSwatch[];
}



export function HugeiconsTick02(props: any) {
    return (
        <Svg width="1em" height="1em" viewBox="0 0 24 24">{/* Icon from Huge Icons by Hugeicons - undefined */}<Path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m5 14l3.5 3.5L19 6.5" /></Svg>
    )
}

const PRESET_PALETTES: Palette[] = [
    {
        id: '1',
        name: 'Royal Heritage',
        colors: [
            { hex: '#1E3A8A', name: 'Royal Blue' },
            { hex: '#D4AF37', name: 'Imperial Gold' },
            { hex: '#7F1D1D', name: 'Burgundy' },
            { hex: '#F3F4F6', name: 'Carrara Marble' },
            { hex: '#312E81', name: 'Deep Indigo' },
            { hex: '#FEF3C7', name: 'Silk Sand' },
        ]
    },
    {
        id: '2',
        name: 'Sunset Safari',
        colors: [
            { hex: '#F97316', name: 'Kalahari Orange' },
            { hex: '#7C2D12', name: 'Terra Umber' },
            { hex: '#FEF3C7', name: 'Desert Sand' },
            { hex: '#431407', name: 'Acacia Bark' },
            { hex: '#EA580C', name: 'Blaze Ember' },
            { hex: '#FDE68A', name: 'Dune Ochre' },
        ]
    },
    {
        id: '3',
        name: 'Lagos Night',
        colors: [
            { hex: '#4C1D95', name: 'Marina Indigo' },
            { hex: '#EC4899', name: 'Electric Fuchsia' },
            { hex: '#111827', name: 'Midnight Onyx' },
            { hex: '#A78BFA', name: 'Island Lavender' },
            { hex: '#06B6D4', name: 'Lekki Cyan' },
            { hex: '#F43F5E', name: 'Neon Coral' },
        ]
    },
    {
        id: '4',
        name: 'Marrakech Ochre',
        colors: [
            { hex: '#C2410C', name: 'Terracotta' },
            { hex: '#D97706', name: 'Moroccan Amber' },
            { hex: '#047857', name: 'Atlas Emerald' },
            { hex: '#FFFBEB', name: 'Alabaster' },
            { hex: '#78350F', name: 'Date Palm' },
            { hex: '#0D9488', name: 'Medina Teal' },
        ]
    },
    {
        id: '5',
        name: 'Serengeti Dawn',
        colors: [
            { hex: '#065F46', name: 'Savannah Moss' },
            { hex: '#B45309', name: 'Golden Acacia' },
            { hex: '#E0E7FF', name: 'Dawn Mist' },
            { hex: '#1E293B', name: 'Slate Stone' },
            { hex: '#10B981', name: 'Verdant Mint' },
            { hex: '#FCD34D', name: 'Sunrise Gold' },
        ]
    },
    {
        id: '6',
        name: 'Dakar Minimal',
        colors: [
            { hex: '#0F172A', name: 'Obsidian Jet' },
            { hex: '#E2E8F0', name: 'Atlantic Salt' },
            { hex: '#94A3B8', name: 'Coastal Gray' },
            { hex: '#475569', name: 'Granite Ash' },
            { hex: '#CBD5E1', name: 'Silver Mist' },
            { hex: '#1E293B', name: 'Deep Harbour' },
        ]
    },
    {
        id: '7',
        name: 'Asante Kente',
        colors: [
            { hex: '#DC2626', name: 'Ashanti Red' },
            { hex: '#EAB308', name: 'Sun Gold' },
            { hex: '#16A34A', name: 'Forest Green' },
            { hex: '#1E3A8A', name: 'Cobalt Blue' },
            { hex: '#171717', name: 'Adinkra Black' },
            { hex: '#F8FAFC', name: 'Loom Cotton' },
        ]
    },
];

const PANTONE_COLOR_CATALOG: ColorSwatch[] = [
    { hex: '#1E3A8A', name: 'Royal Blue' },
    { hex: '#D4AF37', name: 'Imperial Gold' },
    { hex: '#7F1D1D', name: 'Burgundy Crimson' },
    { hex: '#F3F4F6', name: 'Carrara Marble' },
    { hex: '#312E81', name: 'Deep Indigo' },
    { hex: '#FEF3C7', name: 'Silk Sand' },
    { hex: '#F97316', name: 'Kalahari Orange' },
    { hex: '#7C2D12', name: 'Terra Umber' },
    { hex: '#431407', name: 'Acacia Bark' },
    { hex: '#EA580C', name: 'Blaze Ember' },
    { hex: '#4C1D95', name: 'Marina Indigo' },
    { hex: '#EC4899', name: 'Electric Fuchsia' },
    { hex: '#111827', name: 'Midnight Onyx' },
    { hex: '#A78BFA', name: 'Island Lavender' },
    { hex: '#06B6D4', name: 'Lekki Cyan' },
    { hex: '#F43F5E', name: 'Neon Coral' },
    { hex: '#C2410C', name: 'Terracotta' },
    { hex: '#D97706', name: 'Moroccan Amber' },
    { hex: '#047857', name: 'Atlas Emerald' },
    { hex: '#FFFBEB', name: 'Alabaster Cream' },
    { hex: '#78350F', name: 'Date Palm Brown' },
    { hex: '#0D9488', name: 'Medina Teal' },
    { hex: '#065F46', name: 'Savannah Moss' },
    { hex: '#B45309', name: 'Golden Acacia' },
    { hex: '#E0E7FF', name: 'Dawn Mist' },
    { hex: '#1E293B', name: 'Ngorongoro Slate' },
    { hex: '#10B981', name: 'Verdant Mint' },
    { hex: '#FCD34D', name: 'Sunrise Gold' },
    { hex: '#0F172A', name: 'Obsidian Jet' },
    { hex: '#E2E8F0', name: 'Atlantic Salt' },
    { hex: '#94A3B8', name: 'Coastal Gray' },
    { hex: '#EAB308', name: 'Sahara Sun' },
    { hex: '#CA8A04', name: 'Raw Ochre' },
    { hex: '#DC2626', name: 'Ashanti Red' },
    { hex: '#16A34A', name: 'Palm Green' },
    { hex: '#831843', name: 'Dusk Berry' },
    { hex: '#0284C7', name: 'Sky Azure' },
    { hex: '#6366F1', name: 'Aso-Oke Iris' },
    { hex: '#BE185D', name: 'Zanzibar Magenta' },
    { hex: '#F59E0B', name: 'Warm Marigold' },
    { hex: '#059669', name: 'Rainforest Jade' },
    { hex: '#475569', name: 'Pewter Stone' },
    { hex: '#78716C', name: 'Warm Taupe' },
    { hex: '#E11D48', name: 'Ruby Scarlet' },
    { hex: '#8B5CF6', name: 'Violet Royale' },
];

const generateRandomHex = () => {
    const chars = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += chars[Math.floor(Math.random() * 16)];
    }
    return color;
};

export default function PantoneScreen() {
    const router = useRouter();
    const { isDark } = useTheme();
    const posthog = usePostHog();

    // Color stops count (default 4, range 3 to 6)
    const [stopsCount, setStopsCount] = useState<number>(4);
    const [currentPalette, setCurrentPalette] = useState<Palette>(() => {
        const initial = PRESET_PALETTES[0];
        return {
            ...initial,
            colors: initial.colors.slice(0, 4)
        };
    });

    // Search state & Apple spring animations
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchAnim = useRef(new Animated.Value(0)).current;
    const searchInputRef = useRef<TextInput>(null);

    // Color Customizer state
    const [editingColorIndex, setEditingColorIndex] = useState<number | null>(null);
    const [customHexInput, setCustomHexInput] = useState<string>('');

    const openSearch = () => {
        setIsSearching(true);
        Animated.spring(searchAnim, {
            toValue: 1,
            damping: 20,
            mass: 1,
            stiffness: 220,
            useNativeDriver: true,
        }).start(() => {
            searchInputRef.current?.focus();
        });
    };

    const closeSearch = () => {
        Keyboard.dismiss();
        Animated.spring(searchAnim, {
            toValue: 0,
            damping: 22,
            mass: 1,
            stiffness: 240,
            useNativeDriver: true,
        }).start(() => {
            setIsSearching(false);
            setSearchQuery('');
        });
    };

    const headerTranslateX = searchAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -12],
    });
    const headerOpacity = searchAnim.interpolate({
        inputRange: [0, 0.6, 1],
        outputRange: [1, 0.2, 0],
    });

    const searchTranslateX = searchAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [12, 0],
    });
    const searchOpacity = searchAnim.interpolate({
        inputRange: [0, 0.4, 1],
        outputRange: [0, 0.4, 1],
    });

    const iconRotate = searchAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '90deg'],
    });

    const [fadeAnim] = useState(new Animated.Value(0));
    const [pulseAnim] = useState(new Animated.Value(1));
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const viewRef = useRef<View>(null);

    useEffect(() => {
        animateIn();
    }, [currentPalette]);

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.12,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.delay(100)
            ])
        );

        animation.start();

        const timer = setTimeout(() => {
            animation.stop();
            Animated.timing(pulseAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }, 4000);

        return () => clearTimeout(timer);
    }, []);

    const animateIn = () => {
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
        }).start();
    };

    // Handle stops count changes (3, 4, 5, 6)
    const handleStopsChange = (newCount: number) => {
        if (newCount === stopsCount) return;
        setStopsCount(newCount);

        setCurrentPalette((prev) => {
            let updatedColors = [...prev.colors];
            if (newCount < updatedColors.length) {
                updatedColors = updatedColors.slice(0, newCount);
            } else if (newCount > updatedColors.length) {
                const presetMatch = PRESET_PALETTES.find(p => p.id === prev.id || p.name === prev.name);
                while (updatedColors.length < newCount) {
                    const nextIndex = updatedColors.length;
                    if (presetMatch && presetMatch.colors[nextIndex]) {
                        updatedColors.push(presetMatch.colors[nextIndex]);
                    } else {
                        updatedColors.push({
                            hex: generateRandomHex(),
                            name: `Tone ${nextIndex + 1}`
                        });
                    }
                }
            }
            return {
                ...prev,
                colors: updatedColors
            };
        });
    };

    const selectPreset = (preset: Palette) => {
        setCurrentPalette({
            ...preset,
            colors: preset.colors.slice(0, stopsCount)
        });
    };

    const generateNewPalette = () => {
        // Apple-style spin animation for tactile feedback
        Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start(() => {
            rotateAnim.setValue(0);
        });

        const newPalette: Palette = {
            id: Date.now().toString(),
            name: 'Generated Mix',
            colors: Array.from({ length: stopsCount }).map((_, i) => ({
                hex: generateRandomHex(),
                name: `Tone ${i + 1}`
            }))
        };
        setCurrentPalette(newPalette);

        posthog.capture('pantone_generated', {
            palette_name: newPalette.name,
            color_count: newPalette.colors.length,
        });
    };

    const copyToClipboard = async (hex: string) => {
        try {
            await Clipboard.setStringAsync(hex);
        } catch {
            // fallback
        }
        Toast.show({
            type: 'success',
            text1: 'Color Copied!',
            text2: `${hex} copied to clipboard`
        });
    };

    const addColorToPalette = (color: ColorSwatch) => {
        setCurrentPalette((prev) => {
            const exists = prev.colors.some(c => c.hex.toLowerCase() === color.hex.toLowerCase());
            if (exists) {
                Toast.show({
                    type: 'info',
                    text1: 'Already in Palette',
                    text2: `${color.name} is already part of this palette`
                });
                return prev;
            }
            const updated = [color, ...prev.colors.slice(0, stopsCount - 1)];
            Toast.show({
                type: 'success',
                text1: 'Added to Palette',
                text2: `${color.name} added to your active spectrum`
            });
            return {
                ...prev,
                name: 'Custom Curated',
                colors: updated
            };
        });
    };

    const openColorEditor = (index: number) => {
        setEditingColorIndex(index);
        const currentColor = currentPalette.colors[index];
        if (currentColor) {
            setCustomHexInput(currentColor.hex.replace('#', ''));
        }
    };

    const closeColorEditor = () => {
        setEditingColorIndex(null);
        setCustomHexInput('');
    };

    const updateCurrentSwatch = (newHex: string, newName?: string) => {
        if (editingColorIndex === null) return;

        let formattedHex = newHex.trim();
        if (!formattedHex.startsWith('#')) {
            formattedHex = `#${formattedHex}`;
        }

        const match = PANTONE_COLOR_CATALOG.find(
            c => c.hex.toLowerCase() === formattedHex.toLowerCase()
        );
        const finalName = newName || (match ? match.name : `Custom Tone`);

        setCurrentPalette((prev) => {
            const nextColors = [...prev.colors];
            nextColors[editingColorIndex] = {
                hex: formattedHex,
                name: finalName,
            };
            return {
                ...prev,
                name: prev.name.includes('(Custom)') ? prev.name : `${prev.name} (Custom)`,
                colors: nextColors,
            };
        });
    };

    const handleHexChange = (text: string) => {
        const cleaned = text.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6).toUpperCase();
        setCustomHexInput(cleaned);
        if (cleaned.length === 6) {
            updateCurrentSwatch(`#${cleaned}`);
        }
    };

    const randomizeCurrentSwatch = () => {
        const randomHex = generateRandomHex();
        setCustomHexInput(randomHex.replace('#', ''));
        updateCurrentSwatch(
            randomHex,
            `Tone ${editingColorIndex !== null ? editingColorIndex + 1 : ''}`
        );
    };

    const handleShare = async () => {
        if (!viewRef.current) return;

        try {
            await new Promise(resolve => setTimeout(resolve, 300));

            const uri = await captureRef(viewRef, {
                format: 'png',
                quality: 1,
            });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'image/png',
                    dialogTitle: `Share ${currentPalette.name} Palette`,
                });
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Sharing Unavailable',
                });
            }
        } catch (error) {
            console.error('Error sharing palette:', error);
            Toast.show({
                type: 'error',
                text1: 'Capture Error',
                text2: 'Could not generate the palette image'
            });
        }
    };

    // Filtered search results
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const q = searchQuery.toLowerCase().trim();
        return PANTONE_COLOR_CATALOG.filter(c =>
            c.name.toLowerCase().includes(q) || c.hex.toLowerCase().includes(q)
        );
    }, [searchQuery]);

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <SafeAreaView className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-white'}`} edges={['top']}>
            {/* Header: Pure gray neutral border with slick native Apple animated search replacement */}
            <View
                className={`px-4 h-16 flex-row items-center justify-between border-b ${isDark ? 'border-zinc-800 bg-background-dark' : 'border-gray-100 bg-white'
                    }`}
            >
                {/* Left Slot: Houses either Default Title/Back or Search Input */}
                <View className="flex-1 mr-2 justify-center h-10 overflow-hidden">
                    {/* Default Title & Back Button */}
                    <Animated.View
                        pointerEvents={isSearching ? 'none' : 'auto'}
                        style={{
                            opacity: headerOpacity,
                            transform: [{ translateX: headerTranslateX }],
                        }}
                        className="absolute inset-y-0 left-0 right-0 flex-row items-center"
                    >
                        <IconButton
                            icon={<ArrowLeft size={20} color={isDark ? "white" : "black"} />}
                            onPress={() => router.back()}
                            variant="ghost"
                            className="-ml-1"
                        />
                        <Typography variant="h3" weight="bold" className="ml-1.5">Pantone</Typography>
                    </Animated.View>

                    {/* Search Input Field */}
                    <Animated.View
                        pointerEvents={isSearching ? 'auto' : 'none'}
                        style={{
                            opacity: searchOpacity,
                            transform: [{ translateX: searchTranslateX }],
                        }}
                        className="absolute inset-y-0 left-0 right-0 justify-center"
                    >
                        <View className={`flex-row items-center h-10 px-3.5 rounded-full ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-gray-100 border border-gray-200/70'
                            }`}>
                            <SearchNormal1 size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
                            <TextInput
                                ref={searchInputRef}
                                placeholder="Search colors, names, or HEX..."
                                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                className={`flex-1 ml-2 text-sm py-0 ${isDark ? 'text-white' : 'text-black'}`}
                                returnKeyType="search"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            {searchQuery.length > 0 && (
                                <Pressable onPress={() => setSearchQuery('')} hitSlop={8} className="p-0.5">
                                    <CloseCircle size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
                                </Pressable>
                            )}
                        </View>
                    </Animated.View>
                </View>

                {/* Right Action Button: Stays in the exact same place, morphing Search <-> Close (X) */}
                <Pressable
                    onPress={isSearching ? closeSearch : openSearch}
                    hitSlop={8}
                    className="w-10 h-10 items-center justify-center -mr-1 active:scale-95"
                >
                    <Animated.View style={{ transform: [{ rotate: iconRotate }] }}>
                        {isSearching ? (
                            <CloseCircle size={22} color={isDark ? "white" : "black"} />
                        ) : (
                            <SearchNormal1 size={20} color={isDark ? "white" : "black"} />
                        )}
                    </Animated.View>
                </Pressable>
            </View>

            <ScrollView contentContainerClassName="p-6 pb-32" showsVerticalScrollIndicator={false}>
                {/* Hero Palette Card */}
                <Animated.View collapsable={false} style={{ opacity: fadeAnim }} className="mb-6">
                    <View
                        ref={viewRef}
                        collapsable={false}
                        style={{
                            width: width - 48,
                            alignSelf: 'center',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Guaranteed 280px tall Hero Card with crisp Apple borders */}
                        <View
                            collapsable={false}
                            style={{
                                height: 280,
                                width: '100%',
                                borderRadius: 30,
                                overflow: 'hidden',
                                borderWidth: 1,
                                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                            }}
                            className="mb-4 bg-white dark:bg-zinc-900"
                        >
                            <View collapsable={false} style={{ flex: 1, flexDirection: 'row', height: '100%' }}>
                                {currentPalette.colors.map((color, index) => (
                                    <Pressable
                                        key={`${color.hex}-${index}`}
                                        onPress={() => openColorEditor(index)}
                                        collapsable={false}
                                        style={{ backgroundColor: color.hex, flex: 1, height: '100%' }}
                                        className="items-center justify-center pb-5 active:opacity-90"
                                    >
                                        <View
                                            collapsable={false}
                                            style={{
                                                backgroundColor: 'rgba(0,0,0,0.35)',
                                                borderRadius: 999,
                                                paddingHorizontal: 8,
                                                paddingVertical: 4,
                                                marginBottom: 4,
                                                borderWidth: 1,
                                                borderColor: 'rgba(255,255,255,0.2)'
                                            }}
                                        >
                                            <Typography variant="small" weight="bold" color="white" className="text-[10px] tracking-tight">
                                                {color.hex}
                                            </Typography>
                                        </View>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        {/* Palette Details & Actions */}
                        <View className="flex-row justify-between items-center mt-1">
                            <View className="flex-1 mr-3">
                                <Typography variant="h2" weight="bold">{currentPalette.name}</Typography>
                                <Typography variant="caption" color="gray">Tap any swatch to copy HEX code</Typography>
                            </View>
                            <IconButton
                                icon={
                                    <Svg width="22" height="22" viewBox="0 0 24 24">
                                        <Path fill={isDark ? "white" : "black"} fillRule="evenodd" d="M13.803 5.333c0-1.84 1.5-3.333 3.348-3.333A3.34 3.34 0 0 1 20.5 5.333c0 1.841-1.5 3.334-3.349 3.334a3.35 3.35 0 0 1-2.384-.994l-4.635 3.156a3.34 3.34 0 0 1-.182 1.917l5.082 3.34a3.35 3.35 0 0 1 2.12-.753a3.34 3.34 0 0 1 3.348 3.334C20.5 20.507 19 22 17.151 22a3.34 3.34 0 0 1-3.348-3.333a3.3 3.3 0 0 1 .289-1.356L9.05 14a3.35 3.35 0 0 1-2.202.821A3.34 3.34 0 0 1 3.5 11.487a3.34 3.34 0 0 1 3.348-3.333c1.064 0 2.01.493 2.623 1.261l4.493-3.059a3.3 3.3 0 0 1-.161-1.023" clipRule="evenodd" />
                                    </Svg>
                                }
                                variant="ghost"
                                onPress={handleShare}
                            />
                        </View>

                        {/* Presets Row: Clean, horizontal pill strip */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4 -mx-1 px-1">
                            {PRESET_PALETTES.map((preset) => {
                                const isSelected = currentPalette.name === preset.name;
                                return (
                                    <Pressable
                                        key={preset.id}
                                        onPress={() => selectPreset(preset)}
                                        className={`flex-row items-center px-3 py-1.5 rounded-full border mr-2 active:scale-95 ${isSelected
                                            ? (isDark ? 'bg-zinc-800 border-zinc-600' : 'bg-black border-black')
                                            : (isDark ? 'bg-zinc-900/70 border-zinc-800' : 'bg-gray-50 border-gray-200')
                                            }`}
                                    >
                                        <View className="flex-row -space-x-1 mr-2">
                                            {preset.colors.slice(0, 3).map((c, i) => (
                                                <View key={i} style={{ backgroundColor: c.hex }} className="w-2.5 h-2.5 rounded-full border border-white/20" />
                                            ))}
                                        </View>
                                        <Typography
                                            variant="small"
                                            weight={isSelected ? "bold" : "medium"}
                                            className={`text-xs ${isSelected ? 'text-white' : (isDark ? 'text-gray-300' : 'text-gray-700')}`}
                                        >
                                            {preset.name}
                                        </Typography>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    </View>
                </Animated.View>

                {/* Section Header: Color Spectrum + Apple-Style Segmented Stops Pill */}
                <View className="flex-row items-center justify-between mb-3 mt-3">
                    <View>
                        <Typography variant="subtitle" weight="bold" className="uppercase tracking-widest text-[10px] text-gray-400">
                            {searchQuery.trim() ? `Search Results (${searchResults.length})` : `Color Spectrum`}
                        </Typography>
                        <Typography variant="caption" color="gray" className="text-[11px]">
                            {searchQuery.trim() ? 'Tap Add to inject into active palette' : `${stopsCount} Color Stops`}
                        </Typography>
                    </View>

                    {/* Stops Control: Sleek circular pills (3, 4, 5, 6) */}
                    {!isSearching && (
                        <View className={`flex-row items-center p-1 rounded-full ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-gray-100'}`}>
                            {[3, 4, 5, 6].map((num) => {
                                const active = stopsCount === num;
                                return (
                                    <Pressable
                                        key={num}
                                        onPress={() => handleStopsChange(num)}
                                        className={`w-7 h-7 items-center justify-center rounded-full ${active
                                            ? (isDark ? 'bg-zinc-800' : 'bg-white')
                                            : ''
                                            }`}
                                    >
                                        <Typography
                                            variant="small"
                                            weight={active ? "bold" : "normal"}
                                            className={`text-xs ${active ? (isDark ? 'text-white' : 'text-black') : 'text-gray-400'}`}
                                        >
                                            {num}
                                        </Typography>
                                    </Pressable>
                                );
                            })}
                        </View>
                    )}
                </View>

                {/* Spectrum List OR Search Results in a Unified Inset Group */}
                {searchQuery.trim() ? (
                    <View className={`p-2 rounded-xl border overflow-hidden ${isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-gray-100'}`}>
                        {searchResults.length === 0 ? (
                            <View className="py-12 items-center justify-center">
                                <Typography variant="body" color="gray" className="text-center mb-1">
                                    No colors found matching "{searchQuery}"
                                </Typography>
                                <Typography variant="caption" color="gray" className="text-center text-xs">
                                    Try searching by name like "Amber", "Indigo", "Jade", or hex code
                                </Typography>
                            </View>
                        ) : (
                            searchResults.map((color, index) => (
                                <View
                                    key={color.hex + color.name}
                                    className={`p-3.5 flex-row items-center justify-between ${index > 0 ? (isDark ? 'border-t border-zinc-800/80' : 'border-t border-gray-100') : ''
                                        }`}
                                >
                                    <View className="flex-row items-center flex-1 mr-2">
                                        <View style={{ backgroundColor: color.hex }} className="w-11 h-11 rounded-xl mr-3 border border-black/10" />
                                        <View className="flex-1">
                                            <Typography variant="body" weight="bold" numberOfLines={1}>{color.name}</Typography>
                                            <Typography variant="small" color="gray" className="font-mono text-xs">{color.hex}</Typography>
                                        </View>
                                    </View>
                                    <View className="flex-row items-center gap-2">
                                        <Pressable
                                            onPress={() => addColorToPalette(color)}
                                            className={`px-3 py-1.5 rounded-full active:scale-95 ${isDark ? 'bg-zinc-800 border border-zinc-700' : 'bg-gray-100'}`}
                                        >
                                            <Typography variant="small" weight="medium" className="text-xs">
                                                Use
                                            </Typography>
                                        </Pressable>
                                        <Pressable
                                            onPress={() => copyToClipboard(color.hex)}
                                            className={`p-2 rounded-xl active:scale-95 ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}
                                        >
                                            <Copy size={16} color={isDark ? "#9CA3AF" : "#6B7280"} />
                                        </Pressable>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                ) : (
                    /* Unified Apple-Style Inset Grouped List (Clean, cohesive, not overcrowded) */
                    <View className={`rounded-3xl border overflow-hidden ${isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-gray-100'}`}>
                        {currentPalette.colors.map((color, index) => (
                            <Pressable
                                key={`${color.hex}-${index}`}
                                onPress={() => openColorEditor(index)}
                                className={`px-4 py-3.5 flex-row items-center justify-between active:bg-black/5 dark:active:bg-white/5 ${index > 0 ? (isDark ? 'border-t border-zinc-800/70' : 'border-t border-gray-100') : ''
                                    }`}
                            >
                                <View className="flex-row items-center flex-1 mr-2">
                                    <View
                                        style={{ backgroundColor: color.hex }}
                                        className="w-11 h-11 rounded-xl mr-3.5 border border-black/10"
                                    />
                                    <View className="flex-1">
                                        <Typography variant="body" weight="bold">{color.name}</Typography>
                                        <Typography variant="small" color="gray" className="font-mono text-xs mt-0.5">{color.hex}</Typography>
                                    </View>
                                </View>
                                <View className="flex-row items-center gap-2">
                                    <View className="px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10">
                                        <Typography variant="small" className="text-[10px] text-gray-500 font-medium">
                                            #{index + 1}
                                        </Typography>
                                    </View>
                                    <Pressable
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            copyToClipboard(color.hex);
                                        }}
                                        className={`p-2 rounded-full active:scale-95 ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}
                                    >
                                        <Copy size={16} color={isDark ? "#9CA3AF" : "#6B7280"} />
                                    </Pressable>
                                </View>
                            </Pressable>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Floating Action Button: Apple-Style tactile refresh */}
            <Animated.View
                className="absolute bottom-10 right-6"
                style={{
                    transform: [
                        { scale: pulseAnim },
                        { rotate: spin }
                    ]
                }}
            >
                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={generateNewPalette}
                    className="w-16 h-16 rounded-full items-center justify-center bg-[#FF5678] active:opacity-90"
                >
                    <Refresh size={24} color="white" />
                </TouchableOpacity>
            </Animated.View>

            {/* Color Customizer Modal / Bottom Sheet */}
            <Modal
                visible={editingColorIndex !== null}
                transparent
                animationType="slide"
                onRequestClose={closeColorEditor}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <Pressable className="flex-1" onPress={closeColorEditor} />
                    <View
                        className={`rounded-t-[32px] px-6 pt-3 pb-8 max-h-[85%] border-t ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-gray-200'
                            }`}
                    >
                        {/* Drag Handle */}
                        <View className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700 self-center mb-4" />

                        {/* Header */}
                        <View className="flex-row justify-between items-center mb-4">
                            <View>
                                <Typography variant="h3" weight="bold">
                                    Customize Stop #{editingColorIndex !== null ? editingColorIndex + 1 : ''}
                                </Typography>
                                <Typography variant="caption" color="gray">
                                    Select a shade or type custom HEX
                                </Typography>
                            </View>
                            <Pressable
                                onPress={closeColorEditor}
                                className="px-4 py-1.5 rounded-full bg-[#FF5678] active:opacity-90"
                            >
                                <Typography variant="small" weight="bold" color="white" className="text-xs">
                                    Done
                                </Typography>
                            </Pressable>
                        </View>

                        {editingColorIndex !== null && currentPalette.colors[editingColorIndex] && (
                            <>
                                {/* Live Color Preview Banner */}
                                <View
                                    style={{ backgroundColor: currentPalette.colors[editingColorIndex].hex }}
                                    className="p-3 rounded-2xl p-3.5 flex-row items-center justify-between mb-4"
                                >
                                    <View className="bg-black/40 rounded-xl px-3 py-1.5">
                                        <Typography variant="small" weight="bold" color="white" className="text-sm">
                                            {currentPalette.colors[editingColorIndex].name}
                                        </Typography>
                                        <Typography variant="small" color="white" className="font-mono text-xs opacity-90">
                                            {currentPalette.colors[editingColorIndex].hex}
                                        </Typography>
                                    </View>
                                    <View className="flex-row items-center gap-2">
                                        <Pressable
                                            onPress={randomizeCurrentSwatch}
                                            className="w-9 h-9 rounded-full bg-black/40 items-center justify-center active:scale-95"
                                        >
                                            <Refresh size={16} color="white" />
                                        </Pressable>
                                        <Pressable
                                            onPress={() => copyToClipboard(currentPalette.colors[editingColorIndex].hex)}
                                            className="w-9 h-9 rounded-full bg-black/40 items-center justify-center active:scale-95"
                                        >
                                            <Copy size={16} color="white" />
                                        </Pressable>
                                    </View>
                                </View>

                                {/* Custom HEX Input */}
                                <View className="mb-4">
                                    <Typography variant="caption" weight="bold" className="uppercase tracking-widest text-[10px] text-gray-400 mb-2">
                                        Custom HEX Code
                                    </Typography>
                                    <View className={`flex-row items-center h-11 px-3.5 rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-50 border-gray-200'
                                        }`}>
                                        <Typography variant="body" weight="bold" className="text-gray-400 mr-1.5">
                                            #
                                        </Typography>
                                        <TextInput
                                            placeholder="E.g. FF5678"
                                            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                                            value={customHexInput}
                                            onChangeText={handleHexChange}
                                            maxLength={6}
                                            autoCapitalize="characters"
                                            autoCorrect={false}
                                            className={`flex-1 font-mono text-sm py-0 ${isDark ? 'text-white' : 'text-black'}`}
                                        />
                                        {customHexInput.length > 0 && (
                                            <View
                                                style={{ backgroundColor: `#${customHexInput}` }}
                                                className="w-6 h-6 rounded-md border border-black/10"
                                            />
                                        )}
                                    </View>
                                </View>

                                {/* Curated Designer Shades Grid */}
                                <Typography variant="caption" weight="bold" className="uppercase tracking-widest text-[10px] text-gray-400 mb-2.5">
                                    Designer Palette Shades
                                </Typography>
                                <ScrollView showsVerticalScrollIndicator={false} className="max-h-56">
                                    <View className="flex-row flex-wrap gap-2.5 pb-4 justify-center">
                                        {PANTONE_COLOR_CATALOG.map((color) => {
                                            const isSelected =
                                                currentPalette.colors[editingColorIndex]?.hex.toLowerCase() === color.hex.toLowerCase();
                                            return (
                                                <Pressable
                                                    key={color.hex + color.name}
                                                    onPress={() => {
                                                        setCustomHexInput(color.hex.replace('#', ''));
                                                        updateCurrentSwatch(color.hex, color.name);
                                                    }}
                                                    style={{ backgroundColor: color.hex }}
                                                    className={`w-11 h-11 rounded-xl items-center justify-center border active:scale-90 ${isSelected ? 'border-2 border-white scale-105' : 'border-black/10'
                                                        }`}
                                                >
                                                    {isSelected && (
                                                        <View className="w-3.5 h-3.5 rounded-full bg-white items-center justify-center">
                                                            <Svg width="24" height="24" viewBox="0 0 24 24"><Path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m5 14l3.5 3.5L19 6.5" /></Svg>
                                                        </View>
                                                    )}
                                                </Pressable>
                                            );
                                        })}
                                    </View>
                                </ScrollView>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
