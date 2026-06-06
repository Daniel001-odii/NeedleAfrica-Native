import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Modal,
    ImageBackground,
    Image,
    Linking,
    Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography } from './ui/Typography';
import Toast from 'react-native-toast-message';
import Svg, { G, Path } from 'react-native-svg';
import axiosInstance from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';
import { Confetti } from './Confetti';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import QRCodeStyled from 'react-native-qrcode-styled';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CatalogVisibilityModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    skipToShare?: boolean;
}

export function HugeiconsTick02(props: any) {
    return (
        <Svg className={props} width="1em" height="1em" viewBox="0 0 24 24">
            <Path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m5 14l3.5 3.5L19 6.5" />
        </Svg>
    )
}

export const CatalogVisibilityModal: React.FC<CatalogVisibilityModalProps> = ({
    visible,
    onClose,
    onSuccess,
    skipToShare = false,
}) => {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [isSuccessState, setIsSuccessState] = useState(false);
    const [catalogData, setCatalogData] = useState<any>(null);
    const [sharingLoading, setSharingLoading] = useState(false);
    const [selectedColor, setSelectedColor] = useState('#E84C3D');
    const [backgroundImage, setBackgroundImage] = useState<'share1' | 'share2'>('share2');

    const viewShotRef = useRef<ViewShot>(null);

    const PREDEFINED_COLORS = ['#E84C3D', '#2ECC71', '#3498DB', '#F39C12', '#9B59B6'];

    useEffect(() => {
        if (visible) {
            fetchCatalogDetails();
            if (skipToShare) {
                setIsSuccessState(true);
            }
        }
    }, [visible]);

    const fetchCatalogDetails = async () => {
        try {
            const res = await axiosInstance.get('/catalog');
            if (res.data) {
                setCatalogData(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch catalog details in modal:', error);
        }
    };

    const handleTurnOnCatalog = async () => {
        try {
            setLoading(true);
            await axiosInstance.patch('/catalog', { catalogEnabled: true });

            // Fetch updated catalog details (specifically ID)
            await fetchCatalogDetails();

            Toast.show({
                type: 'success',
                text1: 'Catalog is now live!',
                text2: 'Your free business website is now visible to customers.',
            });

            setIsSuccessState(true);
        } catch (error: any) {
            console.error('Failed to enable catalog:', error);
            Toast.show({
                type: 'error',
                text1: 'Something went wrong',
                text2: error?.response?.data?.error || 'Failed to turn on catalog. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleShareAsset = async () => {
        if (sharingLoading) return;
        try {
            setSharingLoading(true);
            if (viewShotRef.current?.capture) {
                const uri = await viewShotRef.current.capture();
                if (uri && await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(uri, { UTI: 'public.png', mimeType: 'image/png' });
                } else {
                    Toast.show({
                        type: 'error',
                        text1: 'Sharing Unavailable',
                        text2: 'Could not share the asset on this device.',
                    });
                }
            }
        } catch (error) {
            console.error('Failed to share card:', error);
            Toast.show({
                type: 'error',
                text1: 'Share Failed',
                text2: 'An error occurred while generating the share card.',
            });
        } finally {
            setSharingLoading(false);
        }
    };

    const handleCloseSuccess = () => {
        onSuccess?.();
        onClose();
        setIsSuccessState(false);
    };

    if (!visible) return null;

    // Computed attributes for social share card
    const storeName = user?.businessName || user?.username || 'My Store';

    // Choose logo source (Remote vs Fallback Local Logo)
    const logoUrl = catalogData?.businessLogo || user?.profilePicture;
    const logoSource = logoUrl ? { uri: logoUrl } : require('../assets/logo.png');

    // Phone number format
    const formattedPhone = user?.phoneNumber || '';

    // Social handle priority: Instagram > TikTok > Facebook > Twitter
    const getSocialHandle = () => {
        if (catalogData?.instagram) {
            const handle = catalogData.instagram.trim();
            return handle.startsWith('@') ? handle : `@${handle}`;
        }
        if (catalogData?.tiktok) {
            const handle = catalogData.tiktok.trim();
            return handle.startsWith('@') ? handle : `@${handle}`;
        }
        if (catalogData?.facebook) {
            const handle = catalogData.facebook.trim();
            return handle;
        }
        if (catalogData?.twitter) {
            const handle = catalogData.twitter.trim();
            return handle.startsWith('@') ? handle : `@${handle}`;
        }
        // Fallback
        const fallback = user?.businessName || user?.username || 'needleafrica';
        const cleanFallback = fallback.replace(/\s+/g, '').toLowerCase();
        return `@${cleanFallback}`;
    };

    const catalogId = catalogData?.nxFormattedId || catalogData?.id || 'store';
    const catalogUrl = `https://catalog.needleafrica.com/cg/${catalogId}`;
    const truncatedUrl = `catalog.needleafrica.com/cg/${catalogId}`;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black">
                {isSuccessState && <Confetti />}

                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                >
                    {!isSuccessState ? (
                        /* INITIAL ENABLE STATE SCREEN */
                        <ImageBackground
                            source={require('../assets/images/clothes_hanger.jpg')}
                            style={{ flex: 1 }}
                            resizeMode="cover"
                        >
                            <LinearGradient
                                colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.98)']}
                                style={{ flex: 1 }}
                            >
                                <SafeAreaView style={{ flex: 1 }} edges={[]}>
                                    {/* Header with Safe Area Padding */}
                                    <View
                                        className="flex-row justify-between items-center px-5"
                                        style={{ paddingTop: insets.top + 10 }}
                                    >
                                        <TouchableOpacity onPress={onClose} className="p-2 rounded-full bg-black/50">
                                            <Svg width="24" height="24" viewBox="0 0 24 24">
                                                <Path
                                                    fill="none"
                                                    stroke="white"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="1.5"
                                                    d="M18 6L6 18m12 0L6 6"
                                                />
                                            </Svg>
                                        </TouchableOpacity>
                                    </View>

                                    {/* MAIN CONTENT */}
                                    <View className="flex-1 justify-between">
                                        {/* Branding / Headline (Will stick to top) */}
                                        <View className="mt-8 px-6">
                                            <View className="items-left mb-6">
                                                <Typography variant="h2" weight="bold" color="white" className="text-left text-2xl">
                                                    Your Free Business Website
                                                </Typography>
                                                <Typography variant="subtitle" color="white" className="text-left opacity-80 mt-2">
                                                    Now available on the Free plan! Showcase your work and get discovered by new customers online.
                                                </Typography>
                                            </View>

                                            {/* Features List */}
                                            <View className="mb-4">
                                                {[
                                                    "Upload up to 3 catalog items for free",
                                                    "Share your unique link with customers",
                                                    "Receive orders directly from your website"
                                                ].map((feature, idx) => (
                                                    <View key={idx} className="flex-row items-center mb-2">
                                                        <Svg color={"pink"} width="20" height="20" viewBox="0 0 24 24">
                                                            <Path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m5 14l3.5 3.5L19 6.5" />
                                                        </Svg>
                                                        <Typography variant="body" color="white" className="ml-3 text-sm text-center font-medium opacity-90">
                                                            {feature}
                                                        </Typography>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>

                                        {/* BUTTON SECTION (Will stick to bottom) */}
                                        <View className="px-6 pb-6 mt-2">
                                            <TouchableOpacity
                                                activeOpacity={0.8}
                                                onPress={handleTurnOnCatalog}
                                                disabled={loading}
                                                className="h-14 rounded-full items-center justify-center shadow-lg shadow-indigo-500/40 bg-indigo-500"
                                            >
                                                {loading ? (
                                                    <ActivityIndicator color="white" />
                                                ) : (
                                                    <View className="flex-row items-center">
                                                        <Typography variant="subtitle" weight="bold" color="white">
                                                            Turn On My Catalog
                                                        </Typography>
                                                    </View>
                                                )}
                                            </TouchableOpacity>

                                            <Typography variant="small" color="white" className="text-center opacity-40 mt-4 px-4 leading-4">
                                                You can manage your catalog visibility anytime from your profile settings.
                                            </Typography>
                                        </View>
                                    </View>
                                </SafeAreaView>
                            </LinearGradient>
                        </ImageBackground>
                    ) : (
                        /* SUCCESS STATE & SOCIAL SHARE GENERATION */
                        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
                            <View className="flex-1 justify-between px-6 py-4">
                                {/* Success Header */}
                                {skipToShare ? (
                                    <View className="flex-row justify-end items-center mb-4 mt-2">
                                        <TouchableOpacity onPress={onClose} className="p-2 rounded-full bg-white/10">
                                            <Svg width="24" height="24" viewBox="0 0 24 24">
                                                <Path
                                                    fill="none"
                                                    stroke="white"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="1.5"
                                                    d="M18 6L6 18m12 0L6 6"
                                                />
                                            </Svg>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View className="items-center mb-4 mt-2">
                                        {/* <View className="w-12 h-12 bg-green-500/10 rounded-full items-center justify-center mb-3">
                                            <HugeiconsTick02 className="text-green-500 text-2xl" />
                                        </View> */}
                                        <Typography variant="h2" weight="bold" color="white" className="text-center text-xl">
                                            Your Catalog is Live!
                                        </Typography>
                                        <Typography variant="body" color="white" className="text-center opacity-70 text-xs mt-1 px-4 leading-4">
                                            Congratulations! Your digital storefront is now open to the world. Share your unique link and start taking orders.
                                        </Typography>
                                    </View>
                                )}

                                {/* Visual Preview Card Wrapper */}
                                <View className="items-center justify-center my-3">
                                    <ViewShot
                                        ref={viewShotRef}
                                        options={{ format: 'png', quality: 1.0 }}
                                        style={{
                                            width: 300,
                                            height: 375,
                                            overflow: 'hidden',
                                            backgroundColor: selectedColor,
                                        }}
                                    >
                                        <ImageBackground
                                            source={
                                                backgroundImage === 'share2'
                                                    ? require('../assets/images/social_share_2.png')
                                                    : require('../assets/images/social_share_1.png')
                                            }
                                            style={{ width: '100%', height: '100%' }}
                                            resizeMode="cover"
                                        >
                                            {/* a. Store Name & Logo (Empty box at top) */}
                                            {/* Position range: Y: 17.7% to 20.6%, X: 20.1% to 79.7% */}
                                            <View style={{
                                                position: 'absolute',
                                                top: '6%',
                                                left: '20.1%',
                                                width: '59.6%',
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                
                                            }}>
                                                <Image
                                                    source={logoSource}
                                                    style={{ width: 25, height: 25, borderRadius: 7, marginRight: 5 }}
                                                />
                                                <Typography
                                                    variant="small"
                                                    weight="bold"
                                                    color="white"
                                                    style={{ fontSize: 30 }}
                                                    numberOfLines={1}
                                                    className=' pt-5'
                                                >
                                                    {storeName}
                                                </Typography>
                                            </View>

                                            {/* b. Custom QRCode with Logo in Middle */}
                                            {/* Position range: Y: 33.8% to 62.1%, X: 24.2% to 75.9% */}
                                            <View style={{
                                                position: 'absolute',
                                                top: '36%',
                                                left: '24.2%',
                                                width: '51.7%',
                                                height: '28.3%',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}>
                                                <QRCodeStyled
                                                    data={catalogUrl} // Use 'data' instead of 'value'
                                                    size={135}        // Replaces 'pieceSize'. Sets total QR dimension
                                                    pieceCornerType="rounded"
                                                    logo={{
                                                        href: logoSource,
                                                    }}
                                                    pieceBorderRadius={2}
                                                    outerEyesOptions={{
                                                        borderRadius: [12, 12, 12, 12], // Rounds all 4 corners of the outer frames
                                                    }}
                                                    // Styles the smaller, solid INNER blocks
                                                    innerEyesOptions={{
                                                        borderRadius: [6, 6, 6, 6], // Rounds all 4 corners of the inner solid blocks
                                                    }}
                                                />
                                            </View>

                                            {/* c. Storefront Link Truncated */}
                                            {/* Position range: Y: 73.1% to 79.5%, X: 32% to 75.0% */}
                                            <View style={{
                                                position: 'absolute',
                                                top: '75.0%',
                                                left: '31.0%',
                                                height: '6.4%',
                                                justifyContent: 'center',
                                            }}>
                                                <Typography
                                                    variant="small"
                                                    weight="semibold"
                                                    color={backgroundImage === 'share2' ? "white" : "black"}
                                                    style={{ fontSize: 6 }}
                                                    numberOfLines={1}
                                                    ellipsizeMode="tail"
                                                >
                                                    {truncatedUrl}
                                                </Typography>
                                            </View>

                                            {/* d. Social Handle (Footer Left) */}
                                            {/* Position range: Y: 84.0% to 88.0%, X: 12.0% to 48.0% */}
                                            <View style={{
                                                position: 'absolute',
                                                top: '86.5%',
                                                left: '12.0%',
                                                width: '36.0%',
                                                height: '4.0%',
                                                justifyContent: 'center',
                                            }}>
                                                <Typography
                                                    variant="small"
                                                    weight="bold"
                                                    color="black"
                                                    style={{ fontSize: 12 }}
                                                    numberOfLines={1}
                                                >
                                                    {getSocialHandle()}
                                                </Typography>
                                            </View>

                                            {/* e. Phone Number (Footer Right WhatsApp BG) */}
                                            {/* Position range: Y: 84.0% to 88.0%, X: 64.0% to 92.0% */}
                                            <View style={{
                                                position: 'absolute',
                                                top: '86.8%',
                                                left: '60.0%',
                                                width: '28.0%',
                                                height: '4.0%',
                                                justifyContent: 'center',
                                            }}>
                                                <Typography
                                                    variant="small"
                                                    weight="bold"
                                                    color="white"
                                                    style={{ fontSize: 8 }}
                                                    numberOfLines={1}
                                                >
                                                    {formattedPhone}
                                                </Typography>
                                            </View>
                                        </ImageBackground>
                                    </ViewShot>

                                    {/* Color Picker & Background Toggle */}
                                    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 14, marginTop: 16 }}>
                                        {PREDEFINED_COLORS.map((color) => {
                                            const isSelected = selectedColor === color && backgroundImage === 'share2';
                                            return (
                                                <TouchableOpacity
                                                    key={color}
                                                    activeOpacity={0.7}
                                                    onPress={() => {
                                                        setSelectedColor(color);
                                                        setBackgroundImage('share2');
                                                    }}
                                                    style={{
                                                        width: 32,
                                                        height: 32,
                                                        borderRadius: 16,
                                                        backgroundColor: color,
                                                        borderWidth: isSelected ? 3 : 0,
                                                        borderColor: 'white',
                                                    }}
                                                />
                                            );
                                        })}
                                        <TouchableOpacity
                                            activeOpacity={0.7}
                                            onPress={() => {
                                                setBackgroundImage('share1');
                                            }}
                                            style={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: 16,
                                                backgroundColor: '#222222',
                                                borderWidth: backgroundImage === 'share1' ? 3 : 0,
                                                borderColor: 'white',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                overflow: 'hidden',
                                            }}
                                        >
                                           <Svg width="20" height="20" viewBox="0 0 24 24"><G fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">
                                            <Path d="m3 16l4.47-4.47a1.81 1.81 0 0 1 2.56 0L14 15.5m1.5 1.5L14 15.5m7 .5l-2.47-2.47a1.81 1.81 0 0 0-2.56 0L14 15.5M15.5 8a.5.5 0 0 0 0-1m0 1a.5.5 0 0 1 0-1m0 1V7"/>
                                            <Path d="M3.698 19.747C2.5 18.345 2.5 16.23 2.5 12s0-6.345 1.198-7.747q.256-.3.555-.555C5.655 2.5 7.77 2.5 12 2.5s6.345 0 7.747 1.198q.3.256.555.555C21.5 5.655 21.5 7.77 21.5 12s0 6.345-1.198 7.747q-.256.3-.555.555C18.345 21.5 16.23 21.5 12 21.5s-6.345 0-7.747-1.198q-.3-.256-.555-.555"/></G></Svg>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Action Buttons */}
                                <View className="gap-y-3 w-full pb-4">
                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        onPress={handleShareAsset}
                                        disabled={sharingLoading}
                                        className="h-14 rounded-full items-center justify-center bg-indigo-500 shadow-md flex-row"
                                    >
                                        {sharingLoading ? (
                                            <ActivityIndicator color="white" />
                                        ) : (
                                            <View className="flex-row items-center gap-x-2">
                                                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                                    <Path d="M9 12C9 13.6569 7.65685 15 6 15C4.34315 15 3 13.6569 3 12C3 10.3431 4.34315 9 6 9C7.65685 9 9 10.3431 9 12Z" stroke="white" strokeWidth="1.5" />
                                                    <Path d="M21 6C21 7.65685 19.6569 9 18 9C16.3431 9 15 7.65685 15 6C15 4.34315 16.3431 3 18 3C19.6569 3 21 4.34315 21 6Z" stroke="white" strokeWidth="1.5" />
                                                    <Path d="M21 18C21 19.6569 19.6569 21 18 21C16.3431 21 15 19.6569 15 18C15 16.3431 16.3431 15 18 15C19.6569 15 21 16.3431 21 18Z" stroke="white" strokeWidth="1.5" />
                                                    <Path d="M8.5 10.5L15.5 7" stroke="white" strokeWidth="1.5" />
                                                    <Path d="M8.5 13.5L15.5 17" stroke="white" strokeWidth="1.5" />
                                                </Svg>
                                                <Typography variant="subtitle" weight="bold" color="white">
                                                    Share
                                                </Typography>
                                            </View>
                                        )}
                                    </TouchableOpacity>

                                    {skipToShare ? (
                                        <TouchableOpacity
                                            activeOpacity={0.8}
                                            onPress={onClose}
                                            className="h-14 rounded-full items-center justify-center bg-white/10"
                                        >
                                            <Typography variant="subtitle" weight="bold" color="white">
                                                Close
                                            </Typography>
                                        </TouchableOpacity>
                                    ) : (
                                        <TouchableOpacity
                                            activeOpacity={0.8}
                                            onPress={handleCloseSuccess}
                                            className="h-14 rounded-full items-center justify-center bg-white/10"
                                        >
                                            <Typography variant="subtitle" weight="bold" color="white">
                                                Go to Dashboard
                                            </Typography>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </SafeAreaView>
                    )}
                </ScrollView>
            </View>
        </Modal>
    );
};