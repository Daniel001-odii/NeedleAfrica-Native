import React, { useState } from 'react';
import { View, Modal, TextInput, TouchableOpacity, Platform, KeyboardAvoidingView } from 'react-native';
import { User, Call, UserAdd } from 'iconsax-react-native';
import { Typography } from './ui/Typography';
import { Button } from './ui/Button';
import { Surface } from './ui/Surface';
import { useTheme } from '../contexts/ThemeContext';
import { useCustomers } from '../hooks/useCustomers';
import { useSync } from '../hooks/useSync';
import PhoneInput from 'react-phone-number-input/react-native-input';
import * as Contacts from 'expo-contacts/legacy';
import Toast from 'react-native-toast-message';
import Svg, { Path } from 'react-native-svg';

interface QuickCreateCustomerModalProps {
  visible: boolean;
  onClose: () => void;
  onCustomerCreated: (customer: any) => void;
}

export function QuickCreateCustomerModal({
  visible,
  onClose,
  onCustomerCreated,
}: QuickCreateCustomerModalProps) {
  const { isDark } = useTheme();
  const { addCustomer } = useCustomers();
  const { sync } = useSync();

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('female');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!visible) return null;

  const handleImportContact = async () => {
    try {
      if (Platform.OS === 'android') {
        const { status } = await Contacts.requestPermissionsAsync();
        if (status !== 'granted') {
          Toast.show({ type: 'error', text1: 'Permission Denied', text2: 'Please grant contacts permission.' });
          return;
        }
      }

      const contact = await Contacts.presentContactPickerAsync();
      if (contact) {
        const name = contact.name || [contact.firstName, contact.lastName].filter(Boolean).join(' ');

        let phone = '';
        if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
          let rawPhone = contact.phoneNumbers[0].number || '';
          rawPhone = rawPhone.replace(/[^\d+]/g, '');
          if (rawPhone.startsWith('0')) {
            phone = '+234' + rawPhone.substring(1);
          } else if (rawPhone.length > 0 && !rawPhone.startsWith('+')) {
            phone = '+' + rawPhone;
          } else {
            phone = rawPhone;
          }
        }

        if (name) setFullName(name);
        if (phone) setPhoneNumber(phone);
      }
    } catch (error) {
      console.error('Error importing contact:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to import contact' });
    }
  };

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      Toast.show({ type: 'error', text1: 'Required Field', text2: "Please enter the customer's full name." });
      return;
    }

    try {
      setIsSubmitting(true);
      const customer = await addCustomer({ fullName: fullName.trim(), phoneNumber, gender });
      
      sync().catch(console.error);
      Toast.show({ type: 'success', text1: 'Saved', text2: 'Customer created successfully' });

      if (customer) {
        onCustomerCreated(customer);
      } else {
        onClose();
      }
      
      // Reset state
      setFullName('');
      setPhoneNumber('');
      setGender('female');
    } catch (error) {
      console.error('Failed to quick create customer:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to create customer' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 justify-end">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="w-full"
        >
          <Surface variant="white" className={`rounded-t-[32px] p-6 pb-12 ${isDark ? 'bg-background-dark' : 'bg-[#F2F2F7]'}`} rounded="none">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-6">
              <Typography variant="h3" weight="bold">Quick Add Client</Typography>
              <TouchableOpacity onPress={onClose} className={`w-8 h-8 rounded-full items-center justify-center ${isDark ? 'bg-white/10' : 'bg-black/5'}`}>
                <Svg width="20" height="20" viewBox="0 0 24 24">
                  <Path
                    fill="none"
                    stroke={isDark ? "white" : "black"}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M18 6L6 18m12 0L6 6"
                  />
                </Svg>
              </TouchableOpacity>
            </View>

            {/* Import Contact Banner */}
            <TouchableOpacity 
              onPress={handleImportContact} 
              className={`mb-6 p-4 rounded-2xl flex-row items-center justify-between ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white shadow-sm shadow-gray-200/20'}`}
            >
              <View className="flex-row items-center">
                <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                  <UserAdd size={20} color={isDark ? '#0A84FF' : '#007AFF'} variant="Bulk" />
                </View>
                <View>
                  <Typography weight="bold" variant="body">Import from Contacts</Typography>
                  <Typography variant="small" color="gray">Auto-fill name and phone</Typography>
                </View>
              </View>
              <Svg width="18" height="18" viewBox="0 0 24 24">
                <Path fill="none" stroke={isDark ? "white" : "black"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </Svg>
            </TouchableOpacity>

            {/* Personal Details */}
            <Typography variant="caption" color="gray" weight="bold" className="ml-4 mb-2 uppercase tracking-widest opacity-60">
              Personal Info
            </Typography>
            <Surface variant="white" rounded="2xl" className="mb-6 overflow-hidden">
              <View className={`flex-row items-center px-4 border-b ${isDark ? 'border-zinc-850' : 'border-zinc-50'}`}>
                <User size={18} color="#94a3b8" variant="Bulk" />
                <TextInput
                  className={`flex-1 h-14 ml-3 font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}
                  placeholder="Full Name"
                  placeholderTextColor="#94a3b8"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
              <View className="flex-row items-center px-4">
                <Call size={18} color="#94a3b8" variant="Bulk" />
                <View className="flex-1 ml-3 h-14 justify-center">
                  <PhoneInput
                    style={{ color: isDark ? 'white' : 'black', fontWeight: '600' }}
                    placeholder="Phone Number"
                    placeholderTextColor="#94a3b8"
                    defaultCountry="NG"
                    value={phoneNumber}
                    onChange={(val) => setPhoneNumber(val || '')}
                  />
                </View>
              </View>
            </Surface>

            {/* Gender Section */}
            <Typography variant="caption" color="gray" weight="bold" className="ml-4 mb-2 uppercase tracking-widest opacity-60">
              Gender
            </Typography>
            <Surface variant="white" rounded="full" className="p-1 mb-8 flex-row">
              {['female', 'male', 'other'].map((g) => {
                const isActive = gender === g;
                return (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setGender(g)}
                    className={`flex-1 py-2.5 rounded-full items-center ${isActive ? 'bg-brand-primary' : ''}`}
                  >
                    <Typography
                      variant="small"
                      weight={isActive ? "bold" : "medium"}
                      className={`capitalize ${isActive ? 'text-white' : 'text-zinc-400'}`}
                    >
                      {g}
                    </Typography>
                  </TouchableOpacity>
                );
              })}
            </Surface>

            {/* Action Buttons */}
            <Button
              onPress={handleSubmit}
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="h-14 rounded-full bg-brand-primary border-none outline-none shadow-none"
              style={{ borderWidth: 0 }}
              textClassName="text-white font-bold"
            >
              <Typography variant="body" weight="bold" className="text-white">
                Create Client
              </Typography>
            </Button>
          </Surface>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
