import React from 'react';
import { View, Modal, TouchableOpacity } from 'react-native';
import { Crown, CloseCircle, Warning2, InfoCircle } from 'iconsax-react-native';
import { Typography } from './ui/Typography';
import { Button } from './ui/Button';
import { Surface } from './ui/Surface';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { CURRENCIES } from '../constants/currencies';
import Svg, { Path } from 'react-native-svg';

type ResourceType = 'orders' | 'customers' | 'templates' | 'invoices';

interface ResourceLimitModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  onContinueAnyway: () => void;
  resource: ResourceType;
  currentCount: number;
  limit: number;
  isOffline: boolean;
}

export function ResourceLimitModal({
  visible,
  onClose,
  onUpgrade,
  onContinueAnyway,
  resource,
  currentCount,
  limit,
  isOffline,
}: ResourceLimitModalProps) {
  const { isDark } = useTheme();
  const { user } = useAuth();

  const currency = user?.currency || 'NGN';
  const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || '₦';

  if (!visible) return null;

  const percentage = Math.min((currentCount / limit) * 100, 100);
  const isAtLimit = currentCount >= limit;

  // Progress bar color
  let progressColor = 'bg-green-500';
  if (percentage >= 80) progressColor = 'bg-yellow-500';
  if (percentage >= 100) progressColor = 'bg-red-500';

  const resourceLabel = resource.charAt(0).toUpperCase() + resource.slice(1);

  return (
    <Modal
      className=''
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className={`rounded-3xl p-6 pb-10 mb-6 m-2 ${isDark ? 'bg-background-dark' : 'bg-white'}`}>
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <View className="flex-row items-center">
              <Warning2 size={28} color="#EF4444" variant="Bulk" />
              <Typography variant="h3" weight="bold" color="red" className="ml-2">
                Limit Reached
              </Typography>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Svg className={isDark ? 'text-white' : 'text-black'} width="24" height="24" viewBox="0 0 24 24">{/* Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE */}
                <Path fill="currentColor" d="m12 13.4l-4.9 4.9q-.275.275-.7.275t-.7-.275t-.275-.7t.275-.7l4.9-4.9l-4.9-4.9q-.275-.275-.275-.7t.275-.7t.7-.275t.7.275l4.9 4.9l4.9-4.9q.275-.275.7-.275t.7.275t.275.7t-.275.7L13.4 12l4.9 4.9q.275.275.275.7t-.275.7t-.7.275t-.7-.275z" />
              </Svg>
            </TouchableOpacity>
          </View>

          {/* Progress Section */}
          <View className={`p-4 mb-6 rounded-2xl border ${isDark ? 'bg-red-900/10 border-red-500/20' : 'bg-white border-gray-100'}`}>
            <View className="flex-row justify-between items-center mb-2">
              <Typography variant="body" weight="bold">
                {resourceLabel} Usage
              </Typography>
              <Typography variant="body" color={isAtLimit ? 'red' : 'gray'} weight="bold">
                {currentCount}/{limit}
              </Typography>
            </View>

            {/* Progress bar */}
            <View className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-dark-700' : 'bg-gray-200'}`}>
              <View
                className={`h-full ${progressColor} rounded-full`}
                style={{ width: `${percentage}%` }}
              />
            </View>

            <Typography variant="small" color="gray" className="mt-2">
              {isAtLimit
                ? `You've reached your free tier limit for ${resourceLabel}.`
                : `You're approaching your free tier limit for ${resourceLabel}.`}
            </Typography>
          </View>

          {/* Upgrade CTA */}
          <View className={`p-4 mb-6 rounded-2xl border ${isDark ? 'bg-yellow-900/15 border-yellow-500/20' : 'bg-yellow-50 border-yellow-200'}`}>
            <View className="flex-row items-start">
              <Crown size={24} color="#EAB308" variant="Bulk" />
              <View className="ml-3 flex-1">
                <Typography variant="body" weight="bold" className="mb-1">
                  Upgrade to Pro
                </Typography>
                <Typography variant="small" color="gray">
                  Get unlimited {resourceLabel} and unlock all premium features.
                </Typography>
              </View>
            </View>
          </View>

          {/* Actions */}
          <Button
            variant='ghost'
            onPress={onUpgrade}
            className="h-14 rounded-full bg-yellow-400 border-none outline-none"
            textClassName="text-black font-bold"
          >
            <View className="flex-row items-center">
              <Crown size={18} color="black" variant="Bulk" />
              <Typography variant="body" weight="bold" className="ml-2 text-black">
                Upgrade to Pro
              </Typography>
            </View>
          </Button>

          <Button
            onPress={onClose}
            variant="ghost"
            className="h-12 rounded-full mt-2"
          >
            <Typography variant="body" color="gray">
              Cancel
            </Typography>
          </Button>
        </View>
      </View>
    </Modal>
  );
}
