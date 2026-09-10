import React, { useState } from 'react';
import { View, Modal, TouchableOpacity } from 'react-native';
import { Crown } from 'iconsax-react-native';
import Svg, { Path } from 'react-native-svg';
import { Typography } from './ui/Typography';
import { useTheme } from '../contexts/ThemeContext';
import { SubscriptionModal } from './SubscriptionModal';

type ResourceType = 'orders' | 'customers' | 'templates' | 'invoices';

interface ResourceLimitModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
  onContinueAnyway?: () => void;
  resource: ResourceType;
  currentCount: number;
  limit: number;
  isOffline?: boolean;
}

export function ResourceLimitModal({
  visible,
  onClose,
  onUpgrade,
  onContinueAnyway,
  resource,
  currentCount,
  limit,
  isOffline = false,
}: ResourceLimitModalProps) {
  const { isDark } = useTheme();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  if (!visible && !showSubscriptionModal) return null;

  const percentage = Math.min(Math.round((currentCount / limit) * 100), 100);
  const resourceLabel = resource.charAt(0).toUpperCase() + resource.slice(1);

  const handleUpgradePress = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      setShowSubscriptionModal(true);
    }
  };

  const handleCloseSubscription = () => {
    setShowSubscriptionModal(false);
    onClose();
  };

  return (
    <>
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible && !showSubscriptionModal}
        onRequestClose={onClose}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className={`rounded-[32px] p-6 pb-9 mb-4 mx-4 ${isDark ? 'bg-background-dark border border-zinc-800' : 'bg-white shadow-2xl'}`}>
            {/* Header with Close Button */}
            <View className="flex-row justify-end mb-1">
              <TouchableOpacity
                onPress={onClose}
                className={`w-8 h-8 rounded-full items-center justify-center ${isDark ? 'bg-white/10' : 'bg-black/5'}`}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Svg width="18" height="18" viewBox="0 0 24 24">
                  <Path
                    fill="none"
                    stroke={isDark ? '#FFFFFF' : '#18181B'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M18 6L6 18m12 0L6 6"
                  />
                </Svg>
              </TouchableOpacity>
            </View>

            {/* Hero Icon & Title */}
            <View className="items-center mb-5">
              {/* <View className={`w-16 h-16 rounded-3xl items-center justify-center mb-3.5 ${isDark ? 'bg-amber-500/15 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
                <Crown size={32} color="#F59E0B" variant="Bulk" />
              </View> */}
              <Typography variant="h3" weight="bold" className="text-center mb-1">
                {resourceLabel} Limit Reached
              </Typography>
              <Typography variant="body" color="gray" className="text-center px-2 leading-5">
                You've reached your free tier limit of {limit} {resource.toLowerCase()}. Upgrade to Pro to unlock unlimited {resource.toLowerCase()} and all premium features.
              </Typography>
            </View>

            {/* Usage Progress Card */}
            {/* <View className={`p-4 rounded-2xl mb-6 ${isDark ? 'bg-white/[0.04] border border-white/10' : 'bg-gray-50 border border-gray-100'}`}> */}
            <View className="flex-row justify-between items-center mb-2.5 mt-10">
              <Typography variant="small" weight="bold" color="gray" className="uppercase tracking-wider text-[11px]">
                {resourceLabel} Usage
              </Typography>
              <View className="flex-row items-center">
                <Typography variant="small" weight="bold" className={isDark ? 'text-white' : 'text-zinc-900'}>
                  {currentCount}
                </Typography>
                <Typography variant="small" color="gray">
                  {` / ${limit} (${percentage}%)`}
                </Typography>
              </View>
            </View>

            {/* Progress bar track */}
            <View className={`h-2.5 rounded-full overflow-hidden mb-12 ${isDark ? 'bg-zinc-800' : 'bg-gray-200'}`}>
              <View
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${percentage}%` }}
              />
            </View>
            {/* </View> */}

            {/* Primary Action: Upgrade to Pro */}
            <TouchableOpacity
              onPress={handleUpgradePress}
              activeOpacity={0.85}
              className="h-14 rounded-full bg-yellow-400 flex-row items-center justify-center shadow-none"
            >
              <Typography variant="body" weight="bold" className="ml-2 text-black text-base">
                Unlock limit
              </Typography>
            </TouchableOpacity>



            {/* Dismiss Action */}
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              className="h-11 rounded-full items-center justify-center mt-1"
            >
              <Typography variant="body" color="gray">
                Maybe Later
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Embedded Subscription Modal (same modal as More/Profile screen) */}
      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={handleCloseSubscription}
        onSuccess={handleCloseSubscription}
      />
    </>
  );
}
