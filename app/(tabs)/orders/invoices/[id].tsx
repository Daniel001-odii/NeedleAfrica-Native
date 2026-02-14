import React, { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator, Alert, Share } from 'react-native';
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

export default function InvoiceDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const database = useDatabase();
    const { user } = useAuth();

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
                Alert.alert('Error', 'Failed to load invoice details');
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
                        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1c1c1e; padding: 40px; }
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
            Alert.alert('Error', 'Failed to print invoice');
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
                Alert.alert('Error', 'Sharing is not available on this device');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to share invoice');
        } finally {
            setIsExporting(false);
        }
    };

    const handleDelete = async () => {
        Alert.alert(
            'Delete Invoice',
            'Are you sure you want to delete this invoice?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await invoice?.softDelete();
                            Toast.show({ type: 'success', text1: 'Invoice deleted' });
                            router.back();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete invoice');
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator color="black" />
            </View>
        );
    }

    if (!invoice) {
        return (
            <View className="flex-1 bg-white items-center justify-center">
                <Typography>Invoice not found</Typography>
                <Button onPress={() => router.back()} className="mt-4">Go Back</Button>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white">
            <View className="px-6 py-4 flex-row justify-between items-center border-b border-gray-50">
                <IconButton
                    icon={<ArrowLeft size={20} color="black" />}
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
                {/* Paper Preview */}
                <Surface variant="white" className="p-8 mb-8 shadow-xl min-h-[500px]" rounded="none" hasBorder>
                    <View className="flex-row justify-between mb-10">
                        <View>
                            <Typography variant="h3" weight="bold" color="primary">{user?.businessName}</Typography>
                            <Typography variant="small" color="gray">{user?.email}</Typography>
                        </View>
                        <View className="items-end">
                            <Typography variant="caption" color="gray" weight="bold" className="uppercase">Date</Typography>
                            <Typography weight="bold">{new Date(invoice.createdAt || 0).toLocaleDateString()}</Typography>
                        </View>
                    </View>

                    <View className="flex-row justify-between mb-10">
                        <View>
                            <Typography variant="caption" color="gray" weight="bold" className="uppercase">Invoice No.</Typography>
                            <Typography weight="bold">{invoice.invoiceNumber}</Typography>
                        </View>
                        <View className="items-end">
                            <Typography variant="caption" color="gray" weight="bold" className="uppercase">Billed To</Typography>
                            <Typography weight="bold">{customer?.fullName}</Typography>
                            <Typography variant="small" color="gray">{customer?.phoneNumber}</Typography>
                        </View>
                    </View>

                    <View className="border-b border-gray-100 pb-4 mb-6">
                        <View className="flex-row justify-between mb-2">
                            <Typography weight="bold">Description</Typography>
                            <Typography weight="bold">Amount</Typography>
                        </View>
                        <View className="flex-row justify-between">
                            <View>
                                <Typography variant="body" weight="semibold">{order?.styleName}</Typography>
                                <Typography variant="caption" color="gray">Custom tailoring</Typography>
                            </View>
                            <Typography weight="bold" variant="body">
                                {invoice.currency} {(invoice.amount || 0).toLocaleString()}
                            </Typography>
                        </View>
                    </View>

                    <View className="items-end">
                        <Surface variant="muted" className="p-4 w-48" rounded="xl">
                            <View className="flex-row justify-between mb-2">
                                <Typography variant="small" color="gray">Subtotal</Typography>
                                <Typography variant="small" weight="bold">{(invoice.amount || 0).toLocaleString()}</Typography>
                            </View>
                            <View className="flex-row justify-between border-t border-gray-200 pt-2">
                                <Typography variant="body" weight="bold">Total</Typography>
                                <Typography variant="body" weight="bold">{invoice.currency} {(invoice.amount || 0).toLocaleString()}</Typography>
                            </View>
                        </Surface>
                    </View>

                    {invoice.notes && (
                        <View className="mt-8">
                            <Typography variant="caption" color="gray" weight="bold" className="uppercase mb-2">Notes</Typography>
                            <Typography variant="small" color="gray" className="leading-5">{invoice.notes}</Typography>
                        </View>
                    )}
                </Surface>

                <View className="flex-row gap-4">
                    <Button
                        onPress={handlePrint}
                        isLoading={isExporting}
                        className="flex-1 h-16 rounded-full bg-dark"
                    >
                        <View className="flex-row items-center">
                            <Printer size={20} color="white" className="mr-3" />
                            <Typography weight="bold" color="white">Print / PDF</Typography>
                        </View>
                    </Button>
                    <Button
                        onPress={handleShare}
                        isLoading={isExporting}
                        className="flex-1 h-16 rounded-full border-2 border-dark bg-white"
                    >
                        <View className="flex-row items-center">
                            <ExportCurve size={20} color="black" className="mr-3" />
                            <Typography weight="bold" color="black">Share</Typography>
                        </View>
                    </Button>
                </View>
            </ScrollView>
        </View>
    );
}
