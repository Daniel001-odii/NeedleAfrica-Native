import React from 'react';
import { View, TouchableOpacity, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, Crown, Sparkles } from 'iconsax-react-native';
import { Typography } from './Typography';
import { Surface } from './Surface';
import { useSubscription } from '../hooks/useSubscription';

interface FeatureGuardProps {
  children: React.ReactNode;
  feature: 'customizableInvoices' | 'publicLookbook' | 'downloadData' | 'aiFeatures' | 'teamManagement' | 'prioritySupport' | 'unlimitedOrders' | 'unlimitedCustomers' | 'unlimitedTemplates' | 'unlimitedInvoices';
  fallback?: React.ReactNode;
}

/**
 * FeatureGuard - Shows disabled UI with upgrade prompt when feature is not available
 * Does NOT block the UI - instead shows a disabled overlay with upgrade message
 */
export function FeatureGuard({ children, feature, fallback }: FeatureGuardProps) {
  const { isFeatureAvailable } = useSubscription();
  const router = useRouter();

  const { available, disabled, upgradeMessage } = isFeatureAvailable(feature);

  if (available) {
    return <>{children}</>;
  }

  // If custom fallback provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default disabled overlay
  return (
    <View className="relative">
      {/* Disabled content with reduced opacity */}
      <View className="opacity-40">
        {children}
      </View>

      {/* Upgrade overlay */}
      <View className="absolute inset-0 items-center justify-center">
        <Surface variant="white" className="p-4 mx-4 border border-gray-200" rounded="2xl">
          <View className="items-center">
            {feature === 'aiFeatures' ? (
              <Sparkles size={24} color="#8b5cf6" variant="Bulk" />
            ) : (
              <Crown size={24} color="#Eab308" variant="Bulk" />
            )}
            <Typography variant="small" weight="bold" className="mt-2 text-center">
              {upgradeMessage}
            </Typography>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/profile/subscription')}
              className="mt-3 bg-yellow-400 px-4 py-2 rounded-full"
            >
              <Typography variant="small" weight="bold">Upgrade Now</Typography>
            </TouchableOpacity>
          </View>
        </Surface>
      </View>
    </View>
  );
}

interface LimitGuardProps {
  children: React.ReactNode;
  resource: 'orders' | 'customers' | 'templates' | 'invoices';
  currentCount: number;
}

/**
 * LimitGuard - Shows upgrade prompt when user hits free tier limits
 * Only applies to FREE tier users
 */
export function LimitGuard({ children, resource, currentCount }: LimitGuardProps) {
  const { hasReachedLimit, getLimitForResource, currentPlan } = useSubscription();
  const router = useRouter();

  // Only show limit warning for free tier
  if (currentPlan !== 'FREE') {
    return <>{children}</>;
  }

  const hasReached = hasReachedLimit(resource, currentCount);
  const limit = getLimitForResource(resource);

  if (!hasReached) {
    // Show remaining count indicator
    return (
      <View>
        {children}
        <View className="flex-row items-center justify-end mt-2 mr-2">
          <Typography variant="caption" color="gray">
            {currentCount}/{limit} used on Free plan
          </Typography>
        </View>
      </View>
    );
  }

  // Show limit reached overlay
  return (
    <View className="relative">
      <View className="opacity-40">
        {children}
      </View>
      <View className="absolute inset-0 items-center justify-center">
        <Surface variant="white" className="p-6 mx-4 border border-red-200 bg-red-50" rounded="2xl">
          <View className="items-center">
            <Lock size={32} color="#EF4444" variant="Bulk" />
            <Typography variant="body" weight="bold" color="red" className="mt-3 text-center">
              Limit Reached
            </Typography>
            <Typography variant="small" color="gray" className="mt-2 text-center">
              You've used all {limit} {resource} on your Free plan. Upgrade to Pro for unlimited access.
            </Typography>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/profile/subscription')}
              className="mt-4 bg-yellow-400 px-6 py-3 rounded-full"
            >
              <Typography variant="body" weight="bold">Upgrade to Pro</Typography>
            </TouchableOpacity>
          </View>
        </Surface>
      </View>
    </View>
  );
}

interface SubscriptionBadgeProps {
  size?: 'sm' | 'md';
}

/**
 * SubscriptionBadge - Shows current plan badge
 */
export function SubscriptionBadge({ size = 'md' }: SubscriptionBadgeProps) {
  const { currentPlan, isActive, isExpired } = useSubscription();

  const badgeColors = {
    FREE: 'bg-blue-500',
    PRO: 'bg-yellow-500',
    STUDIO_AI: 'bg-purple-600',
  };

  const badgeText = {
    FREE: 'Free',
    PRO: 'Pro',
    STUDIO_AI: 'Studio AI',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs',
  };

  return (
    <View className={`${badgeColors[currentPlan]} ${sizeClasses[size]} rounded-full`}>
      <Typography variant="small" color="white" weight="bold">
        {badgeText[currentPlan]}
        {!isActive && !isExpired && ' (Inactive)'}
        {isExpired && ' (Expired)'}
      </Typography>
    </View>
  );
}

interface UpgradePromptProps {
  feature: string;
  requiredPlan: 'PRO' | 'STUDIO_AI';
}

/**
 * UpgradePrompt - Simple inline upgrade prompt
 */
export function UpgradePrompt({ feature, requiredPlan }: UpgradePromptProps) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push('/(tabs)/profile/subscription')}
      className="flex-row items-center bg-yellow-50 border border-yellow-200 px-4 py-3 rounded-xl"
    >
      <Crown size={20} color="#Eab308" variant="Bulk" />
      <Typography variant="small" className="ml-2 flex-1">
        {feature} requires {requiredPlan} plan
      </Typography>
      <Typography variant="small" weight="bold" color="primary">
        Upgrade
      </Typography>
    </Pressable>
  );
}
