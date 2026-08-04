import React from 'react';
import { View, ScrollView, Pressable, Alert, ImageBackground, ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    DocumentText,
    PenTool,
    Colorfilter,
    Gallery,
    Ruler,
    Calculator,
} from 'iconsax-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { useRevenueCat } from '../../../hooks/useRevenueCat';
import { Typography } from '../../../components/ui/Typography';
import { VirtualTryOnIcon, UnsplashIcon, PinterestIcon } from '../../../components/ui/CustomIcons';

export default function Extras() {
    const router = useRouter();
    const { isDark } = useTheme();
    const { isPro } = useRevenueCat();

    const handleAiPress = (feature: 'virtual-tryon' | 'sketch-to-design') => {
        router.push(feature === 'virtual-tryon' ? '/ai-lab/virtual-tryon' : '/ai-lab/sketch-to-design');
    };

    return (
        <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-white'}`}>

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

                {/* Hero: Catalog Gallery */}
                <View className="px-4 mt-6">
                    <Pressable
                        onPress={() => router.push('/extras/catalog-gallery' as any)}
                        className="overflow-hidden rounded-[28px]"
                        style={{ height: 180 }}
                    >
                        <ImageBackground
                            source={require('../../../assets/images/clothes_hanger.jpg')}
                            resizeMode="cover"
                            className="w-full h-full"
                        >
                            <View className="w-full h-full" style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}>
                                <View className="p-6 z-10 w-3/4">
                                    <Typography variant="h3" weight="bold" color="white">Catalog Gallery</Typography>
                                    <Typography variant="small" className="text-white/80 mt-1 mb-4">
                                        Showcase your best designs and get orders directly from clients.
                                    </Typography>
                                    <View className="bg-white self-start px-5 py-2.5 mt-12 rounded-full shadow-sm">
                                        <Typography variant="small" weight="bold" className="text-black">Open My Gallery</Typography>
                                    </View>
                                </View>
                            </View>
                        </ImageBackground>
                    </Pressable>
                </View>

                {/* Creative Tools – Bento Grid */}
                <SectionLabel label="Creative Tools" />
                <View className="px-4" style={{ gap: 10 }}>
                    {/* Row 1: equal */}
                    <View className="flex-row" style={{ gap: 10 }}>
                        <BentoCard
                            icon={<DocumentText size={22} color="#ffffff" variant="Bulk" />}
                            title="Invoice Editor"
                            desc="Billing & client receipts"
                            onPress={() => router.push('/(tabs)/orders/invoices/settings' as any)}
                            bgImage={require('../../../assets/images/bento_invoice.jpg')}
                            accent="violet"
                            height={140}
                            flex={1}
                        />
                        <BentoCard
                            icon={<Colorfilter size={22} color="#ffffff" variant="Bulk" />}
                            title="Pantone Generator"
                            desc="Fashion color palettes"
                            onPress={() => router.push('/extras/pantone')}
                            bgImage={require('../../../assets/images/bento_pantone.png')}
                            accent="rose"
                            height={140}
                            flex={1}
                        />
                    </View>

                    {/* Row 2: wide + narrow */}
                    <View className="flex-row" style={{ gap: 10 }}>
                        <BentoCard
                            icon={
                                <View style={{ width: 28, height: 28, position: 'relative' }}>
                                    <PinterestIcon size={20} color="#ffffff" style={{ position: 'absolute', top: 0, left: 0 }} />
                                    <View style={{
                                        position: 'absolute',
                                        bottom: -2,
                                        right: -2,
                                        borderRadius: 6,
                                        padding: 2,
                                    }}>
                                        <UnsplashIcon size={11} color="#ffffff" />
                                    </View>
                                </View>
                            }
                            title="Style Inspo"
                            desc="Browse Pinterest & Unsplash"
                            onPress={() => router.push('/extras/ideas' as any)}
                            // bgImage={require('../../../assets/images/bento_style_inspo.png')}
                            accent="red"
                            height={125}
                            flex={1.6}
                        />
                        <BentoCard
                            icon={<PenTool size={22} color="#ffffff" variant="Bulk" />}
                            title="Monogram"
                            desc="Custom logos"
                            onPress={() => router.push('/extras/monogram' as any)}
                            // bgImage={require('../../../assets/images/bento_monogram.png')}
                            accent="purple"
                            height={125}
                            flex={1}
                        />
                    </View>

                    {/* Row 3: narrow + wide (mirrors Row 2) */}
                    <View className="flex-row" style={{ gap: 10 }}>
                        <BentoCard
                            icon={<Ruler size={22} color="#ffffff" variant="Bulk" />}
                            title="Templates"
                            desc="Measurement presets"
                            onPress={() => router.push('/extras/templates-library' as any)}
                            // bgImage={require('../../../assets/images/bento_templates.png')}
                            accent="orange"
                            height={125}
                            flex={1}
                        />
                        <BentoCard
                            icon={<Calculator size={22} color="#ffffff" variant="Bulk" />}
                            title="Pricing Calculator"
                            desc="Fabric & labor costs"
                            onPress={() => router.push('/extras/pricing-calculator' as any)}
                            // bgImage={require('../../../assets/images/bento_pricing.png')}
                            accent="emerald"
                            height={125}
                            flex={1.6}
                            tag="NEW"
                        />
                    </View>
                </View>

                {/* AI Labs – Bento Grid */}
                <SectionLabel label="AI Labs" showBadge />
                <View className="px-4" style={{ gap: 10 }}>
                    <View className="flex-row" style={{ gap: 10 }}>
                        <BentoCard
                            icon={<VirtualTryOnIcon size={22} color="#ffffff" />}
                            title="Virtual Try-on"
                            desc="Mock designs on client photos"
                            onPress={() => handleAiPress('virtual-tryon')}
                            infoText="Available on Pro plan"
                            // bgImage={require('../../../assets/images/bento_tryon.png')}
                            accent="cyan"
                            height={140}
                            flex={1.4}
                        />
                        <BentoCard
                            icon={<PenTool size={22} color="#ffffff" variant="Bulk" />}
                            title="Sketch to Design"
                            desc="Sketches → realistic fabric"
                            onPress={() => handleAiPress('sketch-to-design')}
                            infoText="Available on Pro plan"
                            // bgImage={require('../../../assets/images/bento_sketch.png')}
                            accent="teal"
                            height={140}
                            flex={1}
                        />
                    </View>
                </View>

            </ScrollView>
        </View>
    );
}

