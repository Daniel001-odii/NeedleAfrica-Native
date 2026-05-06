import React, { useState, useEffect } from 'react';
import { View, ScrollView, Switch, TouchableOpacity, TextInput, Platform, Modal, Pressable, KeyboardAvoidingView, Image, Linking, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import {
    ArrowLeft,
    Share,
    Magicpen,
    CloseCircle,
    TickCircle,
    Warning2,
    Building,
    Camera,
    StatusUp,
    ShieldTick,
    Activity,
    Eye,
    Refresh2,
    ArrowRight
} from 'iconsax-react-native';
import Svg, { Path } from 'react-native-svg';
import { Typography } from '../../../components/ui/Typography';
import { IconButton } from '../../../components/ui/IconButton';
import { Button } from '../../../components/ui/Button';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import Toast from 'react-native-toast-message';
import CountryPicker, { getAllCountries } from 'react-native-country-picker-modal';
import PhoneInput from 'react-phone-number-input/react-native-input';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SubscriptionModal } from '../../../components/SubscriptionModal';
import { WebView } from 'react-native-webview';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const BUSINESS_TYPE_OPTIONS = [
    'Tailor', 'Fashion Designer', 'Seamstress', 'Pattern Maker', 'Bespoke / Made-to-Measure Brand',
    'Ready-to-Wear Brand', 'Fashion Brand (Bespoke + Ready-to-Wear)', 'Bridal Designer',
    'Uniform / Corporate Maker', 'Costume Designer', 'Atelier / Studio', 'Fashion Student / Apprentice'
];

const PREDEFINED_THEMES = [
    { name: 'Needle Blue', color: '#3b82f6' },
    { name: 'Pure Black', color: '#000000' },
    { name: 'Indigo', color: '#6366f1' },
    { name: 'Forest', color: '#10B981' },
    { name: 'Rose', color: '#F43F5E' },
    { name: 'Luxury Gold', color: '#FDB022' },
];

// Custom Social Icons from Streamline
const XIcon = ({ color }: { color: string }) => (
    <Svg width="18" height="18" viewBox="0 0 24 24">
        <Path fill={color} fillRule="evenodd" d="m13.458 9.122l7.516-7.965h2.491l-.01.011l-8.89 9.424l8.139 10.802a.906.906 0 0 1-.658 1.45H16.95a.9.9 0 0 1-.659-.359l-5.727-7.601l-7.472 7.96H.535l8.922-9.43L1.318 2.612a.906.906 0 0 1 .724-1.452h4.965c.285 0 .553.134.724.361zm-.763 2a1 1 0 0 1-.07-.093l-6.07-8.056H3.86l13.607 18.06h2.696z" clipRule="evenodd" />
    </Svg>
);

const InstagramIcon = ({ color }: { color: string }) => (
    <Svg width="18" height="18" viewBox="0 0 24 24">
        <Path fill={color} fillRule="evenodd" d="M7.5.75A6.75 6.75 0 0 0 .75 7.5v9a6.75 6.75 0 0 0 6.75 6.75h9a6.75 6.75 0 0 0 6.75-6.75v-9A6.75 6.75 0 0 0 16.5.75zM2.25 7.5c0-2.9 2.35-5.25 5.25-5.25h9c2.9 0 5.25 2.35 5.25 5.25v9c0 2.9-2.35 5.25-5.25 5.25h-9a5.25 5.25 0 0 1-5.25-5.25zM19.5 6.25a1.25 1.25 0 1 1-2.5 0a1.25 1.25 0 0 1 2.5 0M12 7.75a4.25 4.25 0 1 0 0 8.5a4.25 4.25 0 0 0 0-8.5M6.25 12a5.75 5.75 0 1 1 11.5 0a5.75 5.75 0 0 1-11.5 0" clipRule="evenodd" />
    </Svg>
);

const FacebookIcon = ({ color }: { color: string }) => (
    <Svg width="18" height="18" viewBox="0 0 24 24">
        <Path fill={color} d="M13.5 1A4.5 4.5 0 0 0 9 5.5V9H6.5a.5.5 0 0 0-.5.5v4a.5.5 0 0 0 .5.5H9v8.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5V14h2.5a.5.5 0 0 0 .485-.379l1-4A.5.5 0 0 0 17.5 9H14V7.5A1.5 1.5 0 0 1 15.5 6h2a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 0-.5-.5z" />
    </Svg>
);

