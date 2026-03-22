import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator, Share, Image, Dimensions, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import ViewShot from 'react-native-view-shot';
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
import { ModernTemplate, ClassicTemplate, MinimalTemplate, CreativeTemplate, ElegantTemplate, BoldTemplate, CorporateTemplate } from '../../../../components/invoice-templates';

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
    
    const viewShotRef = useRef<ViewShot>(null);

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
        const templates = [
            ModernTemplate, 
            ClassicTemplate, 
            MinimalTemplate, 
            CreativeTemplate, 
            ElegantTemplate, 
            BoldTemplate, 
            CorporateTemplate
        ];
        const SelectedTemplate = templates[templateId] || ModernTemplate;

        return SelectedTemplate({ user, invoice, customer, order });
    }, [invoice, customer, order, user]);

    const scale = previewWidth / 800;
    const previewHtml = useMemo(() => {
        if (!htmlContent) return '';
        // By replacing the viewport meta tag, we force WebKit to optically scale down the 800px document to match the physical wrapper width
        // Wait, on some Android systems initial-scale breaks the layout width logic. Using CSS transform scale is 100% reliable across all WebKit browsers.
        return htmlContent.replace('</head>', `
            <style>
                @media screen {
                    html { 
                        transform: scale(${scale}); 
                        transform-origin: top left; 
                        width: 800px;
                        height: 1050px;
                        overflow: hidden;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                    }
                }
            </style>
        </head>`);
    }, [htmlContent, scale]);

    const handleDownloadPDF = async () => {
        setIsExporting(true);
        try {
            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, { UTI: 'com.adobe.pdf', mimeType: 'application/pdf' });
            }
        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Failed to generate PDF' });
        } finally {
            setIsExporting(false);
        }
    };

    const handleDownloadPNG = async () => {
        setIsExporting(true);
        // Add a slight delay to ensure UI threads have caught up if just clicked
        setTimeout(async () => {
            try {
                const uri = await viewShotRef.current?.capture?.();
                if (uri && await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(uri, { UTI: 'public.png', mimeType: 'image/png' });
                } else {
                    Toast.show({ type: 'error', text1: 'Sharing unavailable natively' });
                }
            } catch (error) {
                console.error(error);
                Toast.show({ type: 'error', text1: 'Failed to export PNG image' });
            } finally {
                setIsExporting(false);
            }
        }, 100);
    };

    const handleShare = async () => {
        // Direct trigger of PNG share
        await handleDownloadPNG();
    };

    const handleDownload = () => {
        Alert.alert(
            "Download Format",
            "Please select how you'd like to export this invoice.",
            [
                { text: "Download PNG (Image)", onPress: handleDownloadPNG },
                { text: "Download PDF (Document)", onPress: handleDownloadPDF },
                { text: "Cancel", style: "cancel" }
            ]
        );
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
                    <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
                        <Surface variant="white" className={`shadow-lg overflow-hidden bg-white ${isDark ? 'border border-white/10' : 'border border-gray-100'}`} rounded="2xl" style={{ width: previewWidth, height: previewHeight }}>
                            <WebView
                                source={{ html: previewHtml }}
                                style={{ flex: 1, backgroundColor: 'white' }}
                                scrollEnabled={false}
                                originWhitelist={['*']}
                                scalesPageToFit={true}
                            />
                        </Surface>
                    </ViewShot>
                </View>

                <View className="flex-row gap-4">
                    <Button
                        onPress={handleDownload}
                        isLoading={isExporting}
                        className={`flex-1 h-16 rounded-full border-0 shadow-lg ${isDark ? 'bg-blue-500 shadow-white/5' : 'bg-dark shadow-dark/5'}`}
                    >
                        <View className="flex-row items-center">
                            <DocumentDownload size={20} color={"white"} className="mr-3" />
                            <Typography weight="bold" color="white">Download</Typography>
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
