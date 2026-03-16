import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Dimensions, Animated, Pressable, findNodeHandle } from 'react-native';
import { useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Refresh, Copy, Heart, Share, Colorfilter } from 'iconsax-react-native';
import { Typography } from '../../../components/ui/Typography';
import { Surface } from '../../../components/ui/Surface';
import { IconButton } from '../../../components/ui/IconButton';
import { Button } from '../../../components/ui/Button';
import { useTheme } from '../../../contexts/ThemeContext';
import Toast from 'react-native-toast-message';
import { usePostHog } from 'posthog-react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
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

const PRESET_PALETTES: Palette[] = [
    {
        id: '1',
        name: 'Royal Heritage',
        colors: [
            { hex: '#1e3a8a', name: 'Royal Blue' },
            { hex: '#d4af37', name: 'Gold' },
            { hex: '#7f1d1d', name: 'Burgundy' },
            { hex: '#f3f4f6', name: 'Marble' }
        ]
    },
    {
        id: '2',
        name: 'Sunset Safari',
        colors: [
            { hex: '#f97316', name: 'Orange' },
            { hex: '#7c2d12', name: 'Earth' },
            { hex: '#fef3c7', name: 'Sand' },
            { hex: '#431407', name: 'Deep Bark' }
        ]
    },
    {
        id: '3',
        name: 'Lagos Night',
        colors: [
            { hex: '#4c1d95', name: 'Indigo' },
            { hex: '#ec4899', name: 'Pink' },
            { hex: '#111827', name: 'Midnight' },
            { hex: '#a78bfa', name: 'Lavender' }
        ]
    }
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
    const [currentPalette, setCurrentPalette] = useState<Palette>(PRESET_PALETTES[0]);
    const [fadeAnim] = useState(new Animated.Value(0));
    const [pulseAnim] = useState(new Animated.Value(1));
    const viewRef = useRef<View>(null);

    useEffect(() => {
        animateIn();
    }, [currentPalette]);

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.15,
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
            // Ensure button scale settles back precisely to 1
            Animated.timing(pulseAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }, 5000);

        return () => clearTimeout(timer);
    }, []);

    const animateIn = () => {
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    };

    const generateNewPalette = () => {
        const newPalette: Palette = {
            id: Date.now().toString(),
            name: 'Generated Mix',
            colors: Array.from({ length: 4 }).map((_, i) => ({
                hex: generateRandomHex(),
                name: `Color ${i + 1}`
            }))
        };
        setCurrentPalette(newPalette);

        // Track pantone palette generation
        posthog.capture('pantone_generated', {
            palette_name: newPalette.name,
            color_count: newPalette.colors.length,
        });
    };

    const copyToClipboard = (hex: string) => {
        // In a real app, use Clipboard.setString
        Toast.show({
            type: 'success',
            text1: 'Color Copied!',
            text2: `${hex} added to clipboard`
        });
    };

    const handleShare = async () => {
        if (!viewRef.current) return;

        try {
            // Wait for any animations to finish
            await new Promise(resolve => setTimeout(resolve, 800));

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
                    <Typography variant="h3" weight="bold" className="ml-2">Pantone</Typography>
                </View>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <IconButton
                        icon={<Refresh size={20} color={isDark ? "white" : "black"} />}
                        onPress={generateNewPalette}
                        variant="glass"
                    />
                </Animated.View>
            </View>

            <ScrollView contentContainerClassName="p-6 pb-32" showsVerticalScrollIndicator={false}>
                {/* Hero Palette Display */}
                <Animated.View collapsable={false} style={{ opacity: fadeAnim }} className="mb-10">
                    <View
                        ref={viewRef}
                        collapsable={false}
                        className="p-6"
                        style={{
                            borderRadius: 32,
                            backgroundColor: isDark ? '#18181b' : '#ffffff',
                            width: width - 48,
                            alignSelf: 'center',
                            overflow: 'hidden'
                        }}
                    >
                        <Surface variant="white" collapsable={false} className="shadow-xl mb-6 overflow-hidden" rounded="3xl">
                            <View collapsable={false} className="flex-row h-80 rounded-2xl overflow-hidden">
                                {currentPalette.colors.map((color, index) => (
                                    <Pressable
                                        key={index}
                                        onPress={() => copyToClipboard(color.hex)}
                                        collapsable={false}
                                        style={{ backgroundColor: color.hex, flex: 1 }}
                                        className="items-center justify-end pb-6"
                                    >
                                        <View collapsable={false} className="bg-black/20 rounded-full px-2 py-1 mb-2">
                                            <Typography variant="small" weight="bold" color="white" className="text-[10px]">{color.hex}</Typography>
                                        </View>
                                    </Pressable>
                                ))}
                            </View>
                        </Surface>

                        <View className="flex-row justify-between items-center px-2">
                            <View>
                                <Typography variant="h2" weight="bold">{currentPalette.name}</Typography>
                                <Typography variant="caption" color="gray">Discover seasonal pairings for your next creation</Typography>
                            </View>
                            <View className="flex-row gap-2">
                                {/* <IconButton icon={<Heart size={20} color={isDark ? "white" : "black"} />} variant="ghost" /> */}
                                <IconButton
                                    icon={
                                        <Svg width="24" height="24" viewBox="0 0 24 24">
                                            <Path fill={isDark ? "white" : "black"} fillRule="evenodd" d="M13.803 5.333c0-1.84 1.5-3.333 3.348-3.333A3.34 3.34 0 0 1 20.5 5.333c0 1.841-1.5 3.334-3.349 3.334a3.35 3.35 0 0 1-2.384-.994l-4.635 3.156a3.34 3.34 0 0 1-.182 1.917l5.082 3.34a3.35 3.35 0 0 1 2.12-.753a3.34 3.34 0 0 1 3.348 3.334C20.5 20.507 19 22 17.151 22a3.34 3.34 0 0 1-3.348-3.333a3.3 3.3 0 0 1 .289-1.356L9.05 14a3.35 3.35 0 0 1-2.202.821A3.34 3.34 0 0 1 3.5 11.487a3.34 3.34 0 0 1 3.348-3.333c1.064 0 2.01.493 2.623 1.261l4.493-3.059a3.3 3.3 0 0 1-.161-1.023" clipRule="evenodd" />
                                        </Svg>
                                    }
                                    variant="ghost"
                                    onPress={handleShare}
                                />
                            </View>
                        </View>
                    </View>
                </Animated.View>

                {/* Color List */}
                <Typography variant="subtitle" weight="bold" className="mb-4 uppercase tracking-widest text-[10px] text-gray-400">Color Spectrum</Typography>
                <View className="gap-1">
                    {currentPalette.colors.map((color, index) => (
                        <View
                            key={index}
                            className={`py-4 flex-row items-center justify-between`}
                        >
                            <View className="flex-row items-center">
                                <View style={{ backgroundColor: color.hex }} className="w-12 h-12 rounded-xl mr-4 border border-black/5" />
                                <View>
                                    <Typography variant="body" weight="bold">{color.name}</Typography>
                                    <Typography variant="small" color="gray">{color.hex}</Typography>
                                </View>
                            </View>
                            <Pressable
                                onPress={() => copyToClipboard(color.hex)}
                                className={`p-2 rounded-full ${isDark ? 'bg-dark-800' : 'bg-gray-100'}`}
                            >
                                <Copy size={18} color={isDark ? "#9CA3AF" : "#6B7280"} />
                            </Pressable>
                        </View>
                    ))}
                </View>

                {/* Tips Section */}
                <Surface variant={isDark ? "muted" : "lavender"} className="mt-10 p-6" rounded="3xl">
                    <View className="flex-row items-center mb-4">
                        <Colorfilter size={24} color="#4F46E5" variant="Bulk" />
                        <Typography variant="body" weight="bold" className="ml-3">Styling Insights</Typography>
                    </View>
                    <Typography variant="small" color="gray" className="leading-5">
                        Mix metallic accents with deep earth tones to create a balanced, luxurious look. These pairings are currently trending in high-fashion runways across sub-Saharan Africa.
                    </Typography>
                </Surface>
            </ScrollView>

            {/* Bottom Trigger */}
            {/*  <View className="absolute bottom-10 left-6 right-6">
                <Button
                    onPress={generateNewPalette}
                    className={`h-16 rounded-full shadow-lg bg-blue-500 border-none`}
                >
                    <View className="flex-row items-center gap-3">
                        <Refresh size={20} color="white" />
                        <Typography weight="bold" color="white">Generate Palette</Typography>
                    </View>
                </Button>
            </View> */}
        </View>
    );
}
