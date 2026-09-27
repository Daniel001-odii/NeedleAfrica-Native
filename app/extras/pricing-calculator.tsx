import React, { useState, useRef } from 'react';
import {
    View,
    ScrollView,
    Pressable,
    TouchableOpacity,
    Dimensions,
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
    InfoCircle,
    TickCircle,
    Flash
} from 'iconsax-react-native';
import { Typography } from '../../components/ui/Typography';
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
            ...(orderId ? { order_id: orderId } : {}),
            ...(paramAmount ? { initial_amount: parseFloat(paramAmount) } : {})
        });
    }, [orderId]);

    // Currency
    const userCurrencyCode = user?.currency || 'NGN';
    const currencySymbol = getCurrencySymbol(userCurrencyCode);

    // Mode: 'quick' or 'detailed'
    const [calcMode, setCalcMode] = useState<'quick' | 'detailed'>('quick');

    // Quick Quote State (Starts Clean/Blank)
    const [quickMaterialCost, setQuickMaterialCost] = useState('');
    const [quickLaborCost, setQuickLaborCost] = useState('');
    const [quickWastage, setQuickWastage] = useState<number>(0.10); // 10% default waste buffer

    // Detailed Breakdown State (Starts with 1 blank item)
    const [materials, setMaterials] = useState<MaterialItem[]>([
        { id: '1', name: '', cost: '', qty: '', wastage: 0.10 }
    ]);
    const [laborMode, setLaborMode] = useState<'fixed' | 'hourly'>('fixed');
    const [fixedLaborFee, setFixedLaborFee] = useState('');
    const [hourlyRate, setHourlyRate] = useState('');
    const [hourlyHours, setHourlyHours] = useState('');
    const [shopBufferPercent, setShopBufferPercent] = useState<number>(10); // 10% studio buffer

    // Target Profit Margin (applies to both modes)
    const [targetMargin, setTargetMargin] = useState<number>(40); // 40% default healthy margin
    const [customMargin, setCustomMargin] = useState<string>('40');

    // Material CRUD for Detailed Mode
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
        if (materials.length <= 1) {
            setMaterials([{ id: Date.now().toString(), name: '', cost: '', qty: '', wastage: 0.10 }]);
            return;
        }
        setMaterials(prev => prev.filter(item => item.id !== id));
    };

    const cycleWastage = (id: string, current: number) => {
        const next = current === 0 ? 0.10 : current === 0.10 ? 0.15 : current === 0.15 ? 0.20 : 0;
        updateMaterial(id, 'wastage', next);
    };

    // Computations
    const calculateTotals = () => {
        let totalMaterials = 0;
        let totalLabor = 0;
        let totalBuffer = 0;

        if (calcMode === 'quick') {
            const rawMat = parseFloat(quickMaterialCost) || 0;
            totalMaterials = rawMat * (1 + quickWastage);
            totalLabor = parseFloat(quickLaborCost) || 0;
            totalBuffer = 0;
        } else {
            // Detailed mode
            materials.forEach(item => {
                const cost = parseFloat(item.cost) || 0;
                const qty = parseFloat(item.qty) || 0;
                totalMaterials += (cost * qty) * (1 + item.wastage);
            });

            if (laborMode === 'fixed') {
                totalLabor = parseFloat(fixedLaborFee) || 0;
            } else {
                const rate = parseFloat(hourlyRate) || 0;
                const hrs = parseFloat(hourlyHours) || 0;
                totalLabor = rate * hrs;
            }

            totalBuffer = (totalMaterials + totalLabor) * (shopBufferPercent / 100);
        }

        const totalCost = totalMaterials + totalLabor + totalBuffer;

        // Pricing with margin formula: Price = Cost / (1 - Margin%)
        const marginDecimal = Math.min(Math.max(targetMargin, 0), 95) / 100;
        const standardPrice = totalCost > 0
            ? Math.round(totalCost / (1 - marginDecimal))
            : 0;
        const standardProfit = standardPrice - totalCost;
        const actualStandardMargin = standardPrice > 0 ? (standardProfit / standardPrice) * 100 : 0;

        // Rush / Express / VIP Price: 30% higher
        const rushPrice = Math.round(standardPrice * 1.30);
        const rushProfit = rushPrice - totalCost;
        const actualRushMargin = rushPrice > 0 ? (rushProfit / rushPrice) * 100 : 0;

        return {
            totalMaterials,
            totalLabor,
            totalBuffer,
            totalCost,
            standardPrice,
            standardProfit,
            actualStandardMargin,
            rushPrice,
            rushProfit,
            actualRushMargin
        };
    };

    const calcs = calculateTotals();

    // Margin Health Status
    const getMarginHealth = (margin: number) => {
        if (margin >= 40) {
            return {
                label: 'Healthy Profit Margin',
                badgeBg: isDark ? 'bg-emerald-950/40 border-emerald-800/60' : 'bg-emerald-50 border-emerald-200',
                textColor: 'text-emerald-600 dark:text-emerald-400',
                description: 'Great quote! This comfortably covers unexpected delays and leaves solid profit for your business.'
            };
        }
        if (margin >= 25) {
            return {
                label: 'Fair Profit Margin',
                badgeBg: isDark ? 'bg-amber-950/40 border-amber-800/60' : 'bg-amber-50 border-amber-200',
                textColor: 'text-amber-600 dark:text-amber-400',
                description: 'Workable margin, but consider adding a slight buffer if the client requests multiple fittings.'
            };
        }
        return {
            label: 'Low Margin Caution',
            badgeBg: isDark ? 'bg-rose-950/40 border-rose-800/60' : 'bg-rose-50 border-rose-200',
            textColor: 'text-rose-600 dark:text-rose-400',
            description: 'You are making under 25% profit. Consider raising your workmanship fee or charging for fittings.'
        };
    };

    const health = getMarginHealth(calcs.actualStandardMargin);

    // Initial order comparison
    const initialAmount = paramAmount ? parseFloat(paramAmount) : 0;
    const initialProfit = initialAmount - calcs.totalCost;
    const initialMargin = initialAmount > 0 ? (initialProfit / initialAmount) * 100 : 0;

    // Apply Price to Order
    const handleApplyPrice = async (targetPrice: number, label: string) => {
        if (!orderId) return;
        try {
            const roundedPrice = Math.round(targetPrice);
            await updateOrder(orderId, { amount: roundedPrice });

            posthog?.capture('pricing_calculator_applied_to_order', {
                order_id: orderId,
                applied_price: roundedPrice,
                price_type: label,
                ...(paramAmount ? { original_price: parseFloat(paramAmount) } : {})
            });

            Toast.show({
                type: 'success',
                text1: 'Order Price Updated!',
                text2: `Successfully updated order to ${currencySymbol}${roundedPrice.toLocaleString()} (${label})`,
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

    // Copy Customer-Friendly WhatsApp Quote
    const copyWhatsAppQuote = async () => {
        const garmentName = paramStyleName || 'Custom Outfit';
        const text = `Hello! Here is the quote for your *${garmentName}*:

• Fabric & Materials: ${currencySymbol}${Math.round(calcs.totalMaterials).toLocaleString()}
• Workmanship & Tailoring: ${currencySymbol}${Math.round(calcs.totalLabor).toLocaleString()}
----------------------------------
*Standard Delivery Price: ${currencySymbol}${calcs.standardPrice.toLocaleString()}*

*(Express / Rush Order: ${currencySymbol}${calcs.rushPrice.toLocaleString()})*

Looking forward to creating your beautiful piece!
— ${user?.businessName || 'Needle Studio'}`;

        await Clipboard.setStringAsync(text);
        Toast.show({
            type: 'success',
            text1: 'Quote Copied to Clipboard!',
            text2: 'Ready to paste directly into WhatsApp or SMS'
        });

        posthog?.capture('pricing_calculator_whatsapp_quote_copied');
    };

    // Share Visual Cost Sheet
    const shareReportImage = async () => {
        if (!reportRef.current) return;
        try {
            await new Promise(resolve => setTimeout(resolve, 200));
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
                text2: 'Could not generate report image.'
            });
        }
    };

    return (
        <SafeAreaView className={`flex-1 ${isDark ? 'bg-black' : 'bg-white'}`} edges={['top']}>
            {/* Header */}
            <View className={`px-4 pt-2 pb-2 flex-row items-center justify-between border-b ${isDark ? 'border-white/5' : 'border-gray-50'}`}>
                <View className="flex-row items-center">
                    <IconButton
                        icon={<ArrowLeft size={22} color={isDark ? "white" : "black"} />}
                        onPress={() => router.back()}
                        variant="ghost"
                        className="-ml-2"
                    />
                    <View className="ml-2">
                        <Typography variant="h3" weight="bold">Pricing Calculator</Typography>
                        <Typography variant="small" color="gray">
                            {paramStyleName ? `For: ${paramStyleName}` : 'Simple quotes for fashion designers'}
                        </Typography>
                    </View>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    className="p-4"
                >
                    {/* Mode Switcher: Quick Quote vs Detailed Breakdown */}
                    <View className={`p-1 rounded-full flex-row mb-5 ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-zinc-200/70 border border-zinc-200'}`}>
                        <TouchableOpacity
                            onPress={() => {
                                setCalcMode('quick');
                                posthog?.capture('pricing_calculator_mode_changed', { mode: 'quick' });
                            }}
                            className={`flex-1 py-2.5 rounded-full items-center flex-row justify-center ${calcMode === 'quick'
                                ? (isDark ? 'bg-zinc-800' : 'bg-white')
                                : 'bg-transparent'
                                }`}
                        >
                            <Flash size={15} color={calcMode === 'quick' ? '#FF5678' : (isDark ? '#71717A' : '#71717A')} />
                            <Typography
                                weight="bold"
                                variant="caption"
                                color={calcMode === 'quick' ? (isDark ? 'white' : 'black') : 'gray'}
                                style={{ color: calcMode === 'quick' ? (isDark ? '#FFFFFF' : '#18181B') : '#71717A' }}
                                className="ml-1.5"
                            >
                                Quick Quote
                            </Typography>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                setCalcMode('detailed');
                                posthog?.capture('pricing_calculator_mode_changed', { mode: 'detailed' });
                            }}
                            className={`flex-1 py-2.5 rounded-full items-center flex-row justify-center ${calcMode === 'detailed'
                                ? (isDark ? 'bg-zinc-800' : 'bg-white')
                                : 'bg-transparent'
                                }`}
                        >
                            <Calculator size={15} color={calcMode === 'detailed' ? '#FF5678' : (isDark ? '#71717A' : '#71717A')} />
                            <Typography
                                weight="bold"
                                variant="caption"
                                color={calcMode === 'detailed' ? (isDark ? 'white' : 'black') : 'gray'}
                                style={{ color: calcMode === 'detailed' ? (isDark ? '#FFFFFF' : '#18181B') : '#71717A' }}
                                className="ml-1.5"
                            >
                                Detailed Breakdown
                            </Typography>
                        </TouchableOpacity>
                    </View>

                    {/* ================= MODE 1: QUICK QUOTE ================= */}
                    {calcMode === 'quick' ? (
                        <View className="gap-4 mb-5">
                            {/* Card 1: Fabric & Materials */}
                            <View className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                                <View className="flex-row justify-between items-center mb-2">
                                    <View>
                                        <Typography variant="body" weight="bold">1. Fabric & Materials Cost</Typography>
                                        <Typography variant="small" color="gray">Fabric, lining, zipper, thread, and trims</Typography>
                                    </View>
                                </View>

                                <View className={`flex-row items-center border rounded-xl px-3.5 py-2.5 mt-2 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                                    <Typography variant="h3" weight="bold" className="text-zinc-400 mr-2">{currencySymbol}</Typography>
                                    <TextInput
                                        keyboardType="numeric"
                                        placeholder="0"
                                        placeholderTextColor={isDark ? '#52525B' : '#A1A1AA'}
                                        value={quickMaterialCost}
                                        onChangeText={setQuickMaterialCost}
                                        className="flex-1 text-xl font-bold text-zinc-900 dark:text-zinc-100 p-0"
                                    />
                                </View>

                                {/* Waste / Offcut Buffer Selector */}
                                <View className="flex-row items-center justify-between mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                                    <Typography variant="small" color="gray">Cutting waste / buffer:</Typography>
                                    <View className="flex-row gap-1.5">
                                        {[
                                            { label: '0%', val: 0 },
                                            { label: '+10%', val: 0.10 },
                                            { label: '+15%', val: 0.15 }
                                        ].map(item => {
                                            const isSelected = quickWastage === item.val;
                                            return (
                                                <TouchableOpacity
                                                    key={item.label}
                                                    onPress={() => setQuickWastage(item.val)}
                                                    className={`px-3 py-1.5 rounded-lg border ${isSelected
                                                        ? 'bg-brand-primary/10 border-brand-primary'
                                                        : (isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-100 border-zinc-200')
                                                        }`}
                                                >
                                                    <Typography
                                                        variant="small"
                                                        weight={isSelected ? 'bold' : 'normal'}
                                                        color={isSelected ? 'primary' : 'gray'}
                                                        style={{ color: isSelected ? '#FF5678' : (isDark ? '#A1A1AA' : '#71717A') }}
                                                    >
                                                        {item.label}
                                                    </Typography>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            </View>

                            {/* Card 2: Sewing & Workmanship */}
                            <View className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                                <View className="mb-2">
                                    <Typography variant="body" weight="bold">2. Sewing & Workmanship Fee</Typography>
                                    <Typography variant="small" color="gray">What you or your tailors charge for cutting and sewing</Typography>
                                </View>

                                <View className={`flex-row items-center border rounded-xl px-3.5 py-2.5 mt-2 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                                    <Typography variant="h3" weight="bold" className="text-zinc-400 mr-2">{currencySymbol}</Typography>
                                    <TextInput
                                        keyboardType="numeric"
                                        placeholder="0"
                                        placeholderTextColor={isDark ? '#52525B' : '#A1A1AA'}
                                        value={quickLaborCost}
                                        onChangeText={setQuickLaborCost}
                                        className="flex-1 text-xl font-bold text-zinc-900 dark:text-zinc-100 p-0"
                                    />
                                </View>
                            </View>

                            {/* Card 3: Target Profit Margin */}
                            <View className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                                <View className="flex-row justify-between items-center mb-3">
                                    <View>
                                        <Typography variant="body" weight="bold">3. Target Profit Margin</Typography>
                                        <Typography variant="small" color="gray">Desired profit margin on this order</Typography>
                                    </View>
                                    <View className="px-2.5 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20">
                                        <Typography variant="caption" weight="bold" color="primary" style={{ color: '#FF5678' }}>
                                            {targetMargin}% Margin
                                        </Typography>
                                    </View>
                                </View>

                                <View className="flex-row gap-2">
                                    {[25, 35, 40, 50].map(pct => {
                                        const isSelected = targetMargin === pct;
                                        return (
                                            <TouchableOpacity
                                                key={pct}
                                                onPress={() => {
                                                    setTargetMargin(pct);
                                                    setCustomMargin(pct.toString());
                                                }}
                                                className={`flex-1 py-2.5 rounded-xl items-center border ${isSelected
                                                    ? 'bg-brand-primary border-brand-primary'
                                                    : (isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200')
                                                    }`}
                                            >
                                                <Typography
                                                    variant="caption"
                                                    weight="bold"
                                                    color={isSelected ? 'white' : (isDark ? 'white' : 'black')}
                                                    style={{ color: isSelected ? '#FFFFFF' : (isDark ? '#D4D4D8' : '#3F3F46') }}
                                                >
                                                    {pct}%
                                                </Typography>
                                            </TouchableOpacity>
                                        );
                                    })}
                                    {/* Custom Margin input */}
                                    <View className={`flex-1 flex-row items-center justify-center border rounded-xl px-2 ${targetMargin !== 25 && targetMargin !== 35 && targetMargin !== 40 && targetMargin !== 50
                                        ? 'border-brand-primary bg-brand-primary/10'
                                        : (isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200')
                                        }`}>
                                        <TextInput
                                            keyboardType="numeric"
                                            value={customMargin}
                                            onChangeText={(val) => {
                                                setCustomMargin(val);
                                                const num = parseFloat(val);
                                                if (!isNaN(num) && num > 0 && num < 100) {
                                                    setTargetMargin(num);
                                                }
                                            }}
                                            placeholder="%"
                                            placeholderTextColor={isDark ? '#52525B' : '#A1A1AA'}
                                            style={{ color: isDark ? '#FFFFFF' : '#18181B' }}
                                            className="text-center font-bold text-xs p-0 w-8"
                                        />
                                        <Typography variant="small" weight="bold" color="gray">%</Typography>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ) : (
                        /* ================= MODE 2: DETAILED BREAKDOWN ================= */
                        <View className="gap-4 mb-5">
                            {/* 1. Itemized Materials */}
                            <View className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                                <View className="flex-row justify-between items-center mb-3 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                                    <View>
                                        <Typography variant="body" weight="bold">1. Itemized Materials</Typography>
                                        <Typography variant="small" color="gray">Fabric, trims, threads & zippers</Typography>
                                    </View>
                                    <Typography variant="caption" weight="bold" color="primary" style={{ color: '#FF5678' }}>
                                        Subtotal: {currencySymbol}{Math.round(calcs.totalMaterials).toLocaleString()}
                                    </Typography>
                                </View>

                                {materials.map((item, index) => (
                                    <View
                                        key={item.id}
                                        className={`py-3 ${index !== materials.length - 1 ? 'border-b border-zinc-100 dark:border-zinc-800/80' : ''}`}
                                    >
                                        <View className="flex-row items-center justify-between mb-1.5">
                                            <TextInput
                                                placeholder={`Item ${index + 1} (e.g. Lace fabric, lining)`}
                                                placeholderTextColor={isDark ? '#52525B' : '#A1A1AA'}
                                                value={item.name}
                                                onChangeText={(val) => updateMaterial(item.id, 'name', val)}
                                                className="flex-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100 p-0"
                                            />
                                            <TouchableOpacity
                                                onPress={() => removeMaterial(item.id)}
                                                className="p-1.5 -mr-1"
                                            >
                                                <Trash size={15} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>

                                        <View className="flex-row items-center gap-2">
                                            <View className={`flex-1 flex-row items-center border rounded-lg px-2.5 py-1.5 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                                                <Typography variant="small" color="gray" className="mr-1">{currencySymbol}</Typography>
                                                <TextInput
                                                    keyboardType="numeric"
                                                    placeholder="Cost"
                                                    placeholderTextColor={isDark ? '#52525B' : '#A1A1AA'}
                                                    value={item.cost}
                                                    onChangeText={(val) => updateMaterial(item.id, 'cost', val)}
                                                    className="flex-1 text-xs font-semibold text-zinc-900 dark:text-zinc-100 p-0"
                                                />
                                            </View>

                                            <Typography variant="small" color="gray">×</Typography>

                                            <View className={`w-20 flex-row items-center border rounded-lg px-2.5 py-1.5 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                                                <TextInput
                                                    keyboardType="numeric"
                                                    placeholder="Qty/Yds"
                                                    placeholderTextColor={isDark ? '#52525B' : '#A1A1AA'}
                                                    value={item.qty}
                                                    onChangeText={(val) => updateMaterial(item.id, 'qty', val)}
                                                    className="flex-1 text-xs font-semibold text-zinc-900 dark:text-zinc-100 p-0 text-center"
                                                />
                                            </View>

                                            <TouchableOpacity
                                                onPress={() => cycleWastage(item.id, item.wastage)}
                                                className={`px-2 py-1.5 rounded-lg border ${item.wastage > 0
                                                    ? 'bg-brand-primary/10 border-brand-primary/40'
                                                    : (isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200')
                                                    }`}
                                            >
                                                <Typography
                                                    variant="small"
                                                    weight="semibold"
                                                    color={item.wastage > 0 ? 'primary' : 'gray'}
                                                    style={{ color: item.wastage > 0 ? '#FF5678' : (isDark ? '#71717A' : '#A1A1AA') }}
                                                    className="text-[10px]"
                                                >
                                                    +{Math.round(item.wastage * 100)}% waste
                                                </Typography>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}

                                <TouchableOpacity
                                    onPress={addMaterial}
                                    className={`flex-row items-center justify-center p-3 mt-3 border border-dashed rounded-xl ${isDark ? 'border-zinc-800 bg-zinc-950/60' : 'border-zinc-300 bg-zinc-50'}`}
                                >
                                    <AddCircle size={16} color={isDark ? '#E4E4E7' : '#52525B'} />
                                    <Typography variant="small" weight="bold" className="ml-1.5 text-zinc-700 dark:text-zinc-300">
                                        Add Another Material
                                    </Typography>
                                </TouchableOpacity>
                            </View>

                            {/* 2. Sewing & Labor */}
                            <View className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                                <View className="flex-row justify-between items-center mb-3 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                                    <View>
                                        <Typography variant="body" weight="bold">2. Tailoring Labor</Typography>
                                        <Typography variant="small" color="gray">Workmanship & cutting fee</Typography>
                                    </View>
                                    <Typography variant="caption" weight="bold" color="primary" style={{ color: '#FF5678' }}>
                                        Labor: {currencySymbol}{Math.round(calcs.totalLabor).toLocaleString()}
                                    </Typography>
                                </View>

                                <View className="flex-row gap-2 mb-3">
                                    <TouchableOpacity
                                        onPress={() => setLaborMode('fixed')}
                                        className={`flex-1 py-2.5 rounded-xl items-center border ${laborMode === 'fixed'
                                            ? 'bg-brand-primary border-brand-primary'
                                            : (isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-zinc-50 border-zinc-200')
                                            }`}
                                    >
                                        <Typography
                                            variant="caption"
                                            weight="bold"
                                            color={laborMode === 'fixed' ? 'white' : 'gray'}
                                            style={{ color: laborMode === 'fixed' ? '#FFFFFF' : (isDark ? '#A1A1AA' : '#71717A') }}
                                        >
                                            Flat Sewing Fee
                                        </Typography>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => setLaborMode('hourly')}
                                        className={`flex-1 py-2.5 rounded-xl items-center border ${laborMode === 'hourly'
                                            ? 'bg-brand-primary border-brand-primary'
                                            : (isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-zinc-50 border-zinc-200')
                                            }`}
                                    >
                                        <Typography
                                            variant="caption"
                                            weight="bold"
                                            color={laborMode === 'hourly' ? 'white' : 'gray'}
                                            style={{ color: laborMode === 'hourly' ? '#FFFFFF' : (isDark ? '#A1A1AA' : '#71717A') }}
                                        >
                                            Hourly Rate
                                        </Typography>
                                    </TouchableOpacity>
                                </View>

                                {laborMode === 'fixed' ? (
                                    <View className={`flex-row items-center border rounded-xl px-3.5 py-2.5 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                                        <Typography variant="body" weight="bold" className="text-zinc-400 mr-2">{currencySymbol}</Typography>
                                        <TextInput
                                            keyboardType="numeric"
                                            placeholder="Flat tailoring fee"
                                            placeholderTextColor={isDark ? '#52525B' : '#A1A1AA'}
                                            value={fixedLaborFee}
                                            onChangeText={setFixedLaborFee}
                                            className="flex-1 text-base font-bold text-zinc-900 dark:text-zinc-100 p-0"
                                        />
                                    </View>
                                ) : (
                                    <View className="flex-row gap-3">
                                        <View className={`flex-1 flex-row items-center border rounded-xl px-3 py-2 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                                            <Typography variant="small" weight="bold" className="text-zinc-400 mr-1">{currencySymbol}</Typography>
                                            <TextInput
                                                keyboardType="numeric"
                                                placeholder="Rate/hr"
                                                placeholderTextColor={isDark ? '#52525B' : '#A1A1AA'}
                                                value={hourlyRate}
                                                onChangeText={setHourlyRate}
                                                className="flex-1 text-sm font-bold text-zinc-900 dark:text-zinc-100 p-0"
                                            />
                                        </View>
                                        <View className={`flex-1 flex-row items-center border rounded-xl px-3 py-2 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                                            <TextInput
                                                keyboardType="numeric"
                                                placeholder="Total hrs"
                                                placeholderTextColor={isDark ? '#52525B' : '#A1A1AA'}
                                                value={hourlyHours}
                                                onChangeText={setHourlyHours}
                                                className="flex-1 text-sm font-bold text-zinc-900 dark:text-zinc-100 p-0"
                                            />
                                            <Typography variant="small" color="gray" className="ml-1">hrs</Typography>
                                        </View>
                                    </View>
                                )}
                            </View>

                            {/* 3. Studio & Shop Running Buffer */}
                            <View className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                                <View className="flex-row justify-between items-center mb-1.5">
                                    <View>
                                        <Typography variant="body" weight="bold">3. Studio Overhead Buffer</Typography>
                                        <Typography variant="small" color="gray">Generator fuel, needles, electricity & rent</Typography>
                                    </View>
                                    <Typography variant="caption" weight="bold" color="primary" style={{ color: '#FF5678' }}>
                                        +{currencySymbol}{Math.round(calcs.totalBuffer).toLocaleString()}
                                    </Typography>
                                </View>

                                <View className="flex-row gap-2 mt-3">
                                    {[0, 5, 10, 15, 20].map(pct => {
                                        const isSelected = shopBufferPercent === pct;
                                        return (
                                            <TouchableOpacity
                                                key={pct}
                                                onPress={() => setShopBufferPercent(pct)}
                                                className={`flex-1 py-2 rounded-xl items-center border ${isSelected
                                                    ? 'bg-brand-primary border-brand-primary'
                                                    : (isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200')
                                                    }`}
                                            >
                                                <Typography
                                                    variant="caption"
                                                    weight="bold"
                                                    color={isSelected ? 'white' : (isDark ? 'white' : 'black')}
                                                    style={{ color: isSelected ? '#FFFFFF' : (isDark ? '#D4D4D8' : '#3F3F46') }}
                                                >
                                                    {pct}%
                                                </Typography>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* 4. Target Profit Margin for Detailed Mode */}
                            <View className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                                <View className="flex-row justify-between items-center mb-3">
                                    <View>
                                        <Typography variant="body" weight="bold">4. Target Profit Margin</Typography>
                                        <Typography variant="small" color="gray">Desired profit percentage</Typography>
                                    </View>
                                    <View className="px-2.5 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20">
                                        <Typography variant="caption" weight="bold" color="primary" style={{ color: '#FF5678' }}>
                                            {targetMargin}% Margin
                                        </Typography>
                                    </View>
                                </View>

                                <View className="flex-row gap-2">
                                    {[25, 35, 40, 50].map(pct => {
                                        const isSelected = targetMargin === pct;
                                        return (
                                            <TouchableOpacity
                                                key={pct}
                                                onPress={() => {
                                                    setTargetMargin(pct);
                                                    setCustomMargin(pct.toString());
                                                }}
                                                className={`flex-1 py-2.5 rounded-xl items-center border ${isSelected
                                                    ? 'bg-brand-primary border-brand-primary'
                                                    : (isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200')
                                                    }`}
                                            >
                                                <Typography
                                                    variant="caption"
                                                    weight="bold"
                                                    color={isSelected ? 'white' : (isDark ? 'white' : 'black')}
                                                    style={{ color: isSelected ? '#FFFFFF' : (isDark ? '#D4D4D8' : '#3F3F46') }}
                                                >
                                                    {pct}%
                                                </Typography>
                                            </TouchableOpacity>
                                        );
                                    })}
                                    <View className={`flex-1 flex-row items-center justify-center border rounded-xl px-2 ${targetMargin !== 25 && targetMargin !== 35 && targetMargin !== 40 && targetMargin !== 50
                                        ? 'border-brand-primary bg-brand-primary/10'
                                        : (isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200')
                                        }`}>
                                        <TextInput
                                            keyboardType="numeric"
                                            value={customMargin}
                                            onChangeText={(val) => {
                                                setCustomMargin(val);
                                                const num = parseFloat(val);
                                                if (!isNaN(num) && num > 0 && num < 100) {
                                                    setTargetMargin(num);
                                                }
                                            }}
                                            placeholder="%"
                                            placeholderTextColor={isDark ? '#52525B' : '#A1A1AA'}
                                            style={{ color: isDark ? '#FFFFFF' : '#18181B' }}
                                            className="text-center font-bold text-xs p-0 w-8"
                                        />
                                        <Typography variant="small" weight="bold" color="gray">%</Typography>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* ================= EXISTING ORDER ANALYSIS BANNER ================= */}
                    {initialAmount > 0 && (
                        <View className={`p-4 mb-5 rounded-2xl border ${isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                            <View className="flex-row justify-between items-center mb-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                                <Typography variant="caption" weight="bold" color="gray" className="uppercase tracking-wider">
                                    Current Order Price Check
                                </Typography>
                                <Typography variant="caption" weight="bold" className={initialProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                                    {initialProfit >= 0 ? `+${currencySymbol}${Math.round(initialProfit).toLocaleString()} profit` : `Loss of ${currencySymbol}${Math.abs(Math.round(initialProfit)).toLocaleString()}`}
                                </Typography>
                            </View>

                            <View className="flex-row justify-between items-center">
                                <View>
                                    <Typography variant="small" color="gray">Current Order Total:</Typography>
                                    <Typography variant="h3" weight="bold">
                                        {currencySymbol}{initialAmount.toLocaleString()}
                                    </Typography>
                                </View>
                                <View className="items-end">
                                    <Typography variant="small" color="gray">Production Cost:</Typography>
                                    <Typography variant="h3" weight="bold" className="text-zinc-500 dark:text-zinc-400">
                                        {currencySymbol}{Math.round(calcs.totalCost).toLocaleString()}
                                    </Typography>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* ================= RESULTS / REPORT CARD (CAPTURABLE) ================= */}
                    <View
                        ref={reportRef}
                        collapsable={false}
                        className={`p-5 rounded-3xl border mb-5 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'}`}
                        style={{ width: width - 32, alignSelf: 'center' }}
                    >
                        {/* Header */}
                        <View className="flex-row justify-between items-center pb-3.5 mb-4 border-b border-zinc-100 dark:border-zinc-850">
                            <View>
                                <Typography variant="subtitle" weight="bold">
                                    {paramStyleName ? paramStyleName : 'Pricing Recommendation'}
                                </Typography>
                                <Typography variant="small" color="gray">
                                    {user?.businessName || 'Tailor Studio'}
                                </Typography>
                            </View>
                            <View className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-850">
                                <Typography variant="small" weight="bold" className="text-zinc-700 dark:text-zinc-300 text-[11px]">
                                    {calcMode === 'quick' ? 'Quick Quote' : 'Detailed Sheet'}
                                </Typography>
                            </View>
                        </View>

                        {/* Price Cards */}
                        <View className="gap-3 mb-4">
                            {/* Tier 1: Standard Price */}
                            <View className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-brand-primary/5 border-brand-primary/25'}`}>
                                <View className="flex-row justify-between items-center mb-1">
                                    <Typography variant="caption" weight="bold" color="primary" style={{ color: '#FF5678' }} className="uppercase tracking-wider text-[11px]">
                                        Standard Customer Quote
                                    </Typography>
                                    <View className="px-2 py-0.5 rounded-full bg-brand-primary/10">
                                        <Typography variant="small" weight="bold" color="primary" style={{ color: '#FF5678' }} className="text-[10px]">
                                            {Math.round(calcs.actualStandardMargin)}% Margin
                                        </Typography>
                                    </View>
                                </View>

                                <View className="flex-row justify-between items-baseline mt-1">
                                    <Typography variant="h1" weight="extrabold" className="text-zinc-900 dark:text-white">
                                        {currencySymbol}{calcs.standardPrice.toLocaleString()}
                                    </Typography>
                                    <Typography variant="small" weight="bold" className="text-emerald-600 dark:text-emerald-400">
                                        Profit: +{currencySymbol}{Math.round(calcs.standardProfit).toLocaleString()}
                                    </Typography>
                                </View>
                            </View>

                            {/* Tier 2: Rush / Express Price */}
                            <View className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                                <View className="flex-row justify-between items-center mb-1">
                                    <View className="flex-row items-center">
                                        <Flash size={13} color="#F59E0B" />
                                        <Typography variant="caption" weight="bold" className="uppercase tracking-wider text-amber-600 dark:text-amber-400 ml-1 text-[11px]">
                                            Rush / Express Delivery (+30%)
                                        </Typography>
                                    </View>
                                    <View className="px-2 py-0.5 rounded-full bg-amber-500/10">
                                        <Typography variant="small" weight="bold" className="text-amber-600 dark:text-amber-400 text-[10px]">
                                            {Math.round(calcs.actualRushMargin)}% Margin
                                        </Typography>
                                    </View>
                                </View>

                                <View className="flex-row justify-between items-baseline mt-1">
                                    <Typography variant="h2" weight="bold" className="text-zinc-800 dark:text-zinc-200">
                                        {currencySymbol}{calcs.rushPrice.toLocaleString()}
                                    </Typography>
                                    <Typography variant="small" weight="bold" className="text-emerald-600 dark:text-emerald-400">
                                        Profit: +{currencySymbol}{Math.round(calcs.rushProfit).toLocaleString()}
                                    </Typography>
                                </View>
                            </View>
                        </View>

                        {/* Profit Health Message */}
                        {calcs.totalCost > 0 && (
                            <View className={`p-3 rounded-xl border flex-row items-start mb-4 ${health.badgeBg}`}>
                                <InfoCircle size={16} color={calcs.actualStandardMargin >= 40 ? '#059669' : (calcs.actualStandardMargin >= 25 ? '#D97706' : '#E11D48')} className="mt-0.5 mr-2" />
                                <View className="flex-1">
                                    <Typography variant="caption" weight="bold" className={health.textColor}>
                                        {health.label}
                                    </Typography>
                                    <Typography variant="small" className={`mt-0.5 text-xs leading-4 ${health.textColor}`}>
                                        {health.description}
                                    </Typography>
                                </View>
                            </View>
                        )}

                        {/* Cost Breakdown Summary */}
                        <View className={`p-3.5 rounded-2xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
                            <View className="flex-row justify-between items-center mb-2">
                                <Typography variant="caption" weight="bold" color="gray" className="uppercase tracking-wider text-[10px]">
                                    Cost Breakdown
                                </Typography>
                                <Typography variant="caption" weight="bold" className="text-zinc-900 dark:text-zinc-100">
                                    Total Cost: {currencySymbol}{Math.round(calcs.totalCost).toLocaleString()}
                                </Typography>
                            </View>

                            {/* Ratio Progress Bar */}
                            {calcs.totalCost > 0 && (
                                <View className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 flex-row overflow-hidden mb-3">
                                    <View
                                        style={{ flex: calcs.totalMaterials || 0.001 }}
                                        className="bg-brand-primary h-full"
                                    />
                                    <View
                                        style={{ flex: calcs.totalLabor || 0.001 }}
                                        className="bg-blue-500 h-full"
                                    />
                                    {calcs.totalBuffer > 0 && (
                                        <View
                                            style={{ flex: calcs.totalBuffer }}
                                            className="bg-purple-500 h-full"
                                        />
                                    )}
                                </View>
                            )}

                            <View className="gap-1.5">
                                <View className="flex-row justify-between items-center">
                                    <View className="flex-row items-center">
                                        <View className="w-2 h-2 rounded-full bg-brand-primary mr-2" />
                                        <Typography variant="small" color="gray">Fabric & Materials</Typography>
                                    </View>
                                    <Typography variant="small" weight="bold">
                                        {currencySymbol}{Math.round(calcs.totalMaterials).toLocaleString()}
                                    </Typography>
                                </View>

                                <View className="flex-row justify-between items-center">
                                    <View className="flex-row items-center">
                                        <View className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                                        <Typography variant="small" color="gray">Sewing & Workmanship</Typography>
                                    </View>
                                    <Typography variant="small" weight="bold">
                                        {currencySymbol}{Math.round(calcs.totalLabor).toLocaleString()}
                                    </Typography>
                                </View>

                                {calcs.totalBuffer > 0 && (
                                    <View className="flex-row justify-between items-center">
                                        <View className="flex-row items-center">
                                            <View className="w-2 h-2 rounded-full bg-purple-500 mr-2" />
                                            <Typography variant="small" color="gray">Studio Overhead Buffer</Typography>
                                        </View>
                                        <Typography variant="small" weight="bold">
                                            {currencySymbol}{Math.round(calcs.totalBuffer).toLocaleString()}
                                        </Typography>
                                    </View>
                                )}
                            </View>
                        </View>

                        <View className="mt-4">
                            <Typography className="text-center text-[10px] text-zinc-400 uppercase tracking-widest">
                                Calculated with Needle Africa
                            </Typography>
                        </View>
                    </View>

                    {/* ================= ACTION BUTTONS (NO DROP SHADOWS!) ================= */}
                    <View className="gap-3">
                        {/* If orderId is provided: Apply to Order buttons */}
                        {orderId && (
                            <View className="gap-2.5">
                                <TouchableOpacity
                                    onPress={() => handleApplyPrice(calcs.standardPrice, 'Standard')}
                                    activeOpacity={0.85}
                                    className="h-13 py-3.5 px-4 rounded-xl bg-brand-primary flex-row items-center justify-center"
                                >
                                    <TickCircle size={18} color="white" />
                                    <Typography variant="body" weight="bold" color="white" style={{ color: '#FFFFFF' }} className="ml-2">
                                        Apply Standard ({currencySymbol}{calcs.standardPrice.toLocaleString()}) to Order
                                    </Typography>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => handleApplyPrice(calcs.rushPrice, 'Rush')}
                                    activeOpacity={0.85}
                                    className={`py-3 px-4 rounded-xl flex-row items-center justify-center border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}
                                >
                                    <Flash size={16} color="#F59E0B" />
                                    <Typography variant="body" weight="bold" className="ml-2 text-zinc-900 dark:text-zinc-100">
                                        Apply Rush Price ({currencySymbol}{calcs.rushPrice.toLocaleString()})
                                    </Typography>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Customer Share & Copy Buttons */}
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={copyWhatsAppQuote}
                                activeOpacity={0.8}
                                className={`flex-1 h-12 rounded-xl flex-row items-center justify-center border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}
                            >
                                <Copy size={18} color={isDark ? '#E4E4E7' : '#3F3F46'} />
                                <Typography weight="bold" variant="body" className="ml-2 text-zinc-800 dark:text-zinc-200">
                                    Copy Quote
                                </Typography>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={shareReportImage}
                                activeOpacity={0.8}
                                className="flex-1 h-12 rounded-xl flex-row items-center justify-center bg-blue-600"
                            >
                                <Svg width="18" height="18" viewBox="0 0 24 24">
                                    <Path
                                        fill="none"
                                        stroke="white"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M8 7s2.196-2.716 3.404-3.761a.9.9 0 0 1 .63-.238a.92.92 0 0 1 .562.238C13.804 4.284 16 7 16 7m-3.966-3v11M8 11c-1.4 0-2.1 0-2.635.273a2.5 2.5 0 0 0-1.093 1.092C4 12.9 4 13.6 4 15v1c0 2.357 0 3.535.732 4.268S6.643 21 9 21h6c2.357 0 3.535 0 4.268-.732C20 19.535 20 18.357 20 16v-1c0-1.4 0-2.1-.273-2.635a2.5 2.5 0 0 0-1.092-1.092C18.1 11 17.4 11 16 11"
                                    />
                                </Svg>
                                <Typography weight="bold" variant="body" className="ml-2 text-white">
                                    Share Sheet
                                </Typography>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
