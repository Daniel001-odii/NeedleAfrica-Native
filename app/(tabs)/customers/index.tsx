import React, { useState } from 'react';
import { View, FlatList, Pressable, TextInput, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCustomers } from '../../../hooks/useCustomers';
import { Add, SearchNormal, User, ArrowRight, Call } from 'iconsax-react-native';
import { Surface } from '../../../components/ui/Surface';
import { Typography } from '../../../components/ui/Typography';
import { IconButton } from '../../../components/ui/IconButton';
import { Button } from '../../../components/ui/Button';
import { ScrollView } from 'react-native-gesture-handler';

function CustomersScreen() {
    const [search, setSearch] = useState('');
    const { customers, loading, seedCustomers } = useCustomers(search);
    const router = useRouter();

    const handleCall = (phoneNumber: string | null) => {
        if (phoneNumber) {
            Linking.openURL(`tel:${phoneNumber}`);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <View className="p-6 pb-0">
                {/* Header */}
                <View className="flex-row justify-between items-center mb-6">
                    <Typography variant="h2" weight="bold">Customers</Typography>
                    <IconButton
                        icon={<Add size={24} color="white" />}
                        variant="dark"
                        onPress={() => router.push('/(tabs)/customers/new')}
                    />
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
                contentContainerClassName="p-6 pt-0 pb-32"
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <Pressable
                        onPress={() => router.push({ pathname: '/(tabs)/customers/[id]', params: { id: item.id } })}
                    >
                        <Surface variant="white" className="flex-row items-center p-5 mb-4 border border-gray-100" rounded="3xl" hasShadow>
                            {/*   <Surface variant="lavender" className="w-12 h-12 items-center justify-center mr-4" rounded="full">
                                <Typography weight="bold" className="text-brand-primary">
                                    {item.fullName.charAt(0).toUpperCase()}
                                    {item.fullName.charAt(1).toUpperCase()}
                                </Typography>
                            </Surface> */}
                            <View className="flex-1">
                                <Typography variant="body" weight="bold">{item.fullName}</Typography>
                                <Typography variant="caption" color="gray">{item.phoneNumber || 'No phone number'}</Typography>
                            </View>
                            <View className="flex-row items-center size-10 rounded-full bg-green-500 text-white">
                                {item.phoneNumber && (
                                    <IconButton
                                        icon={<Call size={18} color="#fff" variant="Bold" />}
                                        onPress={() => handleCall(item.phoneNumber)}
                                        variant="ghost"
                                        className="mr-2"
                                    />
                                )}
                            </View>
                        </Surface>
                    </Pressable>
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
                                    <Button
                                        onPress={seedCustomers}
                                        className="bg-lavender px-6 rounded-full h-12"
                                        variant="secondary"
                                    >
                                        Seed Test Data
                                    </Button>
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
