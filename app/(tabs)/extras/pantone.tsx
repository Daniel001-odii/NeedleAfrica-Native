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

const STYLING_INSIGHTS = [
    {
        title: "Complementary Contrast",
        insight: "Pair colors opposite on the color wheel (e.g. blue + orange) to create high visual impact and bold statement pieces.",
        use_case: "Streetwear, statement outfits, editorial looks"
    },
    {
        title: "Analogous Harmony",
        insight: "Use colors next to each other on the wheel (e.g. blue, teal, green) for a cohesive and calm aesthetic.",
        use_case: "Luxury wear, minimal collections, soft tailoring"
    },
    {
        title: "Monochrome Layering",
        insight: "Work within one hue using different tints, tones, and shades to create depth without visual noise.",
        use_case: "Capsule wardrobes, elevated basics"
    },
    {
        title: "Neutral Anchoring",
        insight: "Balance bold Pantone colors with neutrals like beige, black, white, or grey to avoid overwhelming the design.",
        use_case: "Commercial fashion, ready-to-wear collections"
    },
    {
        title: "Warm vs Cool Balance",
        insight: "Combine warm tones (reds, oranges) with cool tones (blues, greens) to create dynamic tension and visual balance.",
        use_case: "Seasonal transitions, standout pieces"
    },
    {
        title: "Saturation Control",
        insight: "Pair a highly saturated color with a muted or desaturated tone to prevent color competition.",
        use_case: "Daywear, wearable fashion"
    },
    {
        title: "Value Contrast",
        insight: "Mix light and dark Pantone shades to improve silhouette visibility and structure.",
        use_case: "Layered outfits, tailoring, outerwear"
    },
    {
        title: "Accent Pop Strategy",
        insight: "Use one bright Pantone color as an accent against a subdued base palette.",
        use_case: "Accessories, trims, branding elements"
    },
    {
        title: "Seasonal Palette Alignment",
        insight: "Use lighter, airy Pantones for spring/summer and deeper, richer tones for fall/winter collections.",
        use_case: "Collection planning, trend alignment"
    },
    {
        title: "Cultural & Market Context",
        insight: "Consider regional color preferences and symbolism when pairing Pantone shades.",
        use_case: "Global fashion lines, targeted markets"
    },
    {
        title: "Texture Interaction",
        insight: "The same Pantone color can appear different on silk vs denim vs leather—pair with material in mind.",
        use_case: "Fabric selection, premium design"
    },
    {
        title: "Print & Pattern Balance",
        insight: "When working with prints, anchor with one dominant Pantone and support with secondary tones.",
        use_case: "Textile design, patterned garments"
    },
    {
        title: "Trend vs Timeless Mix",
        insight: "Combine trending Pantone colors with classic staples to extend product lifespan.",
        use_case: "Retail collections, evergreen pieces"
    },
    {
        title: "Skin Tone Consideration",
        insight: "Choose pairings that complement a wide range of skin undertones for broader appeal.",
        use_case: "Inclusive fashion lines"
    },
    {
        title: "Contrast Placement",
        insight: "Strategically place contrasting colors to highlight or contour body areas.",
        use_case: "Fit-enhancing designs, couture"
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
    const [currentInsight, setCurrentInsight] = useState(STYLING_INSIGHTS[0]);
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

        // Randomize insight
        const randomInsight = STYLING_INSIGHTS[Math.floor(Math.random() * STYLING_INSIGHTS.length)];
        setCurrentInsight(randomInsight);

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
                        <Typography variant="body" weight="bold" className="ml-3">{currentInsight.title}</Typography>
                    </View>
                    <Typography variant="small" color="gray" className="leading-5 mb-3">
                        {currentInsight.insight}
                    </Typography>
                    <View className="flex-row items-center">
                        <Typography variant="small" weight="bold" color="primary" className="text-[10px] uppercase">Best for: </Typography>
                        <Typography variant="small" color="gray" className="text-[10px] italic">{currentInsight.use_case}</Typography>
                    </View>
                </Surface>
            </ScrollView>

            {/* Floating Action Button */}
            <Animated.View
                className="absolute bottom-10 right-6"
                style={{ transform: [{ scale: pulseAnim }] }}
            >
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={generateNewPalette}
                    className={`w-16 h-16 rounded-full items-center justify-center shadow-xl ${isDark ? 'bg-white' : 'bg-black'}`}
                    style={{
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4.65,
                        elevation: 8,
                    }}
                >
                    <Refresh size={24} color={isDark ? "black" : "white"} />
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}
