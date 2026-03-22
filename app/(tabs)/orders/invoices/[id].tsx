import React, { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator, Share, Image, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, DocumentDownload, ExportCurve, Printer, Trash } from 'iconsax-react-native';
import { Typography } from '../../../../components/ui/Typography';
import { Surface } from '../../../../components/ui/Surface';
import { IconButton } from '../../../../components/ui/IconButton';
import { Button } from '../../../../components/ui/Button';
import { useDatabase } from '@nozbe/watermelondb/hooks';
import Invoice from '../../../../database/watermelon/models/Invoice';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../../../../contexts/AuthContext';
import Toast from 'react-native-toast-message';
import { useConfirm } from '../../../../contexts/ConfirmContext';
import { useTheme } from '../../../../contexts/ThemeContext';
import { ModernTemplate, ClassicTemplate, MinimalTemplate, CreativeTemplate } from '../../../../components/invoice-templates';

export default function InvoiceDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const database = useDatabase();
    const { user } = useAuth();
    const { confirm } = useConfirm();
    const { isDark } = useTheme();

    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [customer, setCustomer] = useState<any>(null);
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    // Calculate preview dimensions so it fits on screen all at once (A4 aspect ratio)
    const windowHeight = Dimensions.get('window').height;
    const previewHeight = Math.min(windowHeight * 0.65, 700);
    const previewWidth = previewHeight / 1.414;

    useEffect(() => {
        if (!id) return;

        const loadData = async () => {
            try {
                const inv = await database.get<Invoice>('invoices').find(id);
                setInvoice(inv);

                if (inv) {
                    const cust = await inv!.customer!.fetch();
                    setCustomer(cust);

                    const ord = await inv!.order!.fetch();
                    setOrder(ord);
                }
            } catch (error) {
                console.error(error);
                confirm({
                    title: 'Error',
                    message: 'Failed to load invoice details',
                    confirmText: 'OK',
                    onConfirm: () => { }
                });
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id, database]);

    const htmlContent = useMemo(() => {
        if (!invoice || !customer || !order || !user) return '';

        const templateId = user.invoiceTemplate || 0;
        const templates = [ModernTemplate, ClassicTemplate, MinimalTemplate, CreativeTemplate];
        const SelectedTemplate = templates[templateId] || ModernTemplate;

        return SelectedTemplate({ user, invoice, customer, order });
    }, [invoice, customer, order, user]);

    const handlePrint = async () => {
        setIsExporting(true);
        try {
            await Print.printAsync({
                html: htmlContent,
            });
        } catch (error) {
            console.error(error);
            confirm({
                title: 'Error',
                message: 'Failed to print invoice',
                confirmText: 'OK',
                onConfirm: () => { }
            });
        } finally {
            setIsExporting(false);
        }
    };

    const handleShare = async () => {
        setIsExporting(true);
        try {
            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri);
            } else {
                confirm({
                    title: 'Error',
                    message: 'Sharing is not available on this device',
                    confirmText: 'OK',
                    onConfirm: () => { }
                });
            }
        } catch (error) {
            console.error(error);
            confirm({
                title: 'Error',
                message: 'Failed to share invoice',
                confirmText: 'OK',
                onConfirm: () => { }
            });
        } finally {
            setIsExporting(false);
        }
    };

    const handleDelete = async () => {
        confirm({
            title: 'Delete Invoice',
            message: 'Are you sure you want to delete this invoice?',
            confirmText: 'Delete',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await invoice?.softDelete();
                    Toast.show({ type: 'success', text1: 'Invoice deleted' });
                    router.back();
                } catch (error) {
                    confirm({
                        title: 'Error',
                        message: 'Failed to delete invoice',
                        confirmText: 'OK',
                        onConfirm: () => { }
                    });
                }
            }
        });
    };

    if (loading) {
        return (
            <View className={`flex-1 items-center justify-center ${isDark ? 'bg-background-dark' : 'bg-white'}`}>
                <ActivityIndicator color={isDark ? "white" : "black"} />
            </View>
        );
    }

    if (!invoice) {
        return (
            <View className={`flex-1 items-center justify-center ${isDark ? 'bg-background-dark' : 'bg-white'}`}>
                <Typography>Invoice not found</Typography>
                <Button onPress={() => router.back()} className="mt-4">Go Back</Button>
            </View>
        );
    }

    return (
        <View className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-white'}`}>
            {/* <SafeAreaView className="flex-1" > */}
            <View className={`px-6 py-4 flex-row justify-between items-center border-b ${isDark ? 'border-border-dark' : 'border-gray-50'}`}>
                <IconButton
                    icon={<ArrowLeft size={20} color={isDark ? "white" : "black"} />}
                    onPress={() => router.back()}
                    variant="ghost"
                    className="-ml-2"
                />
                <Typography variant="h3" weight="bold">Invoice Preview</Typography>
                <IconButton
                    icon={<Trash size={20} color="#EF4444" />}
                    onPress={handleDelete}
                    variant="ghost"
                    className="-mr-2"
                />
            </View>

            <ScrollView contentContainerClassName="p-6 pb-32" showsVerticalScrollIndicator={false}>
                <View className="items-center w-full mb-8">
                    <Surface variant="white" className={`shadow-2xl overflow-hidden bg-white ${isDark ? 'border border-white/10' : 'border border-gray-100'}`} rounded="2xl" style={{ width: previewWidth, height: previewHeight }}>
                        <WebView
                            source={{ html: htmlContent }}
                            style={{ flex: 1, backgroundColor: 'white' }}
                            scrollEnabled={false}
                            originWhitelist={['*']}
                            scalesPageToFit={true}
                        />
                    </Surface>
                </View>

                <View className="flex-row gap-4">
                    <Button
                        onPress={handlePrint}
                        isLoading={isExporting}
                        className={`flex-1 h-16 rounded-full border-0 shadow-lg ${isDark ? 'bg-blue-500 shadow-white/5' : 'bg-dark shadow-dark/5'}`}
                    >
                        <View className="flex-row items-center">
                            <Printer size={20} color={"white"} className="mr-3" />
                            <Typography weight="bold" color="white">Print PDF</Typography>
                        </View>
                    </Button>
                    <Button
                        onPress={handleShare}
                        isLoading={isExporting}
                        className={`flex-1 h-16 rounded-full border-2 ${isDark ? 'border-border-dark bg-transparent' : 'border-gray-200 bg-white'}`}
                    >
                        <View className="flex-row items-center">
                            <ExportCurve size={20} color={isDark ? "white" : "black"} className="mr-3" />
                            <Typography weight="bold" color={isDark ? "white" : "black"}>Share</Typography>
                        </View>
                    </Button>
                </View>
            </ScrollView>
            {/* </SafeAreaView> */}
        </View>
    );
}
