import React, { useState } from 'react';
import { View, FlatList, Pressable, TextInput, Linking, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCustomers } from '../../../hooks/useCustomers';
import { Add, SearchNormal, User, ArrowRight, Call, Refresh } from 'iconsax-react-native';
import { Surface } from '../../../components/ui/Surface';
import { Typography } from '../../../components/ui/Typography';
import { IconButton } from '../../../components/ui/IconButton';
import { Button } from '../../../components/ui/Button';
import { ScrollView } from 'react-native-gesture-handler';

import { Swipeable } from 'react-native-gesture-handler';
import { Trash } from 'iconsax-react-native';
import { Alert } from 'react-native';

function CustomersScreen() {
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const { customers, loading, seedCustomers, refresh, deleteCustomer } = useCustomers(search);
    const router = useRouter();

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await refresh();
        setRefreshing(false);
    }, [refresh]);

    const handleCall = (phoneNumber: string | null) => {
        if (phoneNumber) {
            Linking.openURL(`tel:${phoneNumber}`);
        }
    };

    const handleDelete = (id: string, name: string) => {
        Alert.alert(
            "Delete Customer",
            `Are you sure you want to delete ${name}? This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => deleteCustomer(id)
                }
            ]
        );
    };

    const renderRightActions = (id: string, name: string) => {
        return (
            <View className="pl-4 mb-2 justify-center">
                <Pressable
                    onPress={() => handleDelete(id, name)}
                    className="text-red-500 justify-center items-center w-16 h-16 rounded-3xl shadow-sm shadow-red-200"
                >
                    <Trash size={24} color="red" variant="Bold" />
                </Pressable>
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <View className="p-6 pb-0">
                {/* Header */}
                <View className="flex-row justify-between items-center mb-6">
                    <Typography variant="h2" weight="bold">Customers</Typography>
                    <View className="flex-row gap-2">
                        <IconButton
                            icon={<Refresh size={20} color="black" />}
                            variant="ghost"
                            onPress={onRefresh}
                        />
                        <IconButton
                            icon={<Add size={24} color="white" />}
                            variant="dark"
                            onPress={() => router.push('/(tabs)/customers/new')}
                        />
                    </View>
                </View>

                {/* Search Bar */}
                <Surface variant="muted" className="flex-row items-center px-4 h-14 mb-6" rounded="2xl" hasBorder>
                    <SearchNormal size={20} color="#9CA3AF" />
                    <TextInput
                        className="flex-1 ml-3 text-base text-dark font-semibold"
                        placeholder="Search for a customer..."
                        placeholderTextColor="#9CA3AF"
                        value={search}
                        onChangeText={setSearch}
                    />
                </Surface>
            </View>

            {/* List */}
            <FlatList
                data={customers}
                keyExtractor={item => item.id}
                contentContainerClassName="p-6 pt-0 pb-16 gap-3"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                renderItem={({ item }) => (
                    <Swipeable
                        renderRightActions={() => renderRightActions(item.id, item.fullName)}
                        friction={2}
                        rightThreshold={40}
                    >
                        <Pressable
                            onPress={() => router.push({ pathname: '/(tabs)/customers/[id]', params: { id: item.id } })}
                        >
                            <Surface variant="white" className="flex-row items-center p-5 mb-2 border border-gray-100" rounded="3xl" hasShadow>
                                <Surface variant="lavender" className="w-12 h-12 items-center justify-center mr-4" rounded="full">
                                    <Typography weight="bold" className="text-brand-primary">
                                        {item.fullName.charAt(0).toUpperCase()}
                                        {item.fullName.charAt(1).toUpperCase()}
                                    </Typography>
                                </Surface>
                                <View className="flex-1">
                                    <Typography variant="body" weight="bold">{item.fullName}</Typography>
                                    <Typography variant="caption" color="gray">{item.phoneNumber || 'No phone number'}</Typography>
                                </View>
                                <View className="flex-row items-center">
                                    {item.phoneNumber && (
                                        <IconButton
                                            icon={<Call size={18} color="#22c55e" variant="Bold" />}
                                            onPress={() => handleCall(item.phoneNumber)}
                                            variant="ghost"
                                        />
                                    )}
                                    {/* <ArrowRight size={18} color="#9CA3AF" /> */}
                                </View>
                            </Surface>
                        </Pressable>
                    </Swipeable>
                )}
                ListEmptyComponent={
                    !loading ? (
                        <View className="items-center justify-center py-20 px-10">
                            <Surface variant="muted" className="w-24 h-24 items-center justify-center mb-6" rounded="full">
                                <User size={40} color="#9CA3AF" variant="Bulk" />
                            </Surface>
                            <Typography variant="h3" weight="bold" className="text-center mb-2">No customers yet</Typography>
                            <Typography variant="body" color="gray" className="text-center leading-relaxed">
                                {search
                                    ? `We couldn't find any customers matching "${search}".`
                                    : "Start building your customer base by adding your first client."}
                            </Typography>
                            {!search && (
                                <View className="flex-row gap-3 mt-8">
                                    <Button
                                        onPress={() => router.push('/(tabs)/customers/new')}
                                        className="bg-muted px-6 rounded-full h-12"
                                        variant="ghost"
                                    >
                                        Add New
                                    </Button>
                                    {/* <Button
                                        onPress={seedCustomers}
                                        className="bg-lavender px-6 rounded-full h-12"
                                        variant="secondary"
                                    >
                                        Seed Test Data
                                    </Button> */}
                                </View>
                            )}
                        </View>
                    ) : null
                }
            />
        </SafeAreaView>
    );
}

export default CustomersScreen;
