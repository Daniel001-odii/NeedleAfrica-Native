import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, Image, Pressable, Modal, TouchableOpacity, TextInput, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, User, Ruler, CloseCircle, People, Clock, Location, Gallery, DocumentText, Colorfilter, DollarCircle } from 'iconsax-react-native';
import { Typography } from '../../components/ui/Typography';
import { IconButton } from '../../components/ui/IconButton';
import { Button } from '../../components/ui/Button';
import { Surface } from '../../components/ui/Surface';
import { SectionCard, SectionRow } from '../../components/ui/SectionCard';
import { useTheme } from '../../contexts/ThemeContext';
import { InstantRequestService, InstantLead } from '../../services/InstantRequestService';
import { getSocket } from '../../lib/socket';
import Toast from 'react-native-toast-message';

export default function InstantRequestDetailScreen() {
    const { isDark } = useTheme();
    const params = useLocalSearchParams();
    const id = String(params.id || '');

    const [lead, setLead] = useState<InstantLead | null>(() => {
        try {
            if (typeof params.data === 'string') return JSON.parse(params.data);
        } catch { /* ignore */ }
        return null;
    });
    const [loading, setLoading] = useState(!lead);
    const [bidCount, setBidCount] = useState<number>(lead?.bidCount ?? 0);

    // Bid form
    const [price, setPrice] = useState(lead?.myBid ? String(lead.myBid.price) : '');
    const [turnaround, setTurnaround] = useState(lead?.myBid ? String(lead.myBid.turnaroundDays) : '');
    const [proposal, setProposal] = useState(lead?.myBid?.proposal || '');
    const [submitting, setSubmitting] = useState(false);
    const [withdrawing, setWithdrawing] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [myBidStatus, setMyBidStatus] = useState<string | null>(lead?.myBid?.status ?? null);

    // Pull-to-refresh: re-pull the lead (bid count, avatars, avg, status) without
    // clobbering whatever the designer may be typing into the bid form.
    const onRefresh = async () => {
        if (!id) return;
        setRefreshing(true);
        try {
            const l = await InstantRequestService.getLead(id);
            if (l) {
                setLead(l);
                setBidCount(l.bidCount ?? 0);
                setMyBidStatus(l.myBid?.status ?? null);
            }
        } catch { /* ignore */ }
        setRefreshing(false);
    };

    // Image viewer
    const [viewerUri, setViewerUri] = useState<string | null>(null);

    const socketRef = useRef<any>(null);

    // Always pull a fresh lead on mount (params may be a stale push snapshot).
    useEffect(() => {
        let active = true;
        if (!id) return;
        const coldOpen = !lead; // no params snapshot to seed the bid form
        InstantRequestService.getLead(id).then((l) => {
            if (!active) return;
            if (l) {
                setLead(l);
                setBidCount(l.bidCount ?? 0);
                setMyBidStatus(l.myBid?.status ?? null);
                if (coldOpen && l.myBid) {
                    setPrice(String(l.myBid.price));
                    setTurnaround(String(l.myBid.turnaroundDays));
                    setProposal(l.myBid.proposal || '');
                }
            }
            setLoading(false);
        }).catch(() => { if (active) setLoading(false); });
        return () => { active = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // Realtime: on any bid event in this request's room, re-pull the lead so the
    // live count, bidder avatars, average price and status all stay current.
    useEffect(() => {
        if (!id) return;
        let socket: any;
        const reload = () => {
            InstantRequestService.getLead(id).then((l) => {
                if (l) {
                    setLead(l);
                    setBidCount(l.bidCount ?? 0);
                    setMyBidStatus(l.myBid?.status ?? null);
                }
            }).catch(() => { });
        };
        const onBid = (p: { requestId?: string }) => {
            if (p?.requestId === id) reload();
        };
        const join = () => socket?.emit('join_request_room', id);

        getSocket().then((s) => {
            socket = s;
            socketRef.current = s;
            join();
            s.on('connect', join); // re-join after a reconnect
            s.on('bid_received', onBid);
            s.on('bid_withdrawn', onBid);
            s.on('bid_accepted', onBid);
        }).catch(() => { });

        return () => {
            if (socket) {
                socket.emit('leave_request_room', id);
                socket.off('connect', join);
                socket.off('bid_received', onBid);
                socket.off('bid_withdrawn', onBid);
                socket.off('bid_accepted', onBid);
            }
        };
    }, [id]);

    const isOpen = (lead?.status ?? 'PENDING') === 'PENDING';

    const handleSubmit = async () => {
        const priceNum = Number(price);
        const daysNum = Number(turnaround);
        if (!priceNum || priceNum <= 0) { Toast.show({ type: 'error', text1: 'Enter a valid price' }); return; }
        if (!daysNum || daysNum <= 0) { Toast.show({ type: 'error', text1: 'Enter a valid turnaround' }); return; }

        setSubmitting(true);
        try {
            const res = await InstantRequestService.submitBid(id, {
                price: priceNum,
                turnaroundDays: daysNum,
                proposal: proposal.trim() || undefined,
            });
            setBidCount(res.bidCount);
            setMyBidStatus('PENDING');
            Toast.show({ type: 'success', text1: 'Bid submitted!', text2: 'The client will be notified instantly.' });
        } catch (error: any) {
            const msg = error?.response?.data?.message || 'Could not submit your bid.';
            Toast.show({ type: 'error', text1: 'Failed', text2: msg });
        } finally {
            setSubmitting(false);
        }
    };

    const handleWithdraw = () => {
        Alert.alert('Withdraw bid', 'Remove your quote from this request?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Withdraw', style: 'destructive', onPress: async () => {
                    setWithdrawing(true);
                    try {
                        const res = await InstantRequestService.withdrawBid(id);
                        setBidCount(res.bidCount);
                        setMyBidStatus('WITHDRAWN');
                        Toast.show({ type: 'info', text1: 'Bid withdrawn' });
                    } catch (error: any) {
                        const msg = error?.response?.data?.message || 'Could not withdraw.';
                        Toast.show({ type: 'error', text1: 'Failed', text2: msg });
                    } finally {
                        setWithdrawing(false);
                    }
                }
            },
        ]);
    };

    if (loading) {
        return (
            <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-white'} items-center justify-center`}>
                <ActivityIndicator size="large" color="#FF5678" />
            </View>
        );
    }

    if (!lead) {
        return (
            <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-white'} items-center justify-center`}>
                <Typography variant="body" className={isDark ? 'text-white' : 'text-black'}>Lead not found.</Typography>
                <Pressable onPress={() => router.back()} className="mt-4 p-3 bg-gray-100 rounded-lg">
                    <Typography>Go Back</Typography>
                </Pressable>
            </View>
        );
    }

    const hasActiveBid = myBidStatus && myBidStatus !== 'WITHDRAWN';
    const won = myBidStatus === 'ACCEPTED';
    const locationLabel = [lead.city, lead.state].filter(Boolean).join(', ');

    return (
        <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-white'}`}>
            <SafeAreaView edges={['top']} className="flex-1">
                <View className="flex-row items-center px-4 py-3">
                    <IconButton
                        icon={<ArrowLeft size={24} color={isDark ? 'white' : 'black'} />}
                        onPress={() => router.back()}
                        variant="ghost"
                        className="-ml-2"
                    />
                    <View className="flex-1 items-center -ml-10">
                        <Typography variant="h3" weight="bold" className={isDark ? 'text-white' : 'text-black'}>
                            ⚡ Instant Lead
                        </Typography>
                    </View>
                </View>

                <ScrollView
                    className="flex-1"
                    contentContainerClassName="p-4 pb-28"
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF5678" colors={["#FF5678"]} />
                    }
                >
                    {/* Header + live bid count - Nested SectionCard */}
                    <SectionCard icon={User} title="Request overview">
                        <View className="flex-row items-center mb-3">
                            <View className="w-12 h-12 rounded-full bg-[#FF5678] items-center justify-center mr-4">
                                <User size={24} color="white" />
                            </View>
                            <View className="flex-1">
                                <Typography variant="h3" weight="bold" className={isDark ? 'text-white' : 'text-black'}>
                                    {lead.fullName}
                                </Typography>
                                <View className="flex-row items-center mt-0.5">
                                    {locationLabel ? <Location size={13} color="#9CA3AF" variant="Bold" /> : null}
                                    <Typography variant="small" color="gray" className="ml-1">
                                        {locationLabel || 'Location hidden'}
                                        {lead.distanceKm != null ? ` • ${Math.round(lead.distanceKm)}km away` : ''}
                                    </Typography>
                                </View>
                            </View>
                        </View>

                        <View className="border-t border-gray-100 dark:border-zinc-700/60 pt-3">
                            <View className="flex-row items-center justify-between">
                                {/* Social proof — blurred avatars of other designers who've bid */}
                                {lead.otherBidAvatars && lead.otherBidAvatars.length > 0 ? (
                                    <View className="flex-row items-center">
                                        {lead.otherBidAvatars.slice(0, 5).map((uri, i) => (
                                            <Image
                                                key={i}
                                                source={{ uri }}
                                                className="h-7 w-7 rounded-full border-2 border-white dark:border-black"
                                                style={{ marginLeft: i === 0 ? 0 : -8 }}
                                            />
                                        ))}
                                        <Typography weight="bold" className={`ml-2 ${isDark ? 'text-white' : 'text-black'}`}>
                                            {lead.otherBidCount} bidding
                                        </Typography>
                                    </View>
                                ) : bidCount > 0 ? (
                                    <View className="flex-row items-center">
                                        <People size={18} color="#FF5678" variant="Bold" />
                                        <Typography weight="bold" className={`ml-2 ${isDark ? 'text-white' : 'text-black'}`}>
                                            Bids placed
                                        </Typography>
                                    </View>
                                ) : (
                                    <View className="flex-row items-center">
                                        <People size={18} color="#FF5678" variant="Bold" />
                                        <Typography weight="bold" className={`ml-2 ${isDark ? 'text-white' : 'text-black'}`}>
                                            Be the first to bid
                                        </Typography>
                                    </View>
                                )}

                                <View className="flex-row items-center">
                                    <Clock size={18} color="#9CA3AF" variant="Bold" />
                                    <Typography variant="small" color="gray" className="ml-1.5">
                                        {lead.status === 'PENDING' ? 'Open for bids' : lead.status}
                                    </Typography>
                                </View>
                            </View>

                            {/* Average bid from other designers */}
                            {lead.averageBidPrice != null && (
                                <View className="mt-3 flex-row items-center justify-between rounded-2xl bg-gray-50 dark:bg-zinc-900 px-3.5 py-2.5">
                                    <Typography variant="small" color="gray" className="text-[11px]">Avg. bid from other designers</Typography>
                                    <Typography weight="bold" className={`text-[11px] ${isDark ? 'text-white' : 'text-black'}`}>
                                        ₦{lead.averageBidPrice.toLocaleString()}
                                    </Typography>
                                </View>
                            )}
                        </View>
                    </SectionCard>

                    {/* Description */}
                    {lead.description ? (
                        <SectionCard icon={DocumentText} title="What they need">
                            <Typography variant="body" className={isDark ? 'text-zinc-300' : 'text-gray-700'}>{lead.description}</Typography>
                        </SectionCard>
                    ) : null}

                    {/* Specs */}
                    <SectionCard icon={Colorfilter} title="Specifications">
                        {(() => {
                            const specs: { label: string; value: string | null | undefined }[] = [
                                { label: 'Budget', value: lead.targetBudget != null ? `₦${lead.targetBudget.toLocaleString()}` : null },
                                { label: 'Needed by', value: lead.targetDate ? new Date(lead.targetDate).toLocaleDateString() : null },
                                { label: 'Fabric Option', value: lead.fabricOption },
                            ].filter((d): d is { label: string; value: string } => !!d.value);

                            return specs.map((d, i) => (
                                <SectionRow
                                    key={i}
                                    label={d.label}
                                    value={d.value}
                                    isLast={i === specs.length - 1}
                                />
                            ));
                        })()}
                    </SectionCard>

                    {/* Measurements */}
                    {(lead.bust || lead.waist || lead.hips || lead.length || (lead.customMeasurements && lead.customMeasurements.length > 0)) && (
                        <SectionCard icon={Ruler} title="Client measurements">
                            {(() => {
                                const measurements: { label: string; value: string | number }[] = [];
                                if (lead.bust) measurements.push({ label: 'Bust', value: `${lead.bust}"` });
                                if (lead.waist) measurements.push({ label: 'Waist', value: `${lead.waist}"` });
                                if (lead.hips) measurements.push({ label: 'Hips', value: `${lead.hips}"` });
                                if (lead.length) measurements.push({ label: 'Length', value: `${lead.length}"` });
                                if (lead.customMeasurements) {
                                    lead.customMeasurements.forEach((cm) => {
                                        if (cm.value) measurements.push({ label: cm.name, value: cm.value });
                                    });
                                }
                                return measurements.map((m, idx) => (
                                    <SectionRow
                                        key={idx}
                                        label={m.label}
                                        value={m.value}
                                        isLast={idx === measurements.length - 1}
                                    />
                                ));
                            })()}
                        </SectionCard>
                    )}

                    {/* Inspiration */}
                    {lead.inspoImages && lead.inspoImages.length > 0 && (
                        <SectionCard icon={Gallery} title="Inspiration & sketches">
                            <View className="flex-row flex-wrap gap-2">
                                {lead.inspoImages.map((img, i) => (
                                    <Pressable key={i} onPress={() => setViewerUri(img)} className="flex-1">
                                        <Image source={{ uri: img }} className="h-[150] aspect-square rounded-xl bg-gray-200" resizeMode="cover" />
                                    </Pressable>
                                ))}
                            </View>
                        </SectionCard>
                    )}

                    {/* Bid form / status */}
                    {won ? (
                        <Surface variant="white" rounded="3xl" className="p-5 items-center bg-green-50 dark:bg-green-900/20">
                            <Typography weight="bold" className="text-green-700 dark:text-green-400 text-center">
                                🎉 You won this lead! Check your chats to start the conversation.
                            </Typography>
                        </Surface>
                    ) : !isOpen ? (
                        <Surface variant="white" rounded="3xl" className="p-5 items-center bg-gray-50 dark:bg-zinc-900">
                            <Typography weight="bold" color="gray" className="text-center">
                                This lead is {lead.status.toLowerCase()} — bidding is closed.
                            </Typography>
                        </Surface>
                    ) : (
                        <SectionCard icon={DollarCircle} title={hasActiveBid ? 'Revise your bid' : 'Submit your quote'}>
                            <View className="flex-row gap-3 mb-3">
                                <View className="flex-1">
                                    <Typography variant="small" color="gray" className="mb-1.5">Your quote (₦)</Typography>
                                    <TextInput
                                        value={price}
                                        onChangeText={setPrice}
                                        keyboardType="numeric"
                                        placeholder="50000"
                                        placeholderTextColor="#9CA3AF"
                                        className={`h-12 px-4 rounded-2xl border ${isDark ? 'border-zinc-700 text-white bg-zinc-900' : 'border-gray-200 text-black bg-white'}`}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Typography variant="small" color="gray" className="mb-1.5">Turnaround (days)</Typography>
                                    <TextInput
                                        value={turnaround}
                                        onChangeText={setTurnaround}
                                        keyboardType="numeric"
                                        placeholder="14"
                                        placeholderTextColor="#9CA3AF"
                                        className={`h-12 px-4 rounded-2xl border ${isDark ? 'border-zinc-700 text-white bg-zinc-900' : 'border-gray-200 text-black bg-white'}`}
                                    />
                                </View>
                            </View>

                            <Typography variant="small" color="gray" className="mb-1.5">Message to client (optional)</Typography>
                            <TextInput
                                value={proposal}
                                onChangeText={setProposal}
                                placeholder="Introduce yourself, mention your experience with this style..."
                                placeholderTextColor="#9CA3AF"
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                                className={`min-h-[80px] p-4 rounded-2xl border ${isDark ? 'border-zinc-700 text-white bg-zinc-900' : 'border-gray-200 text-black bg-white'}`}
                            />

                            <Button
                                onPress={handleSubmit}
                                isLoading={submitting}
                                disabled={submitting || withdrawing}
                                className="h-14 rounded-full bg-[#FF5678] border-0 shadow-none mt-4"
                                textClassName="text-white font-bold"
                            >
                                {hasActiveBid ? 'Update Bid' : 'Submit Bid'}
                            </Button>

                            {hasActiveBid && (
                                <Pressable onPress={handleWithdraw} disabled={withdrawing} className="mt-3 items-center py-2">
                                    <Typography weight="semibold" className="text-red-500">
                                        {withdrawing ? 'Withdrawing…' : 'Withdraw bid'}
                                    </Typography>
                                </Pressable>
                            )}
                        </SectionCard>
                    )}
                </ScrollView>

                {/* Image viewer */}
                <Modal visible={!!viewerUri} transparent animationType="fade" onRequestClose={() => setViewerUri(null)}>
                    <View className="flex-1 bg-black justify-center items-center">
                        <SafeAreaView className="absolute top-0 right-0 z-10 p-6">
                            <TouchableOpacity onPress={() => setViewerUri(null)} className="bg-white/10 p-2 rounded-full">
                                <CloseCircle size={28} color="white" />
                            </TouchableOpacity>
                        </SafeAreaView>
                        {viewerUri && <Image source={{ uri: viewerUri }} className="w-full h-full" resizeMode="contain" />}
                    </View>
                </Modal>
            </SafeAreaView>
        </View>
    );
}