const TikTokIcon = ({ color }: { color: string }) => (
    <Svg width="18" height="18" viewBox="0 0 24 24">
        <Path fill={color} d="M16 1h-3.5v15.5c0 1.5-1.5 3-3 3s-3-.5-3-3c0-2 1.899-3.339 3.5-3V10c-6.12 0-7 5-7 6.5S3.977 23 9.5 23c4.522 0 6.5-3.5 6.5-6V8c1.146 1.018 2.922 1.357 5 1.5V6c-3.017 0-5-2.654-5-5" />
    </Svg>
);

export default function BusinessSettings() {
    const { isDark } = useTheme();
    const { user, updateProfile, uploadProfilePhoto } = useAuth();
    const insets = useSafeAreaInsets();

    const [catalogId, setCatalogId] = useState<string | null>(null);
    const [catalogViews, setCatalogViews] = useState(0);
    const [isEnabled, setIsEnabled] = useState(false);
    const [showPrices, setShowPrices] = useState(true);
    const [showWhatsApp, setShowWhatsApp] = useState(true);

    const [showWebView, setShowWebView] = useState(false);
    const [webViewLoading, setWebViewLoading] = useState(true);
    const [webViewKey, setWebViewKey] = useState(0);

    const [businessName, setBusinessName] = useState(user?.businessName || '');
    const [headline, setHeadline] = useState('');
    const [brandDescription, setBrandDescription] = useState('');
    const [phone, setPhone] = useState(user?.phoneNumber || '');
    const [address, setAddress] = useState(user?.address || '');
    const [country, setCountry] = useState(user?.country || 'Nigeria');
    const [countryCode, setCountryCode] = useState<any>(user?.country ? undefined : 'NG');
    const [noOfEmployees, setNoOfEmployees] = useState(user?.noOfEmployees || '1-5');
    const [businessType, setBusinessType] = useState(user?.businessType || '');
    const [logo, setLogo] = useState<string | null>(null);

    const [instagram, setInstagram] = useState('');
    const [twitter, setTwitter] = useState('');
    const [facebook, setFacebook] = useState('');
    const [tiktok, setTiktok] = useState('');
    const [selectedTheme, setSelectedTheme] = useState(PREDEFINED_THEMES[0].color);

    const [showDisclaimer, setShowDisclaimer] = useState(false);
    const [isSubscriptionModalVisible, setIsSubscriptionModalVisible] = useState(false);
    const [showBusinessTypeModal, setShowBusinessTypeModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const userIsPro = user?.subscriptionPlan !== 'FREE' && user?.subscriptionStatus === 'ACTIVE';

    const catalogUrl = `https://catalog.needleafrica.com/cg/${encodeURIComponent(catalogId as string)}`;

    useEffect(() => {
        const checkDisclaimer = async () => {
            const hasSeen = await AsyncStorage.getItem('hasSeenBusinessDisclaimer');
            if (!hasSeen) {
                setShowDisclaimer(true);
            }
        };
        checkDisclaimer();

        // Initial fetch
        fetchCatalogSettings();
    }, []);

    // Reactive check: if user drops from Pro, turn off catalog
    useEffect(() => {
        if (!userIsPro && isEnabled) {
            setIsEnabled(false);
            if (showPrices) setShowPrices(false);
        }
    }, [userIsPro]);

    const fetchCatalogSettings = async () => {
        setIsLoading(true);
        try {
            const { default: axiosInstance } = await import('../../../lib/axios');
            const res = await axiosInstance.get('/catalog');
            if (res.data && res.data.id) {
                setCatalogId(res.data.id);
                setCatalogViews(res.data.views || 0);
                setIsEnabled(userIsPro ? (res.data.catalogEnabled || false) : false);
                setShowPrices(userIsPro ? (res.data.showPricesInCatalog ?? true) : false);
                setHeadline(res.data.businessHeadline || '');
                setBrandDescription(res.data.businessDescription || '');
                setInstagram(res.data.instagram || '');
                setTwitter(res.data.twitter || '');
                setFacebook(res.data.facebook || '');
                setTiktok(res.data.tiktok || '');
                if (res.data.catalogThemeColor) setSelectedTheme(res.data.catalogThemeColor);
                if (res.data.businessLogo) setLogo(res.data.businessLogo);
            } else {
                setCatalogId(null);
            }
        } catch (error) {
            console.log('Error fetching catalog', error);
            setCatalogId(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateCatalog = async () => {
        setIsSaving(true);
        try {
            const { default: axiosInstance } = await import('../../../lib/axios');
            const res = await axiosInstance.patch('/catalog', {
                catalogEnabled: false,
                catalogThemeColor: selectedTheme,
            });
            if (res.data && res.data.id) {
                setCatalogId(res.data.id);
                setIsEnabled(false);
                Toast.show({ type: 'success', text1: 'Success', text2: 'Catalog created successfully' });
            }
        } catch (error: any) {
            console.error('Creation Failed:', error.response?.data || error);
            Toast.show({ type: 'error', text1: 'Creation Failed', text2: 'Could not create catalog' });
        } finally {
            setIsSaving(false);
        }
    };

    const closeDisclaimer = async () => {
        await AsyncStorage.setItem('hasSeenBusinessDisclaimer', 'true');
        setShowDisclaimer(false);
    };

    useEffect(() => {
        if (user) {
            setBusinessName(user.businessName || '');
            setPhone(user.phoneNumber || '');
            setAddress(user.address || '');
            if (user.country) {
                setCountry(user.country);
                getAllCountries('emoji' as any).then(countries => {
                    const found = countries.find(c =>
                        (typeof c.name === 'string' && c.name === user.country) ||
                        (typeof c.name === 'object' && (c.name as any).common === user.country)
                    );
                    if (found) setCountryCode(found.cca2);
                }).catch(() => { });
            }
            if (user.noOfEmployees) setNoOfEmployees(user.noOfEmployees);
            if (user.businessType) setBusinessType(user.businessType);
        }
    }, [user]);

    const handlePickLogo = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, aspect: [1, 1], quality: 0.8,
        });
        if (!result.canceled) setLogo(result.assets[0].uri);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            let currentLogoUrl = logo;

            // 0. If logo is a local URI, upload it first
            if (logo && logo !== user?.profilePicture && !logo.startsWith('http')) {
                try {
                    const updatedUser = await uploadProfilePhoto(logo);
                    currentLogoUrl = updatedUser.profilePicture || logo;
                } catch (uploadError) {
                    console.error('Logo upload failed:', uploadError);
                    // Continue anyway, it might fail later but we tried
                }
            }

            // 1. Update general user profile
            await updateProfile({
                businessName: businessName.trim(),
                phoneNumber: phone,
                address: address.trim(),
                country,
                noOfEmployees,
                businessType
            });

            // 2. Update Catalog-specific settings
            const { default: axiosInstance } = await import('../../../lib/axios');
            await axiosInstance.patch('/catalog', {
                id: catalogId,
                catalogEnabled: userIsPro ? isEnabled : false,
                showPricesInCatalog: userIsPro ? showPrices : false,
                businessHeadline: headline.trim(),
                businessDescription: brandDescription.trim(),
                instagram: instagram.trim(),
                twitter: twitter.trim(),
                facebook: facebook.trim(),
                tiktok: tiktok.trim(),
                catalogThemeColor: selectedTheme,
                businessLogo: currentLogoUrl
            });

            Toast.show({ type: 'success', text1: 'Success', text2: 'Business info updated' });
        } catch (error: any) {
            console.error('Update Failed:', error.response?.data || error);
            Toast.show({ type: 'error', text1: 'Update Failed', text2: error.response?.data?.error || error.message || 'Something went wrong' });
        } finally {
            setIsSaving(false);
        }
    };

    const cardBaseStyle = isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-100 shadow-sm shadow-gray-100/50';

    return (
        <View className={`flex-1 ${isDark ? 'bg-zinc-950' : 'bg-gray-50'}`}>
            <View className={`px-4 pt-2 pb-2 flex-row items-center justify-between ${isDark ? 'bg-zinc-950 border-b border-white/5' : 'bg-white border-b border-gray-50'}`}>
                <View className="flex-row items-center">
                    <IconButton icon={<ArrowLeft size={22} color={isDark ? 'white' : 'black'} />} onPress={() => router.back()} variant="ghost" />
                    <Typography variant="h3" weight="bold" className="ml-2">Catalog Storefront</Typography>
                </View>
                {catalogId && (
                    <TouchableOpacity onPress={handleSave} disabled={isSaving}>
                        <Typography color="primary" weight="bold" className={isSaving ? 'opacity-50' : ''}>{isSaving ? 'Saving...' : 'Done'}</Typography>
                    </TouchableOpacity>
                )}
            </View>

            {isLoading ? (
                <View className="flex-1 p-5">
                    <SkeletonLoader isDark={isDark} />
                </View>
            ) : !catalogId ? (
                <EmptyState onApply={handleCreateCatalog} isSaving={isSaving} isDark={isDark} />
            ) : (
                <ScrollView contentContainerClassName="p-5 pb-10" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    {/* BRANDING */}
                    <View className="mb-8">
                        <Typography variant="caption" color="gray" weight="bold" className="ml-4 mb-2 uppercase tracking-wider text-[11px]">Business Branding</Typography>
                        <View className={`rounded-[24px] overflow-hidden p-6 items-center ${cardBaseStyle}`}>
                            <TouchableOpacity onPress={handlePickLogo} className="relative mb-4">
                                <View className={`w-24 h-24 rounded-full overflow-hidden items-center justify-center ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                                    {logo ? <Image source={{ uri: logo }} className="w-full h-full" /> : <Building size={40} color={isDark ? '#52525b' : '#d1d5db'} variant="Bulk" />}
                                </View>
                                <View className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full border-4 border-white dark:border-zinc-900">
                                    <Camera size={16} color="white" variant="Bulk" />
                                </View>
                            </TouchableOpacity>
                            <Typography weight="bold" className="text-[14px] text-blue-600 mb-6" onPress={handlePickLogo}>Change Business Logo</Typography>

                            <View className="w-full gap-y-4">
                                <View>
                                    <Typography variant="caption" color="gray" weight="bold" className="mb-1 ml-1 uppercase">Business Headline</Typography>
                                    <TextInput
                                        className={`px-4 py-3 rounded-2xl border ${isDark ? 'bg-zinc-800/50 border-zinc-800 text-white' : 'bg-gray-50 border-gray-100 text-gray-900'} font-semibold text-[15px]`}
                                        placeholder="e.g. House of Luxury" value={headline} onChangeText={setHeadline}
                                    />
                                </View>
                                <View>
                                    <Typography variant="caption" color="gray" weight="bold" className="mb-1 ml-1 uppercase">Description</Typography>
                                    <TextInput
                                        className={`px-4 py-3 rounded-2xl border ${isDark ? 'bg-zinc-800/50 border-zinc-800 text-white' : 'bg-gray-50 border-gray-100 text-gray-900'} font-medium text-[14px] min-h-[100px]`}
                                        placeholder="Briefly describe your craft" value={brandDescription} onChangeText={setBrandDescription} multiline
                                        textAlignVertical="top"
                                    />
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* BASIC DETAILS */}
                    <View className="mb-8">
                        <Typography variant="caption" color="gray" weight="bold" className="ml-4 mb-2 uppercase tracking-wider text-[11px]">Basic Details</Typography>
                        <View className={`rounded-[24px] overflow-hidden ${cardBaseStyle}`}>
                            <ProfileRowInput label="Brand Name" value={businessName} onChangeText={setBusinessName} placeholder="Studio Name" isDark={isDark} />
                            <TouchableOpacity
                                onPress={() => setShowBusinessTypeModal(true)}
                                className="flex-row items-center justify-between px-4 py-4 border-b border-gray-50 dark:border-white/5 active:bg-gray-50 dark:active:bg-white/5"
                            >
                                <Typography weight="semibold" className="text-gray-900 dark:text-white text-[14px]">Craft</Typography>
                                <View className="flex-row items-center">
                                    <Typography weight="medium" className={`text-[15px] mr-2 ${businessType ? 'text-blue-600' : 'text-gray-400'}`}>{businessType || 'Specialization'}</Typography>
                                    <Building size={16} color="#9CA3AF" variant="Bulk" />
                                </View>
                            </TouchableOpacity>

                            <View className="flex-row items-center px-4 py-4 border-b border-gray-50 dark:border-white/5">
                                <Typography weight="semibold" className="text-gray-900 dark:text-white w-1/3 text-[14px]">WhatsApp</Typography>
                                <View className="flex-1 items-end">
                                    <PhoneInput
                                        style={{ fontSize: 14, fontWeight: '600', color: isDark ? 'white' : '#111827', textAlign: 'right', width: '100%' }}
                                        defaultCountry={countryCode || "NG"} value={phone} onChange={(val: any) => setPhone(val || '')}
                                    />
                                </View>
                            </View>

                            <View className="flex-row items-center px-4 py-4">
                                <Typography weight="semibold" className="text-gray-900 dark:text-white w-1/3 text-[14px]">Country</Typography>
                                <View className="flex-1 items-end">
                                    <CountryPicker
                                        withFilter withFlag withCountryNameButton withAlphaFilter withEmoji
                                        onSelect={(c: any) => { setCountry(c.name as string); setCountryCode(c.cca2); }}
                                        countryCode={countryCode}
                                        theme={isDark ? { onBackgroundTextColor: '#ffffff', backgroundColor: '#1C1C1E', filterPlaceholderTextColor: '#9CA3AF' } : {}}
                                        containerButtonStyle={{ padding: 0 }}
                                    />
                                </View>
                            </View>

                            <ProfileRowInput label="Address" value={address} onChangeText={setAddress} placeholder="Street, City, Country" isDark={isDark} />
                        </View>
                    </View>

                    {/* SOCIAL MEDIA */}
                    <View className="mb-8">
                        <Typography variant="caption" color="gray" weight="bold" className="ml-4 mb-2 uppercase tracking-wider text-[11px]">Social Presence</Typography>
                        <View className={`rounded-[24px] overflow-hidden ${cardBaseStyle}`}>
                            <View className="flex-row items-center px-4 py-4 border-b border-gray-100 dark:border-white/5">
                                <View className="mr-3"><InstagramIcon color="#E4405F" /></View>
                                <Typography weight="semibold" className="w-1/4 text-[14px]">Instagram</Typography>
                                <TextInput
                                    className={`flex-1 text-right font-semibold text-[14px] ${isDark ? 'text-white' : 'text-gray-900'}`}
                                    placeholder="@handle" value={instagram} onChangeText={setInstagram}
                                />
                            </View>
                            <View className="flex-row items-center px-4 py-4 border-b border-gray-100 dark:border-white/5">
                                <View className="mr-3"><XIcon color={isDark ? '#FFFFFF' : '#000000'} /></View>
                                <Typography weight="semibold" className="w-1/4 text-[14px]">Twitter (X)</Typography>
                                <TextInput
                                    className={`flex-1 text-right font-semibold text-[14px] ${isDark ? 'text-white' : 'text-gray-900'}`}
                                    placeholder="@handle" value={twitter} onChangeText={setTwitter}
                                />
                            </View>
                            <View className="flex-row items-center px-4 py-4 border-b border-gray-100 dark:border-white/5">
                                <View className="mr-3"><FacebookIcon color="#1877F2" /></View>
                                <Typography weight="semibold" className="w-1/4 text-[14px]">Facebook</Typography>
                                <TextInput
                                    className={`flex-1 text-right font-semibold text-[14px] ${isDark ? 'text-white' : 'text-gray-900'}`}
                                    placeholder="page name" value={facebook} onChangeText={setFacebook}
                                />
                            </View>
                            <View className="flex-row items-center px-4 py-4">
                                <View className="mr-3"><TikTokIcon color={isDark ? '#FFFFFF' : '#000000'} /></View>
                                <Typography weight="semibold" className="w-1/4 text-[14px]">TikTok</Typography>
                                <TextInput
                                    className={`flex-1 text-right font-semibold text-[14px] ${isDark ? 'text-white' : 'text-gray-900'}`}
                                    placeholder="@handle" value={tiktok} onChangeText={setTiktok}
                                />
                            </View>
                        </View>
                    </View>

                    {/* THEME PICKER */}
                    <View className="mb-8">
                        <Typography variant="caption" color="gray" weight="bold" className="ml-4 mb-2 uppercase tracking-wider text-[11px]">Catalog Appearance</Typography>
                        <View className={`rounded-[24px] p-6 ${cardBaseStyle}`}>
                            <View className="flex-row items-center justify-between mb-4">
                                <Typography weight="bold" className="text-[14px]">Store Accent Color</Typography>
                                <Typography variant="small" color="primary" weight="semibold">Customized</Typography>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', paddingVertical: 4 }}>
                                {PREDEFINED_THEMES.map((theme) => {
                                    const isSelected = selectedTheme === theme.color;
                                    return (
                                        <View key={theme.color} className="mr-2">
                                            <View style={{ width: 48, height: 48, borderRadius: 24, borderWidth: isSelected ? 2 : 0, borderColor: theme.color, alignItems: 'center', justifyContent: 'center' }}>
                                                <Pressable
                                                    onPress={() => setSelectedTheme(theme.color)}
                                                    style={{ backgroundColor: theme.color, width: 36, height: 36, borderRadius: 18, borderWidth: isSelected ? 2.5 : 0, borderColor: isDark ? '#1C1C1E' : 'white' }}
                                                    className={isSelected ? 'scale-100 shadow-sm' : 'scale-90 opacity-80'}
                                                />
                                            </View>
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    </View>

                    <View className="mb-8">
                        <Typography variant="caption" color="gray" weight="bold" className="ml-4 mb-2 uppercase tracking-wider text-[11px]">Visibility Settings</Typography>
                        <View className={`rounded-[24px] overflow-hidden ${cardBaseStyle}`}>
                            <View className="p-4 flex-row items-center justify-between border-b border-gray-50 dark:border-white/5">
                                <View className="flex-1 mr-4">
                                    <View className="flex-row items-center mb-1">
                                        <Typography weight="bold" className="text-[15px]">Catalog Visibility</Typography>
                                        {!userIsPro && (
                                            <View className="ml-2 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                                                <Typography className="text-[8px] font-black text-amber-700 dark:text-amber-400 uppercase">PRO</Typography>
                                            </View>
                                        )}
                                    </View>
                                    <Typography variant="small" color="gray">Allow anyone with your link to view your products</Typography>
                                </View>
                                <Switch
                                    value={userIsPro ? isEnabled : false}
                                    onValueChange={(val) => {
                                        if (!userIsPro) {
                                            Toast.show({ type: 'info', text1: 'Pro Feature', text2: 'Upgrade to Pro to enable your public catalog' });
                                            return;
                                        }
                                        setIsEnabled(val);
                                    }}
                                    trackColor={{ false: '#D1D5DB', true: '#3b82f6' }}
                                    thumbColor="#FFFFFF"
                                />
                            </View>
                            <View className="p-4 flex-row items-center justify-between">
                                <View className="flex-1 mr-4">
                                    <View className="flex-row items-center mb-1">
                                        <Typography weight="bold" className="text-[15px]">Show Price Tags</Typography>
                                        {!userIsPro && (
                                            <View className="ml-2 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                                                <Typography className="text-[8px] font-black text-amber-700 dark:text-amber-400 uppercase">PRO</Typography>
                                            </View>
                                        )}
                                    </View>
                                    <Typography variant="small" color="gray">Display prices to every visitor</Typography>
                                </View>
                                <Switch
                                    value={userIsPro ? showPrices : false}
                                    onValueChange={(val) => {
                                        if (!userIsPro) {
                                            Toast.show({ type: 'info', text1: 'Pro Feature', text2: 'Upgrade to Pro to customize store prices' });
                                            return;
                                        }
                                        setShowPrices(val);
                                    }}
                                    trackColor={{ false: '#D1D5DB', true: '#3b82f6' }}
                                    thumbColor="#FFFFFF"
                                />
                            </View>
                        </View>
                    </View>

                    {/* STORE LINK (If Enabled) */}
                    {catalogId && (
                        <View className="mb-8">
                            <Typography variant="caption" color="gray" weight="bold" className="ml-4 mb-2 uppercase tracking-wider text-[11px]">Your Store Link</Typography>
                            <View className={`rounded-[24px] p-6 ${cardBaseStyle}`}>
                                <View className="relative">
                                    <Typography weight="medium" numberOfLines={1} className={`text-[14px] mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'} ${!userIsPro ? 'opacity-20' : ''}`}>
                                        {userIsPro ? `https://catalog.needleafrica.com/cg/${catalogId}` : 'https://catalog.needleafrica.com/cg/••••••••••••••••'}
                                    </Typography>
                                    {!userIsPro && (
                                        <View className="absolute inset-0 items-center justify-center -top-2">
                                            <Warning2 size={16} color="#9CA3AF" variant="Bulk" />
                                        </View>
                                    )}
                                </View>

                                <View className="flex-row gap-x-3">
                                    <TouchableOpacity
                                        onPress={async () => {
                                            if (!userIsPro) return;
                                            await Clipboard.setStringAsync(`https://catalog.needleafrica.com/cg/${catalogId}`);
                                            Toast.show({ type: 'success', text1: 'Copied', text2: 'Link copied to clipboard' });
                                        }}
                                        disabled={!userIsPro}
                                        className={`flex-1 flex-row items-center justify-center h-14 rounded-2xl ${userIsPro ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-white/5 opacity-50'}`}
                                    >
                                        <Typography weight="bold" className={userIsPro ? 'text-blue-600' : 'text-gray-400'}>Copy Link</Typography>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => {
                                            if (!userIsPro) return;
                                            Linking.openURL(`https://catalog.needleafrica.com/cg/${catalogId}`);
                                        }}
                                        disabled={!userIsPro}
                                        className={`flex-1 flex-row items-center justify-center h-14 rounded-2xl ${userIsPro ? 'bg-gray-100 dark:bg-white/10' : 'bg-gray-100 dark:bg-white/5 opacity-50'}`}
                                    >
                                        <Typography weight="bold" className={userIsPro ? (isDark ? 'text-white' : 'text-gray-900') : 'text-gray-400'}>Preview Store</Typography>
                                    </TouchableOpacity>
                                </View>

                                {!userIsPro && (
                                    <View className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5 items-center">
                                        <Typography variant="small" color="gray" weight="medium" className="text-center mb-4 leading-relaxed">
                                            Public catalog storefront and link sharing are exclusively available to <Typography weight="black" className="text-amber-500">PRO</Typography> members.
                                        </Typography>
                                        <TouchableOpacity
                                            onPress={() => setIsSubscriptionModalVisible(true)}
                                            className="bg-amber-500 px-6 py-3 rounded-full flex-row items-center"
                                        >
                                            <Typography weight="bold" className="text-white text-[12px] uppercase tracking-widest mr-2">Upgrade to Pro</Typography>
                                            <ArrowLeft size={14} color="white" style={{ transform: [{ rotate: '180deg' }] }} />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    <Button onPress={handleSave} isLoading={isSaving} className="h-16 rounded-full bg-blue-600 border-0 mb-8 mt-4" textClassName="text-white text-[16px] font-bold">
                        Save Everything
                    </Button>
                </ScrollView>
            )}

            {/* Modal: Business Specialization Selector */}
            <Modal animationType="slide" transparent={true} visible={showBusinessTypeModal} onRequestClose={() => setShowBusinessTypeModal(false)}>
                <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setShowBusinessTypeModal(false)}>
                    <Pressable className={`rounded-t-[32px] max-h-[75%] pb-8 ${isDark ? 'bg-[#1C1C1E]' : 'bg-[#F2F2F7]'}`}>
                        <View className="flex-row justify-between items-center p-6 pb-4 border-b border-gray-100 dark:border-white/5">
                            <View className="w-8" />
                            <Typography variant="h3" weight="bold">Describe Your Craft</Typography>
                            <TouchableOpacity onPress={() => setShowBusinessTypeModal(false)} className="bg-gray-200/80 dark:bg-white/10 p-1.5 rounded-full">
                                <CloseCircle size={22} color="#6B7280" variant="Bold" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView className="p-4" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            <View className={`rounded-[24px] overflow-hidden mb-8 ${cardBaseStyle}`}>
                                {BUSINESS_TYPE_OPTIONS.map((option, index) => {
                                    const isSelected = businessType === option;
                                    const isLast = index === BUSINESS_TYPE_OPTIONS.length - 1;
                                    return (
                                        <TouchableOpacity
                                            key={option}
                                            onPress={() => { setBusinessType(option); setShowBusinessTypeModal(false); }}
                                            className={`flex-row items-center justify-between px-5 py-4 ${!isLast ? 'border-b border-gray-100 dark:border-white/5' : ''}`}
                                        >
                                            <Typography weight={isSelected ? "bold" : "semibold"} className={`text-[15px] ${isSelected ? 'text-blue-600' : (isDark ? 'text-white' : 'text-gray-900')}`}>{option}</Typography>
                                            {isSelected && <TickCircle size={20} color="#2563EB" variant="Bold" />}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Modal: Business Growth Disclaimer */}
            <Modal visible={showDisclaimer} animationType="fade" transparent={true}>
                <View className="flex-1 bg-black/60 items-center justify-center p-6">
                    <View className={`w-full rounded-[40px] overflow-hidden ${isDark ? 'bg-[#1C1C1E]' : 'bg-white'} shadow-2xl`}>
                        <View className="p-8 items-center">
                            <View className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full items-center justify-center mb-6">
                                <Magicpen size={40} color="#2563EB" variant="Bulk" />
                            </View>

                            <Typography variant="h2" weight="bold" className="text-center mb-3">Your Digital Storefront</Typography>
                            <Typography variant="body" color="gray" className="text-center mb-8 leading-6">
                                Setting up your business profile allows you to showcase your craft to the world and accept orders directly through your storefront.
                            </Typography>

                            <View className="w-full gap-y-4 mb-8">
                                <DisclaimerRow
                                    icon={<StatusUp size={20} color="#2563EB" />}
                                    title="Global Visibility"
                                    desc="Your catalog is visible to anyone with your link."
                                />
                                <DisclaimerRow
                                    icon={<ShieldTick size={20} color="#10B981" />}
                                    title="Verify Ownership"
                                    desc="Ensure all photos and information belong strictly to you."
                                />
                                <DisclaimerRow
                                    icon={<Activity size={20} color="#FDB022" />}
                                    title="Keep it Updated"
                                    desc="Accurate info helps clients trust and book your services."
                                />
                            </View>

                            <Button onPress={closeDisclaimer} className="w-full h-16 rounded-full bg-blue-600 border-0" textClassName="text-white font-bold text-lg">
                                Got it, Let's Build!
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>

            <SubscriptionModal
                visible={isSubscriptionModalVisible}
                onClose={() => setIsSubscriptionModalVisible(false)}
            />

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
                            source={{ uri: catalogUrl }}
                            style={{ flex: 1, backgroundColor: isDark ? '#09090b' : '#ffffff' }}
                            onLoadStart={() => { setWebViewLoading(true); console.log(catalogUrl); }}
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
                    onPress={() => setShowWebView(true)}
                    activeOpacity={0.8}
                    style={{
                        position: 'absolute',
                        right: 20,
                        bottom: insets.bottom + 20,
                        backgroundColor: '#2563EB',
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        justifyContent: 'center',
                        alignItems: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 10,
                        zIndex: 999
                    }}
                >
                    <Eye size={28} color="white" variant="Bulk" />
                </TouchableOpacity>
            )}
        </View>
    );
}

function DisclaimerRow({ icon, title, desc }: { icon: any, title: string, desc: string }) {
    const { isDark } = useTheme();
    return (
        <View className="flex-row items-start">
            <View className={`w-10 h-10 rounded-xl items-center justify-center mr-4 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                {icon}
            </View>
            <View className="flex-1">
                <Typography weight="bold" className="text-[14px] mb-0.5">{title}</Typography>
                <Typography variant="small" color="gray" className="text-[12px]">{desc}</Typography>
            </View>
        </View>
    );
}

function ProfileRowInput({ label, value, onChangeText, placeholder, isDark }: { label: string, value: string, onChangeText: (text: string) => void, placeholder: string, isDark?: boolean }) {
    return (
        <View className="flex-row items-center px-4 py-4 border-b border-gray-50 dark:border-white/5">
            <Typography weight="semibold" className="text-gray-900 dark:text-white w-1/3 text-[14px]">{label}</Typography>
            <TextInput className={`flex-1 text-right font-semibold text-[15px] ${isDark ? 'text-white' : 'text-gray-900'}`} placeholder={placeholder} placeholderTextColor="#9CA3AF" value={value} onChangeText={onChangeText} />
        </View>
    );
}

function SkeletonLoader({ isDark }: { isDark: boolean }) {
    const shimmerClass = isDark ? 'bg-zinc-800' : 'bg-gray-200';
    return (
        <ScrollView showsVerticalScrollIndicator={false}>
            <View className="mb-8 p-5">
                <View className={`h-4 w-32 mb-4 rounded-md ${shimmerClass} opacity-50`} />
                <View className={`h-64 w-full rounded-[32px] ${shimmerClass} opacity-20`} />
            </View>
            <View className="mb-8 p-5">
                <View className={`h-4 w-24 mb-4 rounded-md ${shimmerClass} opacity-50`} />
                <View className={`h-48 w-full rounded-[32px] ${shimmerClass} opacity-20`} />
            </View>
            <View className="mb-8 p-5">
                <View className={`h-4 w-28 mb-4 rounded-md ${shimmerClass} opacity-50`} />
                <View className={`h-40 w-full rounded-[32px] ${shimmerClass} opacity-20`} />
            </View>
        </ScrollView>
    );
}

function EmptyState({ onApply, isSaving, isDark }: { onApply: () => void, isSaving: boolean, isDark: boolean }) {
    return (
        <View className="flex-1 justify-center p-8">
            <View className={`p-10 rounded-[48px] items-center ${isDark ? 'bg-zinc-900/50' : 'bg-white'}`}>
                <Image
                    source={require('../../../assets/images/globe-image.png')}
                    style={{ width: 200, height: 200 }}
                    resizeMode="contain"
                />
                <Typography variant="h2" weight="bold" className="text-center mb-2 font-bold">You have no catalog yet</Typography>
                <Typography variant="body" color="gray" className="text-center mb-6 leading-6">
                    Create your personal catalog storefront website to showcase your products and services to customers worldwide.
                </Typography>
                <Button
                    onPress={onApply}
                    isLoading={isSaving}
                    className="w-full h-16 rounded-full bg-blue-600 border-0 mb-6"
                    textClassName="text-white font-bold text-lg"
                >
                    Create My Catalog
                </Button>

                <TouchableOpacity onPress={() => Linking.openURL('https://catalog.needleafrica.com/cg/cmnm8rm9z0001lb04jwwf74cm')}>
                    <View className='flex-row items-center gap-2'>
                        <Typography color="gray" weight="bold" className="text-[14px]">View Sample Storefront</Typography>
                        <ArrowRight size={16} color="gray" variant="Linear" />
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
}
