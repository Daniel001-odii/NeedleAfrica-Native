import { View, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { ArrowLeft, Call, Message, User, InfoCircle, Edit2, Trash, TickCircle, CloseCircle, ShoppingCart } from 'iconsax-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../../../components/ui/Typography';
import { Surface } from '../../../components/ui/Surface';
import { IconButton } from '../../../components/ui/IconButton';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../contexts/AuthContext';
import { useConfirm } from '../../../contexts/ConfirmContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useCustomers } from '../../../hooks/useCustomers';
import { useSync } from '../../../hooks/useSync';
import { useCustomerMeasurements } from '../../../hooks/useMeasurement';
import { Add } from 'iconsax-react-native';
import Toast from 'react-native-toast-message';

export default function CustomerDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const { confirm } = useConfirm();
    const { isDark } = useTheme();
    const { customers, updateCustomer, deleteCustomer } = useCustomers();
    const { sync: performSync } = useSync();
    const { measurements, loading: loadingMeasurements } = useCustomerMeasurements(id as string);

    const [isEditing, setIsEditing] = useState(false);

    // Find customer from existing list
    const customer = customers.find(c => c.id === id);

    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [gender, setGender] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (customer) {
            setFullName(customer.fullName || '');
            setPhoneNumber(customer.phoneNumber || '');
            setGender(customer.gender || '');
            setNotes(customer.notes || '');
        }
    }, [customer, isEditing]);

    if (!customer) {
        return (
            <View className={`flex-1 items-center justify-center ${isDark ? 'bg-background-dark' : 'bg-white'}`}>
                <Typography variant="body" color="gray">Customer not found</Typography>
                <Button onPress={() => router.back()} className="mt-4">Go Back</Button>
            </View>
        );
    }

    const handleUpdate = async () => {
        if (!fullName.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Required',
                text2: 'Customer name is required'
            });
            return;
        }

        try {
            // OPTIMISTIC UPDATE: Write to local DB and close edit mode immediately
            updateCustomer(id as string, {
                fullName,
                phoneNumber,
                gender,
                notes
            });

            setIsEditing(false);

            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Saved to device'
            });

            // Trigger sync in background
            performSync().catch(console.error);
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Update Failed',
                text2: 'Could not update customer locally'
            });
        }
    };

    const handleDelete = () => {
        confirm({
            title: 'Delete Customer',
            message: 'Are you sure you want to delete this customer? This will also remove all their measurements and orders.',
            confirmText: 'Delete',
            type: 'danger',
            onConfirm: async () => {
                try {
                    // OPTIMISTIC DELETE: Remove locally and navigate back immediately
                    deleteCustomer(id as string);

                    router.back();

                    Toast.show({
                        type: 'success',
                        text1: 'Deleted',
                        text2: 'Removed from device'
                    });

                    // Trigger sync in background
                    performSync().catch(console.error);
                } catch (error) {
                    Toast.show({
                        type: 'error',
                        text1: 'Delete Failed',
                        text2: 'Could not remove customer'
                    });
                }
            }
        });
    };

    const initials = (fullName || '??')
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <View className="flex-1 bg-white">
            {/* Header */}
            <View className="px-6 py-4 flex-row justify-between items-center border-b border-gray-50">
                <IconButton
                    icon={<ArrowLeft size={20} color="black" />}
                    onPress={() => isEditing ? setIsEditing(false) : router.back()}
                    variant="ghost"
                    className="-ml-2"
                />
                <Typography variant="h3" weight="bold">
                    {isEditing ? 'Edit Profile' : 'Customer Profile'}
                </Typography>
                <IconButton
                    icon={isEditing ? <CloseCircle size={20} color="#EF4444" /> : <Edit2 size={20} color="black" />}
                    onPress={() => setIsEditing(!isEditing)}
                    variant="ghost"
                    className="-mr-2"
                />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    contentContainerClassName="p-6 pb-20"
                    showsVerticalScrollIndicator={false}
                >
                    {!isEditing ? (
                        <>
                            {/* View Mode: Profile Header Card */}
                            <Surface variant="lavender" className={`p-6 items-center mb-4 ${isDark ? 'bg-indigo-900/40' : 'bg-soft-lavender'}`} rounded="3xl">
                                <Surface variant="white" className={`w-16 h-16 items-center justify-center mb-3 shadow-sm ${isDark ? 'bg-indigo-800' : 'bg-white'}`} rounded="full">
                                    <Typography variant="h3" weight="bold" className={isDark ? 'text-white' : 'text-brand-primary'}>
                                        {initials}
                                    </Typography>
                                </Surface>
                                <Typography variant="h3" weight="bold" className="mb-0.5">{customer?.fullName}</Typography>
                                <Typography variant="small" color="gray" className="capitalize">{customer?.gender || 'Unknown gender'}</Typography>
                            </Surface>

                            {/* Quick Actions */}
                            <View className="flex-row gap-3 mb-6">
                                <Surface variant="muted" className={`flex-1 p-3 items-center ${isDark ? 'bg-surface-muted-dark border-border-dark' : 'border-gray-100'}`} rounded="2xl" hasBorder>
                                    <IconButton
                                        icon={<Call size={20} color={isDark ? "#818CF8" : "#6366f1"} variant="Bulk" />}
                                        variant={isDark ? "dark" : "white"}
                                        className="mb-2"
                                        onPress={() => {
                                            if (customer?.phoneNumber) {
                                                Linking.openURL(`tel:${customer.phoneNumber}`).catch(() => {
                                                    confirm({
                                                        title: 'Error',
                                                        message: 'Could not open dialer',
                                                        confirmText: 'OK',
                                                        onConfirm: () => { }
                                                    });
                                                });
                                            } else {
                                                Toast.show({
                                                    type: 'info',
                                                    text1: 'Missing Contact',
                                                    text2: 'No phone number provided for this customer'
                                                });
                                            }
                                        }}
                                    />
                                    <Typography variant="small" weight="bold">Call</Typography>
                                </Surface>
                                <Surface variant="muted" className={`flex-1 p-3 items-center ${isDark ? 'bg-surface-muted-dark border-border-dark' : 'border-gray-100'}`} rounded="2xl" hasBorder>
                                    <IconButton
                                        icon={<Message size={20} color={isDark ? "#818CF8" : "#6366f1"} variant="Bulk" />}
                                        variant={isDark ? "dark" : "white"}
                                        className="mb-2"
                                        onPress={() => {
                                            if (customer?.phoneNumber) {
                                                Linking.openURL(`sms:${customer.phoneNumber}`).catch(() => {
                                                    confirm({
                                                        title: 'Error',
                                                        message: 'Could not open messaging app',
                                                        confirmText: 'OK',
                                                        onConfirm: () => { }
                                                    });
                                                });
                                            } else {
                                                Toast.show({
                                                    type: 'info',
                                                    text1: 'Missing Contact',
                                                    text2: 'No phone number provided for this customer'
                                                });
                                            }
                                        }}
                                    />
                                    <Typography variant="small" weight="bold">Message</Typography>
                                </Surface>
                                <Surface variant="muted" className={`flex-1 p-3 items-center ${isDark ? 'bg-surface-muted-dark border-border-dark' : 'border-gray-100'}`} rounded="2xl" hasBorder>
                                    <IconButton
                                        icon={<Trash size={20} color="#EF4444" variant="Bulk" />}
                                        variant={isDark ? "dark" : "white"}
                                        className="mb-2"
                                        onPress={handleDelete}
                                    />
                                    <Typography variant="small" weight="bold" className="text-red-500">Delete</Typography>
                                </Surface>
                            </View>

                            {/* Info Sections */}
                            <View className="gap-4">
                                <View>
                                    <Typography variant="caption" color="gray" weight="bold" className="mb-2 uppercase ml-1 tracking-widest">Contact Details</Typography>
                                    <Surface variant="white" className={`p-3 border ${isDark ? 'bg-surface-dark border-border-dark' : 'border-gray-100'}`} rounded="2xl">
                                        <View className="flex-row items-center mb-3">
                                            <Call size={20} color={isDark ? "#9CA3AF" : "#6B7280"} variant="Linear" />
                                            <View className="ml-4">
                                                <Typography variant="caption" color="gray">Phone Number</Typography>
                                                <Typography variant="body" weight="bold">{customer?.phoneNumber || 'Not provided'}</Typography>
                                            </View>
                                        </View>
                                        <View className="flex-row items-center">
                                            <User size={20} color={isDark ? "#9CA3AF" : "#6B7280"} variant="Linear" />
                                            <View className="ml-4">
                                                <Typography variant="caption" color="gray">Gender</Typography>
                                                <Typography variant="body" weight="bold" className="capitalize">{customer?.gender || 'Not specified'}</Typography>
                                            </View>
                                        </View>
                                    </Surface>
                                </View>

                                <View>
                                    <View className="flex-row justify-between items-center mb-2 ml-1">
                                        <Typography variant="caption" color="gray" weight="bold" className="uppercase tracking-widest">Measurements</Typography>
                                        <Pressable onPress={() => router.push('/measurement-templates')}>
                                            <Typography variant="small" color={isDark ? "white" : "primary"} weight="bold">Templates</Typography>
                                        </Pressable>
                                    </View>

                                    <View className="flex-row gap-3 mb-2">
                                        <Button
                                            variant="secondary"
                                            className={`flex-1 h-12 rounded-2xl border-0 ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}
                                            textClassName={isDark ? "text-white font-semibold" : "text-dark font-semibold"}
                                            onPress={() => router.push({ pathname: '/measurements/create', params: { customerId: customer?.id } })}
                                        >
                                            <Add size={18} color={isDark ? "white" : "black"} className="mr-2" />
                                            Add Measurement
                                        </Button>
                                    </View>

                                    {loadingMeasurements ? (
                                        <Typography color="gray" className="text-center py-4">Loading measurements...</Typography>
                                    ) : measurements.length === 0 ? (
                                        <Surface variant="muted" className={`p-6 items-center justify-center border border-dashed ${isDark ? 'bg-surface-muted-dark border-gray-700' : 'border-gray-300'}`} rounded="2xl">
                                            <Typography color="gray" variant="small" className="text-center mb-2">No measurements added yet.</Typography>
                                            <Typography color="gray" variant="small" className="text-center">Use templates to quickly add measurements.</Typography>
                                        </Surface>
                                    ) : (
                                        <View className="gap-3">
                                            {measurements.map(m => (
                                                <Pressable key={m.id} onPress={() => router.push({ pathname: '/measurements/edit', params: { measurementId: m.id, customerId: customer?.id } })}>
                                                    <Surface variant="white" className={`p-4 border ${isDark ? 'bg-surface-dark border-border-dark' : 'border-gray-100'}`} rounded="2xl">
                                                        <View className="flex-row justify-between items-center mb-2">
                                                            <Typography variant="body" weight="bold">{m.title}</Typography>
                                                            <View className="flex-row items-center gap-2">
                                                                <Typography variant="caption" color="gray">{new Date(m.createdAt || 0).toLocaleDateString()}</Typography>
                                                                <Edit2 size={14} color="#9CA3AF" />
                                                            </View>
                                                        </View>
                                                        <View className="flex-row flex-wrap gap-2">
                                                            {Object.entries(JSON.parse(m.valuesJson || '{}')).map(([key, value]) => (
                                                                <View key={key} className={`px-3 py-1 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                                                    <Typography variant="caption" color="gray">
                                                                        <Typography weight="bold">{key}: </Typography>
                                                                        {value as any} {user?.measurementUnit || 'inch'}
                                                                    </Typography>
                                                                </View>
                                                            ))}
                                                        </View>
                                                    </Surface>
                                                </Pressable>
                                            ))}
                                        </View>
                                    )}
                                </View>

                                <View>
                                    <Typography variant="caption" color="gray" weight="bold" className="mb-2 uppercase ml-1 tracking-widest">Notes</Typography>
                                    <Surface variant="muted" className={`p-4 border ${isDark ? 'bg-surface-muted-dark border-border-dark' : 'border-gray-50'} min-h-[80px]`} rounded="2xl">
                                        <View className="flex-row mb-2">
                                            <InfoCircle size={20} color={isDark ? "#9CA3AF" : "#6B7280"} variant="Bulk" />
                                            <Typography variant="body" weight="medium" color="gray" className="ml-2">Notes Overview</Typography>
                                        </View>
                                        <Typography variant="body" className="leading-relaxed">
                                            {customer?.notes || "No specific notes recorded for this customer yet."}
                                        </Typography>
                                    </Surface>
                                </View>

                                {/* Create Order Button */}
                                <View className="mt-2">
                                    <Button
                                        onPress={() => router.push({ pathname: '/(tabs)/orders/new', params: { customerId: customer?.id } })}
                                        className={`h-14 rounded-full ${isDark ? 'bg-white' : 'bg-dark'}`}
                                        textClassName={isDark ? 'text-dark' : 'text-white'}
                                    >
                                        <View className="flex-row items-center justify-center">
                                            <ShoppingCart size={20} color={isDark ? "black" : "white"} variant="Bold" />
                                            <Typography weight="bold" className={`ml-3 ${isDark ? 'text-black' : 'text-white'}`} family="grotesk">Create Order</Typography>
                                        </View>
                                    </Button>
                                </View>
                            </View>
                        </>
                    ) : (
                        <View className="gap-6">
                            {/* Edit Mode: Form Fields */}
                            <View>
                                <View className="flex-row items-center mb-2 ml-1">
                                    <User size={16} color={isDark ? "#9CA3AF" : "#6B7280"} variant="Bulk" />
                                    <Typography variant="caption" color="gray" weight="medium" className="ml-2 uppercase tracking-widest">Full Name</Typography>
                                </View>
                                <Surface variant="muted" rounded="2xl" className={`p-1 px-4 border ${isDark ? 'bg-surface-muted-dark border-border-dark' : 'border-gray-100'}`}>
                                    <TextInput
                                        className={`h-14 font-semibold ${isDark ? 'text-white' : 'text-dark'}`}
                                        placeholder="E.g. Jane Doe"
                                        placeholderTextColor="#9CA3AF"
                                        value={fullName}
                                        onChangeText={setFullName}
                                    />
                                </Surface>
                            </View>

                            <View>
                                <View className="flex-row items-center mb-2 ml-1">
                                    <Call size={16} color={isDark ? "#9CA3AF" : "#6B7280"} variant="Bulk" />
                                    <Typography variant="caption" color="gray" weight="medium" className="ml-2 uppercase tracking-widest">Phone Number</Typography>
                                </View>
                                <Surface variant="muted" rounded="2xl" className={`p-1 px-4 border ${isDark ? 'bg-surface-muted-dark border-border-dark' : 'border-gray-100'}`}>
                                    <TextInput
                                        className={`h-14 font-semibold ${isDark ? 'text-white' : 'text-dark'}`}
                                        placeholder="E.g. 08012345678"
                                        placeholderTextColor="#9CA3AF"
                                        value={phoneNumber}
                                        onChangeText={setPhoneNumber}
                                        keyboardType="phone-pad"
                                    />
                                </Surface>
                            </View>

                            <View>
                                <Typography variant="caption" color="gray" weight="medium" className="ml-1 mb-4 uppercase tracking-widest">Gender</Typography>
                                <View className="flex-row flex-wrap gap-3">
                                    {['female', 'male', 'other'].map((g) => {
                                        const isActive = gender === g;
                                        return (
                                            <TouchableOpacity
                                                key={g}
                                                onPress={() => setGender(g)}
                                                activeOpacity={0.7}
                                                className={`px-8 py-3 rounded-full border ${isActive
                                                    ? 'bg-brand-primary border-brand-primary'
                                                    : isDark ? 'bg-dark-800 border-border-dark' : 'bg-white border-gray-100'
                                                    }`}
                                            >
                                                <Typography variant="small" weight="bold" color={isActive ? 'white' : (isDark ? 'gray' : 'black')} className="capitalize">
                                                    {g}
                                                </Typography>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            <View>
                                <View className="flex-row items-center mb-2 ml-1">
                                    <InfoCircle size={16} color={isDark ? "#9CA3AF" : "#6B7280"} variant="Bulk" />
                                    <Typography variant="caption" color="gray" weight="medium" className="ml-2 uppercase tracking-widest">Measurements & Notes</Typography>
                                </View>
                                <Surface variant="muted" rounded="2xl" className={`p-4 border ${isDark ? 'bg-surface-muted-dark border-border-dark' : 'border-gray-100'} min-h-[140px]`}>
                                    <TextInput
                                        className={`font-medium flex-1 ${isDark ? 'text-white' : 'text-dark'}`}
                                        placeholder="Add notes..."
                                        placeholderTextColor="#9CA3AF"
                                        value={notes}
                                        onChangeText={setNotes}
                                        multiline
                                        textAlignVertical="top"
                                    />
                                </Surface>
                            </View>

                            <Button
                                onPress={handleUpdate}
                                className={`h-16 rounded-full mt-4 ${isDark ? 'bg-white' : 'bg-dark'}`}
                                textClassName={isDark ? 'text-dark' : 'text-white'}
                            >
                                Save Changes
                            </Button>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
