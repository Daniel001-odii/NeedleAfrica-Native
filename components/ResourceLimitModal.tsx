import React from 'react';
import { View, Modal, TouchableOpacity } from 'react-native';
import { Crown, CloseCircle, Warning2, InfoCircle } from 'iconsax-react-native';
import { Typography } from './ui/Typography';
import { Button } from './ui/Button';
import { Surface } from './ui/Surface';

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
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <Surface variant="white" className="rounded-t-3xl p-6 pb-10">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <View className="flex-row items-center">
              <Warning2 size={28} color="#EF4444" variant="Bulk" />
              <Typography variant="h3" weight="bold" color="red" className="ml-2">
                Limit Reached
              </Typography>
            </View>
            <TouchableOpacity onPress={onClose}>
              <CloseCircle size={28} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Progress Section */}
          <Surface variant="white" className="p-4 mb-6 border border-gray-100" rounded="2xl">
            <View className="flex-row justify-between items-center mb-2">
              <Typography variant="body" weight="bold">
                {resourceLabel} Usage
              </Typography>
              <Typography variant="body" color={isAtLimit ? 'red' : 'gray'} weight="bold">
                {currentCount}/{limit}
              </Typography>
            </View>

            {/* Progress bar */}
            <View className="h-3 bg-gray-200 rounded-full overflow-hidden">
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
          </Surface>

          {/* Upgrade CTA */}
          <Surface variant="white" className="p-4 mb-6 bg-yellow-50 border border-yellow-200" rounded="2xl">
            <View className="flex-row items-start">
              <Crown size={24} color="#EAB308" variant="Bulk" />
              <View className="ml-3 flex-1">
                <Typography variant="body" weight="bold" className="mb-1">
                  Upgrade to Pro
                </Typography>
                <Typography variant="small" color="gray">
                  Get unlimited {resourceLabel} and unlock all premium features for just ₦2,500/month.
                </Typography>
              </View>
            </View>
          </Surface>

          {/* Offline Notice - Commented out: Removed "will sync when online" option
          {isOffline && (
            <Surface variant="white" className="p-4 mb-6 bg-blue-50 border border-blue-200" rounded="2xl">
              <View className="flex-row items-start">
                <InfoCircle size={20} color="#3B82F6" variant="Bulk" />
                <View className="ml-2 flex-1">
                  <Typography variant="small" color="gray">
                    You're currently offline. You can continue creating this {resourceLabel.slice(0, -1)}, but it will only sync to the server when you're back online. If you're over your limit when you sync, you'll need to upgrade.
                  </Typography>
                </View>
              </View>
            </Surface>
          )}
          */}

          {/* Actions */}
          <Button
            onPress={onUpgrade}
            className="h-14 rounded-full bg-yellow-400"
            textClassName="text-black font-bold"
          >
            <View className="flex-row items-center">
              <Crown size={18} color="black" variant="Bulk" />
              <Typography variant="body" weight="bold" className="ml-2 text-black">
                Upgrade to Pro
              </Typography>
            </View>
          </Button>

          {/* Continue Anyway button - Commented out: Removed "will sync when online" option
          {isOffline && (
            <Button
              onPress={onContinueAnyway}
              variant="outline"
              className="h-14 rounded-full mt-3"
            >
              <Typography variant="body" weight="medium">
                Continue Anyway - Will Sync When Online
              </Typography>
            </Button>
          )}
          */}

          <Button
            onPress={onClose}
            variant="ghost"
            className="h-12 rounded-full mt-2"
          >
            <Typography variant="body" color="gray">
              Cancel
            </Typography>
          </Button>
        </Surface>
      </View>
    </Modal>
  );
}
