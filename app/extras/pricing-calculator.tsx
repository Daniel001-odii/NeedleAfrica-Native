import React, { useState, useRef } from 'react';
import {
    View,
    ScrollView,
    Pressable,
    TouchableOpacity,
    Dimensions,
    Animated,
    TextInput,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useOrders } from '../../hooks/useOrders';
import {
    ArrowLeft,
    Trash,
    AddCircle,
    Copy,
    Share,
    Calculator,
    InfoCircle
} from 'iconsax-react-native';
import { Typography } from '../../components/ui/Typography';
import { Surface } from '../../components/ui/Surface';
import { IconButton } from '../../components/ui/IconButton';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import Toast from 'react-native-toast-message';
import { usePostHog } from 'posthog-react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface MaterialItem {
    id: string;
    name: string;
    cost: string;
    qty: string;
    wastage: number; // e.g. 0.10 for 10%
}

interface GarmentPreset {
    name: string;
    description: string;
    materials: MaterialItem[];
    laborMode: 'hourly' | 'fixed';
    hourlyRate: string;
    laborHours: {
        drafting: string;
        cutting: string;
        sewing: string;
        finishing: string;
    };
    fixedLaborFee: string;
    overheadPercent: number;
    wholesaleMultiplier: number;
    dtcMultiplier: number;
}

const PRESETS: Record<string, GarmentPreset> = {
    casual: {
        name: 'Casual/RTW',
        description: 'T-Shirts, simple tops, light summer dresses',
        materials: [
            { id: '1', name: 'Cotton fabric (yards)', cost: '12', qty: '2.5', wastage: 0.10 },
            { id: '2', name: 'Thread & Notions', cost: '3', qty: '1', wastage: 0.0 }
        ],
        laborMode: 'fixed',
        hourlyRate: '15',
        laborHours: { drafting: '0.5', cutting: '0.5', sewing: '2.0', finishing: '0.5' },
        fixedLaborFee: '25',
        overheadPercent: 10,
        wholesaleMultiplier: 1.8,
        dtcMultiplier: 2.5
    },
    custom: {
        name: 'Suit/Custom',
        description: 'Structured tailoring, native wear, standard suits',
        materials: [
            { id: '1', name: 'Premium Brocade/Wool', cost: '35', qty: '4.0', wastage: 0.10 },
            { id: '2', name: 'Lining & Interfacing', cost: '12', qty: '1', wastage: 0.10 },
            { id: '3', name: 'Embroidery / Trims', cost: '20', qty: '1', wastage: 0.0 }
        ],
        laborMode: 'hourly',
        hourlyRate: '25',
        laborHours: { drafting: '1.5', cutting: '1.0', sewing: '6.0', finishing: '2.0' },
        fixedLaborFee: '75',
        overheadPercent: 15,
        wholesaleMultiplier: 2.0,
        dtcMultiplier: 3.0
    },
    bridal: {
        name: 'Bridals/Gowns',
        description: 'Complex draping, lace, hand-beading',
        materials: [
            { id: '1', name: 'Silk Satin / Lace (yards)', cost: '90', qty: '6.0', wastage: 0.15 },
            { id: '2', name: 'Tulles / Understructure', cost: '30', qty: '8.0', wastage: 0.15 },
            { id: '3', name: 'Beads & Embellishments', cost: '75', qty: '1', wastage: 0.0 }
        ],
        laborMode: 'hourly',
        hourlyRate: '40',
        laborHours: { drafting: '4.0', cutting: '2.0', sewing: '14.0', finishing: '6.0' },
        fixedLaborFee: '250',
        overheadPercent: 20,
        wholesaleMultiplier: 2.2,
        dtcMultiplier: 4.0
    }
};

const getCurrencySymbol = (code: string) => {
    switch (code) {
        case 'USD': return '$';
        case 'EUR': return '€';
        case 'GBP': return '£';
        case 'GHS': return 'GH₵';
        case 'ZAR': return 'R';
        case 'NGN':
        default:
            return '₦';
    }
};