/**
 * Design System Components
 */

function SectionLabel({ label, showBadge }: { label: string; showBadge?: boolean }) {
    return (
        <View className="flex-row items-center mt-10 mb-4 ml-6">
            <Typography variant="caption" color="gray" weight="bold" className="uppercase tracking-widest">
                {label}
            </Typography>
            {showBadge && (
                <View className="ml-2.5 px-2 py-0.5 bg-indigo-500 rounded-lg">
                    <Typography weight="bold" className="text-[9px] text-white">PRO</Typography>
                </View>
            )}
        </View>
    );
}

function BentoCard({
    icon,
    title,
    desc,
    onPress,
    infoText,
    flex = 1,
    height = 130,
    tag,
    bgImage,
    accent = 'teal',
}: {
    icon: any;
    title: string;
    desc: string;
    onPress?: () => void;
    infoText?: string;
    flex?: number;
    height?: number;
    tag?: string;
    bgImage?: ImageSourcePropType;
    accent?: 'teal' | 'rose' | 'red' | 'purple' | 'orange' | 'emerald' | 'violet' | 'cyan';
}) {
    const { isDark } = useTheme();
    const handlePress = () => (onPress ? onPress() : Alert.alert(title, infoText));

    const rgb = {
        teal: '20, 184, 166',
        rose: '244, 63, 94',
        red: '239, 68, 68',
        purple: '168, 85, 247',
        orange: '249, 115, 22',
        emerald: '16, 185, 129',
        violet: '99, 102, 241',
        cyan: '6, 182, 212',
    }[accent] || '99, 102, 241';

    const iconWrapperBg = `rgba(${rgb}, ${isDark ? '0.15' : '0.12'})`;
    const iconColor = `rgb(${rgb})`;
    const bgIconColor = `rgba(${rgb}, ${isDark ? '0.075' : '0.055'})`;

    const bgIconSize = 130;

    let bgIcon = null;
    if (title === 'Style Inspo') {
        bgIcon = <PinterestIcon size={bgIconSize} color={bgIconColor} />;
    } else if (React.isValidElement(icon)) {
        bgIcon = React.cloneElement(icon as React.ReactElement<any>, {
            size: bgIconSize,
            color: bgIconColor,
            variant: 'Bulk'
        });
    }

    let adaptedIcon = icon;
    if (title === 'Style Inspo') {
        adaptedIcon = (
            <View style={{ width: 28, height: 28, position: 'relative' }}>
                <PinterestIcon size={20} color={iconColor} style={{ position: 'absolute', top: 0, left: 0 }} />
                <View style={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    borderRadius: 6,
                    padding: 2,
                }}>
                    <UnsplashIcon size={11} color={iconColor} />
                </View>
            </View>
        );
    } else if (React.isValidElement(icon)) {
        adaptedIcon = React.cloneElement(icon as React.ReactElement<any>, {
            color: iconColor,
        });
    }

    const content = (
        <>
            <View className="flex-row justify-between items-start z-10">
                <View className="w-11 h-11 items-center justify-center rounded-2xl" style={{ backgroundColor: iconWrapperBg }}>
                    {adaptedIcon}
                </View>
                {tag && (
                    <View className="bg-blue-500 px-2 py-0.5 rounded-full">
                        <Typography weight="bold" className="text-[9px] text-white">{tag}</Typography>
                    </View>
                )}
            </View>
            <View className="z-10">
                <Typography weight="bold" variant="body" className={`mb-0.5 ${isDark ? 'text-white' : 'text-zinc-900'}`}>{title}</Typography>
                <Typography variant="small" numberOfLines={2} className={isDark ? 'text-zinc-400' : 'text-zinc-550'}>{desc}</Typography>
            </View>
        </>
    );

    return (
        <Pressable
            onPress={handlePress}
            style={{ flex, height, overflow: 'hidden' }}
            className={`p-5 rounded-[24px] justify-between relative ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-zinc-100'}`}
        >
            <View style={{ position: 'absolute', bottom: -20, right: -20, transform: [{ rotate: '-10deg' }] }}>
                {bgIcon}
            </View>
            {content}
        </Pressable>
    );
}
