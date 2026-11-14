import React, { useEffect, useState } from 'react';
import { View, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { TickCircle, Trash } from 'iconsax-react-native';
import { Typography } from './ui/Typography';
import { Button } from './ui/Button';
import { OrderProgressService, OrderProgressUpdate } from '../services/OrderProgressService';
import { ORDER_STAGES, PROGRESS_LABEL_MAX, PROGRESS_NOTE_MAX, MAX_PROGRESS_UPDATES } from '../constants/orderStages';
import Toast from 'react-native-toast-message';

interface Props {
    orderServerId?: string;
    isDark: boolean;
}

function formatWhen(iso: string) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString() + ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function OrderProgressSection({ orderServerId, isDark }: Props) {
    const [updates, setUpdates] = useState<OrderProgressUpdate[]>([]);
    const [loading, setLoading] = useState(true);
    const [stageKey, setStageKey] = useState<string | null>(null);
    const [label, setLabel] = useState('');
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        if (!orderServerId) { setLoading(false); return; }
        OrderProgressService.getProgress(orderServerId)
            .then((u) => { if (active) setUpdates(u); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [orderServerId]);

    const pickStage = (key: string, stageLabel: string) => {
        setStageKey(key);
        setLabel(stageLabel);
    };

    const onChangeLabel = (text: string) => {
        setLabel(text);
        setStageKey(null); // typing a custom label detaches the predefined stage
    };

    const submit = async () => {
        if (!orderServerId) return;
        const trimmed = label.trim();
        if (!trimmed) { Toast.show({ type: 'error', text1: 'Add a short label' }); return; }
        setSubmitting(true);
        try {
            const created = await OrderProgressService.addProgress(orderServerId, {
                stageKey: stageKey || undefined,
                label: trimmed,
                note: note.trim() || undefined,
            });
            setUpdates((prev) => [...prev, created]);
            setLabel(''); setNote(''); setStageKey(null);
            Toast.show({ type: 'success', text1: 'Progress shared', text2: 'The client has been notified.' });
        } catch (error: any) {
            const msg = error?.response?.data?.message || 'Could not add the update.';
            Toast.show({ type: 'error', text1: 'Failed', text2: msg });
        } finally {
            setSubmitting(false);
        }
    };

    const remove = async (id: string) => {
        if (!orderServerId) return;
        setDeletingId(id);
        try {
            await OrderProgressService.deleteProgress(orderServerId, id);
            setUpdates((prev) => prev.filter((u) => u.id !== id));
        } catch {
            Toast.show({ type: 'error', text1: 'Could not remove update' });
        } finally {
            setDeletingId(null);
        }
    };

    const inputBase = `rounded-2xl border px-4 ${isDark ? 'border-zinc-700 text-white bg-zinc-900' : 'border-gray-200 text-black bg-white'}`;

    if (!orderServerId) {
        return (
            <View className="py-2 items-center">
                <Typography variant="small" color="gray" className="text-center">
                    Sync this order to share progress updates with the client.
                </Typography>
            </View>
        );
    }

    return (
        <View>
            {/* History */}
            {loading ? (
                <View className="py-6 items-center">
                    <ActivityIndicator color="#FF5678" />
                </View>
            ) : updates.length > 0 ? (
                <View className="mb-4">
                    {updates.map((u, i) => {
                        const isLast = i === updates.length - 1;
                        return (
                            <View key={u.id} style={{ flexDirection: 'row', alignItems: 'stretch' }}>
                                {/* Timeline rail: tick + connecting line */}
                                <View style={{ width: 18, alignItems: 'center', marginRight: 12 }}>
                                    <TickCircle size={18} color="#34C759" variant="Bold" />
                                    {!isLast && (
                                        <View style={{ width: 2, flex: 1, minHeight: 16, marginTop: 4, backgroundColor: isDark ? '#3f3f46' : '#E5E7EB' }} />
                                    )}
                                </View>
                                {/* Content */}
                                <View className={`flex-1 ${isLast ? '' : 'pb-4'}`}>
                                    <Typography weight="bold" className={isDark ? 'text-white' : 'text-black'}>{u.label}</Typography>
                                    {u.note ? <Typography variant="small" color="gray" className="mt-0.5">{u.note}</Typography> : null}
                                    <Typography variant="small" color="gray" className="mt-0.5 text-[11px]">{formatWhen(u.createdAt)}</Typography>
                                </View>
                                <Pressable onPress={() => remove(u.id)} disabled={deletingId === u.id} className="p-1 ml-1">
                                    <Trash size={16} color="#EF4444" />
                                </Pressable>
                            </View>
                        );
                    })}
                    {updates.length >= MAX_PROGRESS_UPDATES && (
                        <View className="mt-1 pt-3 border-t border-gray-100 dark:border-zinc-800">
                            <Typography variant="small" color="gray" className="text-center text-[11px]">
                                Maximum of {MAX_PROGRESS_UPDATES} updates reached.
                            </Typography>
                        </View>
                    )}
                </View>
            ) : (
                <View className="py-3 mb-3 items-center">
                    <Typography variant="small" color="gray" className="text-center">
                        No updates yet. Share a stage below so the client can follow along.
                    </Typography>
                </View>
            )}

            {/* Composer — hidden once the cap is reached (the note lives in the card above) */}
            {updates.length < MAX_PROGRESS_UPDATES && (
            <View className="pt-4 border-t border-gray-100 dark:border-zinc-700/50">
                <Typography weight="bold" className={`${isDark ? 'text-white' : 'text-black'} mb-2.5`}>Add an update</Typography>

                {/* Stage chips */}
                <View className="flex-row flex-wrap gap-2 mb-3">
                    {ORDER_STAGES.map((s) => {
                        const active = stageKey === s.key;
                        return (
                            <Pressable
                                key={s.key}
                                onPress={() => pickStage(s.key, s.label)}
                                className={`px-3 py-2 rounded-full border ${active ? 'bg-[#FF5678] border-[#FF5678]' : isDark ? 'border-zinc-700' : 'border-gray-200'}`}
                            >
                                <Typography variant="small" weight="bold" className={active ? 'text-white' : isDark ? 'text-zinc-300' : 'text-gray-600'}>
                                    {s.label}
                                </Typography>
                            </Pressable>
                        );
                    })}
                </View>

                {/* Custom label */}
                <View className="flex-row items-center justify-between mb-1">
                    <Typography variant="small" color="gray">Stage / label</Typography>
                    <Typography variant="small" color="gray" className="text-[11px]">{label.length}/{PROGRESS_LABEL_MAX}</Typography>
                </View>
                <TextInput
                    value={label}
                    onChangeText={onChangeLabel}
                    maxLength={PROGRESS_LABEL_MAX}
                    placeholder="e.g. Cutting the fabric"
                    placeholderTextColor="#9CA3AF"
                    className={`h-12 ${inputBase}`}
                    style={{ color: isDark ? '#FFFFFF' : '#000000' }}
                />

                {/* Optional note */}
                <View className="flex-row items-center justify-between mb-1 mt-3">
                    <Typography variant="small" color="gray">Short note (optional)</Typography>
                    <Typography variant="small" color="gray" className="text-[11px]">{note.length}/{PROGRESS_NOTE_MAX}</Typography>
                </View>
                <TextInput
                    value={note}
                    onChangeText={setNote}
                    maxLength={PROGRESS_NOTE_MAX}
                    placeholder="Add a quick detail for the client…"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                    className={`min-h-[64px] py-3 ${inputBase}`}
                    style={{ color: isDark ? '#FFFFFF' : '#000000' }}
                />

                <Button
                    onPress={submit}
                    isLoading={submitting}
                    disabled={submitting || !label.trim()}
                    className="h-14 rounded-full bg-[#FF5678] border-0 shadow-none mt-4"
                    textClassName="text-white font-bold"
                >
                    Share with client
                </Button>
            </View>
            )}
        </View>
    );
}