export default function PricingCalculatorScreen() {
    const router = useRouter();
    const { orderId, styleName: paramStyleName, amount: paramAmount } = useLocalSearchParams<{
        orderId?: string;
        styleName?: string;
        amount?: string;
    }>();
    const { updateOrder } = useOrders();
    const { isDark } = useTheme();
    const { user } = useAuth();
    const posthog = usePostHog();
    const reportRef = useRef<View>(null);

    React.useEffect(() => {
        posthog?.capture('pricing_calculator_opened', {
            from_order: !!orderId,
            order_id: orderId,
            initial_amount: paramAmount ? parseFloat(paramAmount) : undefined
        });
    }, [orderId]);

    // Resolve user's set currency
    const userCurrencyCode = user?.currency || 'NGN';
    const currencySymbol = getCurrencySymbol(userCurrencyCode);

    // Dynamic states
    const [activePreset, setActivePreset] = useState<string | null>(null);

    // Material cost state
    const [materials, setMaterials] = useState<MaterialItem[]>(PRESETS.casual.materials);

    // Labor cost state
    const [laborMode, setLaborMode] = useState<'hourly' | 'fixed'>('fixed');
    const [hourlyRate, setHourlyRate] = useState('20');
    const [laborHours, setLaborHours] = useState({
        drafting: '1',
        cutting: '1',
        sewing: '4',
        finishing: '2'
    });
    const [fixedLaborFee, setFixedLaborFee] = useState('45');

    // Overhead and margins
    const [overheadPercent, setOverheadPercent] = useState(15);
    const [wholesaleMultiplier, setWholesaleMultiplier] = useState(2.0);
    const [dtcMultiplier, setDtcMultiplier] = useState(3.0);

    // Trigger animations
    const [fadeAnim] = useState(new Animated.Value(1));

    // Handle preset select
    const selectPreset = (key: string) => {
        setActivePreset(key);
        const preset = PRESETS[key];
        setMaterials(preset.materials.map(m => ({ ...m, id: Math.random().toString() })));
        setLaborMode(preset.laborMode);
        setHourlyRate(preset.hourlyRate);
        setLaborHours({ ...preset.laborHours });
        setFixedLaborFee(preset.fixedLaborFee);
        setOverheadPercent(preset.overheadPercent);
        setWholesaleMultiplier(preset.wholesaleMultiplier);
        setDtcMultiplier(preset.dtcMultiplier);

        Animated.sequence([
            Animated.timing(fadeAnim, { toValue: 0.6, duration: 150, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true })
        ]).start();

        Toast.show({
            type: 'success',
            text1: `${preset.name} Preset Loaded`,
            text2: 'Calculations updated successfully'
        });

        posthog?.capture('pricing_calculator_preset_selected', { preset_key: key });
    };

    // Material CRUD
    const addMaterial = () => {
        posthog?.capture('pricing_calculator_material_added');
        setMaterials(prev => [
            ...prev,
            {
                id: Date.now().toString(),
                name: '',
                cost: '',
                qty: '',
                wastage: 0.10
            }
        ]);
    };

    const updateMaterial = (id: string, key: keyof MaterialItem, value: any) => {
        setMaterials(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, [key]: value };
            }
            return item;
        }));
    };

    const removeMaterial = (id: string) => {
        setMaterials(prev => prev.filter(item => item.id !== id));
    };

    const toggleWastage = (id: string, currentWastage: number) => {
        const nextWastage = currentWastage === 0.10 ? 0.15 : (currentWastage === 0.15 ? 0.20 : (currentWastage === 0.20 ? 0.00 : 0.10));
        posthog?.capture('pricing_calculator_wastage_toggled', {
            new_wastage: nextWastage
        });
        updateMaterial(id, 'wastage', nextWastage);
    };

    // Calculations
    const getCalculations = () => {
        let totalMaterials = 0;
        materials.forEach(item => {
            const costVal = parseFloat(item.cost) || 0;
            const qtyVal = parseFloat(item.qty) || 0;
            const totalWithBuffer = costVal * qtyVal * (1 + item.wastage);
            totalMaterials += totalWithBuffer;
        });

        let totalLabor = 0;
        if (laborMode === 'fixed') {
            totalLabor = parseFloat(fixedLaborFee) || 0;
        } else {
            const hrRate = parseFloat(hourlyRate) || 0;
            const totalHours =
                (parseFloat(laborHours.drafting) || 0) +
                (parseFloat(laborHours.cutting) || 0) +
                (parseFloat(laborHours.sewing) || 0) +
                (parseFloat(laborHours.finishing) || 0);
            totalLabor = totalHours * hrRate;
        }

        const totalOverhead = (totalMaterials + totalLabor) * (overheadPercent / 100);
        const totalCOGS = totalMaterials + totalLabor + totalOverhead;

        const wholesalePrice = totalCOGS * wholesaleMultiplier;
        const wholesaleProfit = wholesalePrice - totalCOGS;
        const wholesaleMargin = wholesalePrice > 0 ? (wholesaleProfit / wholesalePrice) * 100 : 0;

        const dtcPrice = totalCOGS * dtcMultiplier;
        const dtcProfit = dtcPrice - totalCOGS;
        const dtcMargin = dtcPrice > 0 ? (dtcProfit / dtcPrice) * 100 : 0;

        const standardRetailPrice = wholesalePrice * 2.2;
        const standardRetailProfit = standardRetailPrice - totalCOGS;
        const standardRetailMargin = standardRetailPrice > 0 ? (standardRetailProfit / standardRetailPrice) * 100 : 0;

        return {
            totalMaterials,
            totalLabor,
            totalOverhead,
            totalCOGS,
            wholesalePrice,
            wholesaleProfit,
            wholesaleMargin,
            dtcPrice,
            dtcProfit,
            dtcMargin,
            standardRetailPrice,
            standardRetailProfit,
            standardRetailMargin
        };
    };

    const calcs = getCalculations();

    const initialAmount = paramAmount ? parseFloat(paramAmount) : 0;
    const initialProfit = initialAmount - calcs.totalCOGS;
    const initialMargin = initialAmount > 0 ? (initialProfit / initialAmount) * 100 : 0;

    // Copy to clipboard
    const copyReportText = async () => {
        const text = `--- FASHION PRICING REPORT ---
Garment Type: ${activePreset ? PRESETS[activePreset].name : (paramStyleName || 'Custom Design')}
Currency: ${userCurrencyCode} (${currencySymbol})

1. COST BREAKDOWN:
- Materials: ${currencySymbol}${calcs.totalMaterials.toFixed(2)}
- Labor: ${currencySymbol}${calcs.totalLabor.toFixed(2)}
- Allocated Overhead (${overheadPercent}%): ${currencySymbol}${calcs.totalOverhead.toFixed(2)}
- Total Cost (COGS): ${currencySymbol}${calcs.totalCOGS.toFixed(2)}

2. SUGGESTED PRICING STRATEGIES:
- Wholesale Price (${wholesaleMultiplier}x): ${currencySymbol}${calcs.wholesalePrice.toFixed(2)}
  (Estimated Profit: ${currencySymbol}${calcs.wholesaleProfit.toFixed(2)} | Margin: ${calcs.wholesaleMargin.toFixed(0)}%)
  
- Direct Retail (DTC) (${dtcMultiplier}x): ${currencySymbol}${calcs.dtcPrice.toFixed(2)}
  (Estimated Profit: ${currencySymbol}${calcs.dtcProfit.toFixed(2)} | Margin: ${calcs.dtcMargin.toFixed(0)}%)

- Traditional Retail (Wholesale x 2.2): ${currencySymbol}${calcs.standardRetailPrice.toFixed(2)}
  (Estimated Profit: ${currencySymbol}${calcs.standardRetailProfit.toFixed(2)} | Margin: ${calcs.standardRetailMargin.toFixed(0)}%)

Calculated with Needle Africa Pricing Tool.`;

        await Clipboard.setStringAsync(text);
        Toast.show({
            type: 'success',
            text1: 'Pricing Report Copied!',
            text2: 'Ready to send to customers or partners'
        });

        posthog?.capture('pricing_calculator_report_copied');
    };

    // Share via image
    const shareReportImage = async () => {
        if (!reportRef.current) return;
        try {
            await new Promise(resolve => setTimeout(resolve, 300));
            const uri = await captureRef(reportRef, {
                format: 'png',
                quality: 1.0,
            });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'image/png',
                    dialogTitle: 'Share Garment Cost Sheet',
                });
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Sharing Unavailable',
                });
            }

            posthog?.capture('pricing_calculator_report_shared');
        } catch (error) {
            console.error('Error sharing image report:', error);
            Toast.show({
                type: 'error',
                text1: 'Sharing Failed',
                text2: 'Could not generate report card image.'
            });
        }
    };

    // Multipliers helper
    const incrementWholesale = (amt: number) => {
        setWholesaleMultiplier(prev => Math.max(1, parseFloat((prev + amt).toFixed(1))));
    };
    const incrementDtc = (amt: number) => {
        setDtcMultiplier(prev => Math.max(1, parseFloat((prev + amt).toFixed(1))));
    };

    const handleApplyPrice = async (targetPrice: number, label: string) => {
        if (!orderId) return;
        try {
            const roundedPrice = Math.round(targetPrice);
            await updateOrder(orderId, { amount: roundedPrice });
            
            posthog?.capture('pricing_calculator_applied_to_order', {
                order_id: orderId,
                applied_price: roundedPrice,
                price_type: label,
                original_price: paramAmount ? parseFloat(paramAmount) : undefined
            });
            
            Toast.show({
                type: 'success',
                text1: 'Order Price Updated!',
                text2: `Successfully set order price to ${currencySymbol}${roundedPrice.toLocaleString()} (${label})`,
            });
            
            router.replace('/(tabs)/orders');
        } catch (error) {
            console.error('Failed to update order price:', error);
            Toast.show({
                type: 'error',
                text1: 'Update Failed',
                text2: 'Could not save the new price to the order.',
            });
        }
    };

    return (
        <SafeAreaView className={`flex-1 ${isDark ? 'bg-black' : 'bg-white'}`} edges={['top']}>
            {/* Header */}
            <View className={`px-6 py-4 flex-row justify-between items-center border-b ${isDark ? 'border-zinc-800/80 bg-zinc-950' : 'border-zinc-200/50 bg-white'}`}>
                <View className="flex-row items-center">
                    <IconButton
                        icon={<ArrowLeft size={20} color={isDark ? "white" : "black"} />}
                        onPress={() => router.back()}
                        variant="ghost"
                        className="-ml-2"
                    />
                    <Typography variant="h3" weight="bold" className="ml-2">Pricing Calculator</Typography>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false} className="p-5">

                    {/* Presets Segment Picker */}
                    <Typography variant="caption" weight="bold" color="gray" className="uppercase tracking-widest mb-3 text-[10px]">Garment Preset</Typography>
                    <View className="bg-zinc-200/60 dark:bg-zinc-900/60 p-1 rounded-xl flex-row mb-6">
                        {Object.entries(PRESETS).map(([key, value]) => {
                            const isSelected = activePreset === key;
                            return (
                                <Pressable
                                    key={key}
                                    onPress={() => selectPreset(key)}
                                    className={`flex-1 py-2.5 rounded-lg ${isSelected
                                        ? 'bg-white dark:bg-zinc-800 shadow-sm'
                                        : 'bg-transparent'
                                        }`}
                                >
                                    <Typography
                                        weight="bold"
                                        variant="caption"
                                        className={`text-center ${isSelected
                                            ? isDark ? 'text-white' : 'text-zinc-900'
                                            : 'text-zinc-500 dark:text-zinc-400'
                                            }`}
                                    >
                                        {value.name}
                                    </Typography>
                                </Pressable>
                            );
                        })}
                    </View>

                    {/* 1. MATERIALS COST SECTION */}
                    <View className={`p-5 mb-6 rounded-2xl ${isDark ? 'bg-zinc-900/50 border border-zinc-800' : 'bg-white border border-zinc-100'}`}>
                        <View className="flex-row justify-between items-center mb-2 pb-3 border-b border-zinc-100 dark:border-zinc-850">
                            <Typography variant="subtitle" weight="bold">1. Materials Sheet</Typography>
                            <Typography variant="caption" weight="bold" color="primary">
                                Subtotal: {currencySymbol}{calcs.totalMaterials.toFixed(2)}
                            </Typography>
                        </View>

                        {/* List items */}
                        {materials.map((item) => (
                            <View key={item.id} className="py-3 border-b border-zinc-100 dark:border-zinc-800 flex-row items-center gap-2">
                                <View className="flex-1 gap-1">
                                    <TextInput
                                        placeholder="Item name (e.g. Silk fabric)"
                                        value={item.name}
                                        onChangeText={(val) => updateMaterial(item.id, 'name', val)}
                                        placeholderTextColor={isDark ? '#52525B' : '#A1A1AA'}
                                        className="text-sm font-semibold p-0 text-zinc-900 dark:text-zinc-100"
                                    />
                                    <View className="flex-row items-center gap-1.5 mt-0.5">
                                        <TextInput
                                            placeholder={`Price (${currencySymbol})`}
                                            keyboardType="numeric"
                                            value={item.cost}
                                            onChangeText={(val) => updateMaterial(item.id, 'cost', val)}
                                            placeholderTextColor={isDark ? '#52525B' : '#A1A1AA'}
                                            className="text-xs p-0 text-zinc-500 dark:text-zinc-400 w-16"
                                        />
                                        <Typography variant="small" color="gray" className="text-zinc-400">×</Typography>
                                        <TextInput
                                            placeholder="Qty"
                                            keyboardType="numeric"
                                            value={item.qty}
                                            onChangeText={(val) => updateMaterial(item.id, 'qty', val)}
                                            placeholderTextColor={isDark ? '#52525B' : '#A1A1AA'}
                                            className="text-xs p-0 text-zinc-500 dark:text-zinc-400 w-10"
                                        />
                                    </View>
                                </View>

                                {/* Wastage button */}
                                <TouchableOpacity
                                    onPress={() => toggleWastage(item.id, item.wastage)}
                                    className={`px-2.5 py-1 rounded-lg ${item.wastage > 0 ? 'bg-orange-50 dark:bg-orange-950/40' : 'bg-zinc-50 dark:bg-zinc-900/50'}`}
                                >
                                    <Typography
                                        variant="small"
                                        weight="semibold"
                                        className={item.wastage > 0 ? 'text-orange-600 dark:text-orange-400 text-[10px]' : 'text-zinc-450 dark:text-zinc-500 text-[10px]'}
                                    >
                                        +{item.wastage * 100}% waste
                                    </Typography>
                                </TouchableOpacity>

                                {/* Delete button */}
                                <TouchableOpacity
                                    onPress={() => removeMaterial(item.id)}
                                    className="p-2 rounded-full"
                                >
                                    <Trash size={16} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                        ))}

                        <TouchableOpacity
                            onPress={addMaterial}
                            className="flex-row items-center justify-center p-3 mt-4 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl"
                        >
                            <AddCircle size={18} color={isDark ? '#FFF' : '#71717A'} />
                            <Typography variant="body" weight="semibold" className="ml-2 text-zinc-650 dark:text-zinc-300">Add Material Row</Typography>
                        </TouchableOpacity>
                    </View>

                    {/* 2. LABOR AND TIME SECTION */}
                    <View className={`p-5 mb-6 rounded-2xl ${isDark ? 'bg-zinc-900/50 border border-zinc-800' : 'bg-white border border-zinc-100'}`}>
                        <View className="flex-row justify-between items-center mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-850">
                            <Typography variant="subtitle" weight="bold">2. Tailoring Labor</Typography>
                            <Typography variant="caption" weight="bold" color="primary">
                                Labor: {currencySymbol}{calcs.totalLabor.toFixed(2)}
                            </Typography>
                        </View>

                        {/* Mode toggle */}
                        <View className="flex-row gap-2 mb-5 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl">
                            <Pressable
                                onPress={() => {
                                    posthog?.capture('pricing_calculator_labor_mode_toggled', { mode: 'fixed' });
                                    setLaborMode('fixed');
                                }}
                                className={`flex-1 py-2 rounded-lg ${laborMode === 'fixed' ? 'bg-white dark:bg-zinc-800 shadow-sm' : 'bg-transparent'}`}
                            >
                                <Typography weight="bold" variant="caption" className={`text-center ${laborMode === 'fixed' ? (isDark ? 'text-white' : 'text-zinc-900') : 'text-zinc-400'}`}>
                                    Fixed Labor Fee
                                </Typography>
                            </Pressable>
                            <Pressable
                                onPress={() => {
                                    posthog?.capture('pricing_calculator_labor_mode_toggled', { mode: 'hourly' });
                                    setLaborMode('hourly');
                                }}
                                className={`flex-1 py-2 rounded-lg ${laborMode === 'hourly' ? 'bg-white dark:bg-zinc-800 shadow-sm' : 'bg-transparent'}`}
                            >
                                <Typography weight="bold" variant="caption" className={`text-center ${laborMode === 'hourly' ? (isDark ? 'text-white' : 'text-zinc-900') : 'text-zinc-400'}`}>
                                    Hourly Breakdown
                                </Typography>
                            </Pressable>
                        </View>

                        {/* Flat labor fee layout */}
                        {laborMode === 'fixed' ? (
                            <View className="flex-row justify-between items-center py-1">
                                <View>
                                    <Typography variant="body" weight="semibold">Tailoring Flat Fee</Typography>
                                    <Typography variant="small" color="gray">Flat rate for cutting and sewing</Typography>
                                </View>
                                <View className="flex-row items-center border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-950">
                                    <Typography variant="body" weight="bold" className="mr-1 text-zinc-400">{currencySymbol}</Typography>
                                    <TextInput
                                        keyboardType="numeric"
                                        value={fixedLaborFee}
                                        onChangeText={setFixedLaborFee}
                                        className="text-base font-bold text-zinc-900 dark:text-zinc-100 w-16 text-right p-0"
                                    />
                                </View>
                            </View>
                        ) : (
                            <View className="gap-4">
                                {/* Hourly Rate */}
                                <View className="flex-row justify-between items-center py-1">
                                    <View>
                                        <Typography variant="body" weight="semibold">Hourly Rate</Typography>
                                        <Typography variant="small" color="gray">Designer fee wage per hour</Typography>
                                    </View>
                                    <View className="flex-row items-center border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-950">
                                        <Typography variant="body" weight="bold" className="mr-1 text-zinc-400">{currencySymbol}</Typography>
                                        <TextInput
                                            keyboardType="numeric"
                                            value={hourlyRate}
                                            onChangeText={setHourlyRate}
                                            className="text-base font-bold text-zinc-900 dark:text-zinc-100 w-12 text-right p-0"
                                        />
                                        <Typography variant="body" className="ml-1 text-zinc-400">/hr</Typography>
                                    </View>
                                </View>

                                {/* Tasks Hours */}
                                <Typography variant="caption" weight="bold" color="gray" className="uppercase tracking-widest text-[9px] mt-2">Hours per Stage</Typography>
                                <View className="flex-row flex-wrap justify-between gap-y-3">
                                    {[
                                        { label: 'Drafting', key: 'drafting' },
                                        { label: 'Cutting', key: 'cutting' },
                                        { label: 'Sewing', key: 'sewing' },
                                        { label: 'Finishing', key: 'finishing' }
                                    ].map((task) => (
                                        <View key={task.key} className="w-[48%] bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 rounded-xl border border-zinc-200/50 dark:border-zinc-800/80 flex-row justify-between items-center">
                                            <Typography variant="caption" weight="semibold" className="text-zinc-700 dark:text-zinc-300">{task.label}</Typography>
                                            <TextInput
                                                keyboardType="numeric"
                                                value={laborHours[task.key as keyof typeof laborHours]}
                                                onChangeText={(val) => setLaborHours(prev => ({ ...prev, [task.key]: val }))}
                                                className="text-sm font-bold text-zinc-900 dark:text-zinc-100 border-b border-zinc-350 dark:border-zinc-700 w-8 text-center p-0"
                                            />
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>

                    {/* 3. OVERHEAD ALLOCATION */}
                    <View className={`p-5 mb-6 rounded-2xl ${isDark ? 'bg-zinc-900/50 border border-zinc-800' : 'bg-white border border-zinc-100'}`}>
                        <View className="flex-row justify-between items-center mb-2 pb-3 border-b border-zinc-100 dark:border-zinc-850">
                            <Typography variant="subtitle" weight="bold">3. Studio Overhead</Typography>
                            <Typography variant="caption" weight="bold" color="primary">
                                Overhead: {currencySymbol}{calcs.totalOverhead.toFixed(2)}
                            </Typography>
                        </View>
                        <Typography variant="small" color="gray" className="mb-4 leading-4">
                            Allocated rent, machinery wear and utility buffers.
                        </Typography>

                        {/* Overhead Buttons Segment */}
                        <View className="bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl flex-row">
                            {[0, 5, 10, 15, 20, 25].map((pct) => {
                                const isSelected = overheadPercent === pct;
                                return (
                                    <TouchableOpacity
                                        key={pct}
                                        onPress={() => setOverheadPercent(pct)}
                                        className={`flex-1 py-1.5 rounded-lg ${isSelected ? 'bg-white dark:bg-zinc-800 shadow-sm' : 'bg-transparent'}`}
                                    >
                                        <Typography
                                            weight="bold"
                                            variant="caption"
                                            className={`text-center text-[11px] ${isSelected ? (isDark ? 'text-white' : 'text-zinc-900') : 'text-zinc-400'}`}
                                        >
                                            {pct}%
                                        </Typography>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* 4. MARKUP STEPS (APPLE STEPPERS STYLE) */}
                    <View className={`p-5 mb-8 rounded-2xl ${isDark ? 'bg-zinc-900/50 border border-zinc-800' : 'bg-white border border-zinc-100'}`}>
                        <Typography variant="subtitle" weight="bold" className="mb-1 pb-3 border-b border-zinc-100 dark:border-zinc-850">4. Margin Multipliers</Typography>

                        {/* Wholesale Stepper */}
                        <View className="flex-row justify-between items-center py-4 border-b border-zinc-100/50 dark:border-zinc-850/50">
                            <View>
                                <Typography variant="body" weight="semibold">Wholesale Markup</Typography>
                                <Typography variant="small" color="gray">B2B bulk markup factor</Typography>
                            </View>
                            <View className="flex-row items-center border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-950">
                                <TouchableOpacity
                                    onPress={() => incrementWholesale(-0.1)}
                                    className="w-10 h-10 items-center justify-center active:bg-zinc-200 dark:active:bg-zinc-900"
                                >
                                    <Typography weight="bold" variant="body" className="text-zinc-600 dark:text-zinc-400">-</Typography>
                                </TouchableOpacity>
                                <View className="px-3 min-w-[50px] items-center">
                                    <Typography weight="bold" variant="body" className="text-zinc-800 dark:text-zinc-200">{wholesaleMultiplier.toFixed(1)}x</Typography>
                                </View>
                                <TouchableOpacity
                                    onPress={() => incrementWholesale(0.1)}
                                    className="w-10 h-10 items-center justify-center active:bg-zinc-200 dark:active:bg-zinc-900"
                                >
                                    <Typography weight="bold" variant="body" className="text-zinc-600 dark:text-zinc-400">+</Typography>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* DTC Retail Stepper */}
                        <View className="flex-row justify-between items-center py-4">
                            <View>
                                <Typography variant="body" weight="semibold">Retail (DTC) Markup</Typography>
                                <Typography variant="small" color="gray">Direct-to-consumer factor</Typography>
                            </View>
                            <View className="flex-row items-center border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-950">
                                <TouchableOpacity
                                    onPress={() => incrementDtc(-0.1)}
                                    className="w-10 h-10 items-center justify-center active:bg-zinc-200 dark:active:bg-zinc-900"
                                >
                                    <Typography weight="bold" variant="body" className="text-zinc-600 dark:text-zinc-400">-</Typography>
                                </TouchableOpacity>
                                <View className="px-3 min-w-[50px] items-center">
                                    <Typography weight="bold" variant="body" className="text-zinc-800 dark:text-zinc-200">{dtcMultiplier.toFixed(1)}x</Typography>
                                </View>
                                <TouchableOpacity
                                    onPress={() => incrementDtc(0.1)}
                                    className="w-10 h-10 items-center justify-center active:bg-zinc-200 dark:active:bg-zinc-900"
                                >
                                    <Typography weight="bold" variant="body" className="text-zinc-600 dark:text-zinc-400">+</Typography>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Order Price Analysis Comparison Card */}
                    {initialAmount > 0 && (
                        <View className={`p-5 mb-6 rounded-2xl border ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-150'} shadow-sm`}>
                            <Typography variant="subtitle" weight="bold" className="mb-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                                Order Price Analysis
                            </Typography>
                            <Typography variant="small" color="gray" className="mb-4">
                                Analysis for the set price of your order: <Typography weight="bold" className={isDark ? 'text-white' : 'text-zinc-900'}>"{paramStyleName || 'Garment'}"</Typography>.
                            </Typography>

                            <View className="flex-row justify-between items-center mb-4">
                                <View>
                                    <Typography variant="body" weight="semibold" className="text-zinc-500 dark:text-zinc-400">Order Price</Typography>
                                    <Typography variant="h2" weight="bold" className="text-zinc-900 dark:text-white">
                                        {currencySymbol}{initialAmount.toLocaleString()}
                                    </Typography>
                                </View>
                                <View className="items-end">
                                    <Typography variant="body" weight="semibold" className="text-zinc-500 dark:text-zinc-400">Estimated Profit</Typography>
                                    <Typography variant="h2" weight="bold" className={initialProfit >= 0 ? 'text-green-500' : 'text-red-500'}>
                                        {initialProfit >= 0 ? '+' : ''}{currencySymbol}{initialProfit.toFixed(2)}
                                    </Typography>
                                </View>
                            </View>

                            <View className="flex-row justify-between items-center mb-4">
                                <View>
                                    <Typography variant="body" weight="semibold" className="text-zinc-500 dark:text-zinc-400">Profit Margin</Typography>
                                    <Typography variant="body" weight="bold" className={initialMargin >= 50 ? 'text-green-500' : (initialMargin >= 20 ? 'text-yellow-500' : 'text-red-500')}>
                                        {initialMargin.toFixed(0)}%
                                    </Typography>
                                </View>
                                <View className="items-end">
                                    <Typography variant="body" weight="semibold" className="text-zinc-500 dark:text-zinc-400">Cost of Goods (COGS)</Typography>
                                    <Typography variant="body" weight="bold" className="text-zinc-900 dark:text-white">
                                        {currencySymbol}{calcs.totalCOGS.toFixed(2)}
                                    </Typography>
                                </View>
                            </View>

                            {initialMargin < 30 && (
                                <View className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-250/30 p-3 rounded-xl flex-row items-start">
                                    <InfoCircle size={18} color="#EAB308" className="mt-0.5 mr-2" />
                                    <Typography variant="small" className="text-yellow-750 dark:text-yellow-500 flex-1 leading-4">
                                        Your profit margin is low ({initialMargin.toFixed(0)}%). Consider adjusting the order price or reducing material/labor costs to hit standard profit benchmarks.
                                    </Typography>
                                </View>
                            )}
                        </View>
                    )}

                    {/* DYNAMIC VISUAL REPORT CARD - CAPTURABLE BY VIEW-SHOT */}
                    <Animated.View style={{ opacity: fadeAnim }}>
                        <View
                            ref={reportRef}
                            collapsable={false}
                            className={`p-6 rounded-[24px] border ${isDark ? 'bg-zinc-950 border-zinc-850' : 'bg-white border-zinc-200/50'} shadow-sm`}
                            style={{ width: width - 40, alignSelf: 'center', overflow: 'hidden' }}
                        >
                            {/* Brand Header */}
                            <View className="flex-row justify-between items-center mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-900">
                                <View>
                                    <Typography variant="subtitle" weight="bold">Garment Cost Sheet</Typography>
                                    <Typography variant="small" color="gray" className="text-[9px] uppercase tracking-wider">{user?.businessName || 'My Studio'}</Typography>
                                </View>
                                <View className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
                                    <Typography variant="small" weight="bold" className="text-zinc-800 dark:text-zinc-200 text-[10px]">
                                        {activePreset ? PRESETS[activePreset].name : (paramStyleName || 'Custom Order')}
                                    </Typography>
                                </View>
                            </View>

                            {/* Main Pricing Output Stack */}
                            <View className="gap-4 mb-6">
                                <View className="flex-row justify-between items-center">
                                    <View>
                                        <Typography variant="body" weight="semibold" className="text-zinc-800 dark:text-zinc-200">Wholesale ({wholesaleMultiplier}x)</Typography>
                                        <Typography variant="small" color="gray" className="text-[11px]">
                                            Profit: {currencySymbol}{calcs.wholesaleProfit.toFixed(0)} | Margin: {calcs.wholesaleMargin.toFixed(0)}%
                                        </Typography>
                                    </View>
                                    <Typography variant="h2" weight="bold" color="primary">
                                        {currencySymbol}{calcs.wholesalePrice.toFixed(2)}
                                    </Typography>
                                </View>

                                <View className="flex-row justify-between items-center">
                                    <View>
                                        <Typography variant="body" weight="semibold" className="text-zinc-800 dark:text-zinc-200">Direct Retail ({dtcMultiplier}x)</Typography>
                                        <Typography variant="small" color="gray" className="text-[11px]">
                                            Profit: {currencySymbol}{calcs.dtcProfit.toFixed(0)} | Margin: {calcs.dtcMargin.toFixed(0)}%
                                        </Typography>
                                    </View>
                                    <Typography variant="h2" weight="bold" className="text-blue-500">
                                        {currencySymbol}{calcs.dtcPrice.toFixed(2)}
                                    </Typography>
                                </View>
                            </View>

                            {/* Stacked Cost breakdown progress bar */}
                            {calcs.totalCOGS > 0 && (
                                <View className="mb-6">
                                    <Typography variant="caption" weight="bold" color="gray" className="uppercase tracking-widest text-[9px] mb-2">Cost Breakdown Ratio</Typography>
                                    <View className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 flex-row overflow-hidden">
                                        <View
                                            style={{ flex: calcs.totalMaterials }}
                                            className="bg-orange-400 h-full"
                                        />
                                        <View
                                            style={{ flex: calcs.totalLabor }}
                                            className="bg-blue-500 h-full"
                                        />
                                        <View
                                            style={{ flex: calcs.totalOverhead }}
                                            className="bg-zinc-400 h-full"
                                        />
                                    </View>
                                    <View className="flex-row justify-between mt-2 flex-wrap">
                                        <View className="flex-row items-center mr-2">
                                            <View className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-1" />
                                            <Typography variant="small" color="gray" className="text-[9px]">
                                                Fabric: {((calcs.totalMaterials / calcs.totalCOGS) * 100).toFixed(0)}%
                                            </Typography>
                                        </View>
                                        <View className="flex-row items-center mr-2">
                                            <View className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1" />
                                            <Typography variant="small" color="gray" className="text-[9px]">
                                                Labor: {((calcs.totalLabor / calcs.totalCOGS) * 100).toFixed(0)}%
                                            </Typography>
                                        </View>
                                        <View className="flex-row items-center">
                                            <View className="w-1.5 h-1.5 rounded-full bg-zinc-400 mr-1" />
                                            <Typography variant="small" color="gray" className="text-[9px]">
                                                Overhead: {((calcs.totalOverhead / calcs.totalCOGS) * 100).toFixed(0)}%
                                            </Typography>
                                        </View>
                                    </View>
                                </View>
                            )}

                            {/* Summary Totals */}
                            <View className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800/80">
                                <View className="flex-row justify-between mb-1.5">
                                    <Typography variant="small" color="gray" className="text-[11px]">Materials + Waste Buffer</Typography>
                                    <Typography variant="small" weight="semibold" className="text-zinc-800 dark:text-zinc-200">{currencySymbol}{calcs.totalMaterials.toFixed(2)}</Typography>
                                </View>
                                <View className="flex-row justify-between mb-1.5">
                                    <Typography variant="small" color="gray" className="text-[11px]">Tailor Labor Costs</Typography>
                                    <Typography variant="small" weight="semibold" className="text-zinc-800 dark:text-zinc-200">{currencySymbol}{calcs.totalLabor.toFixed(2)}</Typography>
                                </View>
                                <View className="flex-row justify-between mb-1.5 border-b border-zinc-200/50 dark:border-zinc-800 pb-1.5">
                                    <Typography variant="small" color="gray" className="text-[11px]">Overhead ({overheadPercent}%)</Typography>
                                    <Typography variant="small" weight="semibold" className="text-zinc-800 dark:text-zinc-200">{currencySymbol}{calcs.totalOverhead.toFixed(2)}</Typography>
                                </View>
                                <View className="flex-row justify-between pt-1.5">
                                    <Typography variant="caption" weight="bold" className="text-zinc-800 dark:text-zinc-200">Total Cost (COGS)</Typography>
                                    <Typography variant="caption" weight="bold" color="primary">{currencySymbol}{calcs.totalCOGS.toFixed(2)}</Typography>
                                </View>
                            </View>

                            <View className='mt-6'>
                                <Typography className="text-center text-xs text-gray-400 uppercase tracking-wider">Powered by NeedleX</Typography>
                            </View>
                        </View>
                    </Animated.View>

                    {/* Apple Style Action Buttons */}
                    <View className="flex-row gap-3 mt-6">
                        <TouchableOpacity
                            onPress={copyReportText}
                            activeOpacity={0.8}
                            className={`flex-1 flex-row items-center justify-center h-12 rounded-xl ${isDark ? 'bg-zinc-900' : 'bg-zinc-200/60'
                                }`}
                        >
                            <Copy size={18} color={isDark ? "#E4E4E7" : "#3F3F46"} className="mr-2" />
                            <Typography weight="semibold" variant="body" className={`ml-2 ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                                Copy Text
                            </Typography>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={shareReportImage}
                            activeOpacity={0.8}
                            className="flex-1 flex-row items-center justify-center h-12 rounded-xl bg-blue-500"
                        >
                            <Svg width="20" height="20" viewBox="0 0 24 24"><Path fill="none" stroke="white" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7s2.196-2.716 3.404-3.761a.9.9 0 0 1 .63-.238a.92.92 0 0 1 .562.238C13.804 4.284 16 7 16 7m-3.966-3v11M8 11c-1.4 0-2.1 0-2.635.273a2.5 2.5 0 0 0-1.093 1.092C4 12.9 4 13.6 4 15v1c0 2.357 0 3.535.732 4.268S6.643 21 9 21h6c2.357 0 3.535 0 4.268-.732C20 19.535 20 18.357 20 16v-1c0-1.4 0-2.1-.273-2.635a2.5 2.5 0 0 0-1.092-1.092C18.1 11 17.4 11 16 11" /></Svg>
                            <Typography weight="bold" variant="body" className={`ml-2 text-white`}>
                                Share Sheet
                            </Typography>
                        </TouchableOpacity>
                    </View>

                    {/* Apply Pricing to Order options */}
                    {orderId && (
                        <View className={`p-5 mt-6 rounded-2xl border ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-150'} shadow-sm`}>
                            <Typography variant="subtitle" weight="bold" className="mb-3 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                                Apply Pricing to Order
                            </Typography>
                            <Typography variant="small" color="gray" className="mb-4">
                                Update this order's price directly in your database using one of the calculated pricing models.
                            </Typography>

                            <View className="gap-3">
                                <TouchableOpacity
                                    onPress={() => handleApplyPrice(calcs.dtcPrice, 'Retail (DTC)')}
                                    className="flex-row justify-between items-center p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 active:bg-blue-500/25"
                                >
                                    <View>
                                        <Typography variant="body" weight="bold" className="text-blue-600 dark:text-blue-400">
                                            Apply Retail (DTC)
                                        </Typography>
                                        <Typography variant="small" color="gray" className="mt-0.5">
                                            Recommended markup ({dtcMultiplier}x)
                                        </Typography>
                                    </View>
                                    <Typography variant="body" weight="extrabold" className="text-blue-600 dark:text-blue-450">
                                        {currencySymbol}{calcs.dtcPrice.toFixed(2)}
                                    </Typography>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => handleApplyPrice(calcs.wholesalePrice, 'Wholesale')}
                                    className="flex-row justify-between items-center p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 active:bg-orange-500/25"
                                >
                                    <View>
                                        <Typography variant="body" weight="bold" className="text-orange-600 dark:text-orange-400">
                                            Apply Wholesale
                                        </Typography>
                                        <Typography variant="small" color="gray" className="mt-0.5">
                                            Bulk purchase markup ({wholesaleMultiplier}x)
                                        </Typography>
                                    </View>
                                    <Typography variant="body" weight="extrabold" className="text-orange-600 dark:text-orange-450">
                                        {currencySymbol}{calcs.wholesalePrice.toFixed(2)}
                                    </Typography>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => handleApplyPrice(calcs.standardRetailPrice, 'Traditional Retail')}
                                    className="flex-row justify-between items-center p-4 rounded-xl bg-zinc-500/10 border border-zinc-550/20 active:bg-zinc-500/25"
                                >
                                    <View>
                                        <Typography variant="body" weight="bold" className="text-zinc-700 dark:text-zinc-300">
                                            Apply Traditional Retail
                                        </Typography>
                                        <Typography variant="small" color="gray" className="mt-0.5">
                                            Wholesale x 2.2 markup
                                        </Typography>
                                    </View>
                                    <Typography variant="body" weight="extrabold" className="text-zinc-700 dark:text-zinc-300">
                                        {currencySymbol}{calcs.standardRetailPrice.toFixed(2)}
                                    </Typography>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
