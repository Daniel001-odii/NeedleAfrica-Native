import React, { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator, Share } from 'react-native';
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

        return `
            <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
                    <style>
                        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1c1c1e; background-color: white; padding: 40px; }
                        .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
                        .business-name { font-size: 24px; font-weight: bold; color: #4f46e5; }
                        .invoice-title { font-size: 48px; font-weight: 800; color: #f3f4f6; position: absolute; top: -10px; right: 40px; z-index: -1; }
                        .section { margin-bottom: 30px; }
                        .label { font-size: 10px; color: #6b7280; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
                        .value { font-size: 16px; font-weight: 600; }
                        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                        .table { width: 100%; border-collapse: collapse; margin-top: 40px; }
                        .table th { text-align: left; padding: 12px; border-bottom: 2px solid #f3f4f6; color: #6b7280; font-size: 12px; text-transform: uppercase; }
                        .table td { padding: 20px 12px; border-bottom: 1px solid #f3f4f6; }
                        .amount { font-size: 18px; font-weight: bold; text-align: right; }
                        .footer { margin-top: 60px; text-align: center; color: #9ca3af; font-size: 12px; }
                        .total-section { margin-top: 30px; display: flex; justify-content: flex-end; }
                        .total-box { background: #f9fafb; padding: 20px; border-radius: 12px; min-width: 200px; }
                        .total-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
                        .total-label { font-weight: bold; }
                        .grand-total { font-size: 24px; font-weight: 800; color: #1c1c1e; }
                    </style>
                </head>
                <body>
                    <div class="invoice-title">INVOICE</div>
                    <div class="header">
                        <div>
                            <div class="business-name">${user.businessName || 'Needle Africa Tailor'}</div>
                            <div style="color: #6b7280; margin-top: 5px;">${user.email}</div>
                            <div style="color: #6b7280;">${user.phoneNumber || ''}</div>
                        </div>
                        <div style="text-align: right;">
                            <div class="label">Date</div>
                            <div class="value">${new Date(invoice.createdAt || 0).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        </div>
                    </div>

                    <div class="grid">
                        <div class="section">
                            <div class="label">Invoice Number</div>
                            <div class="value">${invoice.invoiceNumber}</div>
                        </div>
                        <div class="section" style="text-align: right;">
                            <div class="label">Billed To</div>
                            <div class="value">${customer.fullName}</div>
                            <div style="color: #6b7280; margin-top: 2px;">${customer.phoneNumber || ''}</div>
                        </div>
                    </div>

                    <table class="table">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th style="text-align: right;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <div style="font-weight: bold; font-size: 16px;">${order.styleName}</div>
                                    <div style="color: #6b7280; font-size: 12px; margin-top: 4px;">Custom tailoring service</div>
                                </td>
                                <td class="amount">${invoice.currency} ${(invoice.amount || 0).toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="total-section">
                        <div class="total-box">
                            <div class="total-row">
                                <span class="total-label">Subtotal</span>
                                <span>${invoice.currency} ${(invoice.amount || 0).toLocaleString()}</span>
                            </div>
                            <div class="total-row" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                                <span class="total-label">Total Amount</span>
                                <span class="grand-total">${invoice.currency} ${(invoice.amount || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    ${invoice.notes ? `
                    <div class="section" style="margin-top: 40px;">
                        <div class="label">Notes</div>
                        <div style="color: #4b5563; line-height: 1.5;">${invoice.notes}</div>
                    </div>
                    ` : ''}

                    <div class="footer">
                        <p>Thank you for your business!</p>
                        <p>Generated via Needle Africa</p>
                    </div>
                </body>
            </html>
        `;
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
                {/* Paper Preview - Always white background for realism */}
                <Surface variant="white" className={`p-8 mb-8 shadow-xl min-h-[500px] bg-white ${isDark ? 'border border-white/10' : 'border border-gray-100'}`} rounded="none">
                    <View className="flex-row justify-between mb-10">
                        <View className="flex-1 mr-4">
                            <Typography variant="h3" weight="bold" className="text-brand-primary">{user?.businessName || 'Needle Africa'}</Typography>
                            <Typography variant="small" color="gray" className="mt-1">{user?.email}</Typography>
                            {user?.phoneNumber && <Typography variant="small" color="gray">{user?.phoneNumber}</Typography>}
                        </View>
                        <View className="items-end">
                            <Typography variant="caption" color="gray" weight="bold" className="uppercase tracking-widest">Date</Typography>
                            <Typography weight="bold" className="mt-1 text-slate-900">
                                {new Date(invoice.createdAt || 0).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                            </Typography>
                        </View>
                    </View>

                    <View className="flex-row justify-between mb-10">
                        <View>
                            <Typography variant="caption" color="gray" weight="bold" className="uppercase tracking-widest">Invoice No.</Typography>
                            <Typography variant="subtitle" weight="bold" className="mt-1 text-slate-900">{invoice.invoiceNumber}</Typography>
                        </View>
                        <View className="items-end">
                            <Typography variant="caption" color="gray" weight="bold" className="uppercase tracking-widest">Billed To</Typography>
                            <Typography weight="bold" className="mt-1 text-slate-900">{customer?.fullName}</Typography>
                            <Typography variant="small" color="gray">{customer?.phoneNumber}</Typography>
                        </View>
                    </View>

                    <View className="border-b border-gray-100 pb-4 mb-6">
                        <View className="flex-row justify-between mb-4">
                            <Typography variant="caption" color="gray" weight="bold" className="uppercase tracking-widest">Description</Typography>
                            <Typography variant="caption" color="gray" weight="bold" className="uppercase tracking-widest">Amount</Typography>
                        </View>
                        <View className="flex-row justify-between items-start">
                            <View className="flex-1 mr-10">
                                <Typography variant="body" weight="bold" className="text-slate-900">{order?.styleName}</Typography>
                                <Typography variant="caption" color="gray" className="mt-1">Custom tailoring service</Typography>
                            </View>
                            <Typography weight="bold" variant="body" className="text-slate-900">
                                {invoice.currency} {(invoice.amount || 0).toLocaleString()}
                            </Typography>
                        </View>
                    </View>

                    <View className="items-end">
                        <View className="bg-gray-50 p-6 w-56 rounded-2xl">
                            <View className="flex-row justify-between mb-3">
                                <Typography variant="small" color="gray">Subtotal</Typography>
                                <Typography variant="small" weight="bold" className="text-slate-900">{(invoice.amount || 0).toLocaleString()}</Typography>
                            </View>
                            <View className="flex-row justify-between border-t border-gray-200 pt-3 mt-1">
                                <Typography variant="body" weight="bold" className="text-slate-900">Total</Typography>
                                <Typography variant="h3" weight="bold" className="text-brand-primary" family="grotesk">
                                    {invoice.currency} {(invoice.amount || 0).toLocaleString()}
                                </Typography>
                            </View>
                        </View>
                    </View>

                    {invoice.notes && (
                        <View className="mt-10 pt-10 border-t border-gray-50">
                            <Typography variant="caption" color="gray" weight="bold" className="uppercase tracking-widest mb-3">Notes & Instructions</Typography>
                            <Typography variant="small" color="gray" className="leading-5">{invoice.notes}</Typography>
                        </View>
                    )}
                </Surface>

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
