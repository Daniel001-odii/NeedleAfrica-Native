import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Wifi, Crown, CloseCircle } from 'iconsax-react-native';
import { Typography } from './ui/Typography';
import { useSync } from '../hooks/useSync';
import { useSubscription } from '../hooks/useSubscription';
import { useResourceLimits } from '../hooks/useResourceLimits';
import { useRouter } from 'expo-router';

export function LimitedOfflineBanner() {
  const { isOnline } = useSync();
  const { isFree } = useSubscription();
  const { counts } = useResourceLimits();
  const router = useRouter();
  const [dismissed, setDismissed] = React.useState(false);

  // Only show for free tier users when offline
  if (isOnline || !isFree || dismissed) {
    return null;
  }

  // Determine which resource is closest to limit
  const resources = [
    { key: 'orders', label: 'orders', count: counts.orders, limit: 5 },
    { key: 'customers', label: 'customers', count: counts.customers, limit: 5 },
    { key: 'invoices', label: 'invoices', count: counts.invoices, limit: 5 },
    { key: 'templates', label: 'templates', count: counts.templates, limit: 3 },
  ] as const;

  const mostUsed = resources.reduce((prev, current) => {
    const prevPercent = prev.count / prev.limit;
    const currentPercent = current.count / current.limit;
    return currentPercent > prevPercent ? current : prev;
  });

  const usagePercent = Math.round((mostUsed.count / mostUsed.limit) * 100);

  // Determine warning color based on usage
  let bgColor = 'bg-orange-100';
  let borderColor = 'border-orange-200';
  let textColor = 'text-orange-800';
  let iconColor = '#F97316';

  if (usagePercent >= 100) {
    bgColor = 'bg-red-100';
    borderColor = 'border-red-200';
    textColor = 'text-red-800';
    iconColor = '#EF4444';
  } else if (usagePercent >= 80) {
    bgColor = 'bg-yellow-100';
    borderColor = 'border-yellow-200';
    textColor = 'text-yellow-800';
    iconColor = '#EAB308';
  }

  const handlePress = () => {
    router.push('/(tabs)/profile/subscription');
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className={`mx-4 mt-2 mb-2 px-4 py-3 rounded-xl border ${bgColor} ${borderColor}`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <Wifi size={20} color={iconColor} variant="Broken" />
          <View className="ml-2 flex-1">
            <Typography variant="small" weight="semibold" className={textColor}>
              Limited Offline Mode
            </Typography>
            <Typography variant="caption" color="gray">
              {mostUsed.count}/{mostUsed.limit} {mostUsed.label} used
              {usagePercent >= 100 && ' - At limit!'}
            </Typography>
          </View>
        </View>

        <View className="flex-row items-center">
          <View className="bg-yellow-400 px-2 py-1 rounded-full mr-2">
            <Typography variant="caption" weight="bold" className="text-black text-[10px]">
              <Crown size={12} color="black" variant="Bulk" /> Go Pro
            </Typography>
          </View>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              setDismissed(true);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <CloseCircle size={18} color="#9CA3AF" variant="Linear" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}
