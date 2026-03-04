import React, { useState } from 'react';
import { View, TouchableOpacity, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, Crown, Star1 } from 'iconsax-react-native';
import { Typography } from './ui/Typography';
import { Surface } from './ui/Surface';
import { useRevenueCat } from '../hooks/useRevenueCat';
import { SubscriptionPaywall } from './SubscriptionPaywall';

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
  const { canAccessFeature, isPro } = useRevenueCat();
  const router = useRouter();
  const [showPaywall, setShowPaywall] = useState(false);

  const checkFeatureAccess = async () => {
    try {
      return await canAccessFeature(feature);
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false;
    }
  };

  // For simplicity, we'll use synchronous check based on isPro status
  // In a real implementation, you might want to handle this differently
  const available = isPro || ['basic_measurements', 'customer_management', 'order_tracking'].includes(feature);
  const disabled = !available;
  const upgradeMessage = `${feature} requires a Pro subscription`;

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
              <Star1 size={24} color="#8b5cf6" variant="Bulk" />
            ) : (
              <Crown size={24} color="#Eab308" variant="Bulk" />
            )}
            <Typography variant="small" weight="bold" className="mt-2 text-center">
              {upgradeMessage}
            </Typography>
            <TouchableOpacity
              onPress={() => setShowPaywall(true)}
              className="mt-3 bg-yellow-400 px-4 py-2 rounded-full"
            >
              <Typography variant="small" weight="bold">Upgrade Now</Typography>
            </TouchableOpacity>
          </View>
        </Surface>
      </View>
      <SubscriptionPaywall
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        feature={feature}
      />
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
  const { isPro } = useRevenueCat();
  const router = useRouter();
  const [showPaywall, setShowPaywall] = useState(false);

  // Only show limit warning for free tier
  if (isPro) {
    return <>{children}</>;
  }

  // Define free tier limits
  const limits = {
    orders: 5,
    customers: 5,
    templates: 3,
    invoices: 5,
  };

  const limit = limits[resource];
  const hasReached = currentCount >= limit;

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
              onPress={() => setShowPaywall(true)}
              className="mt-4 bg-yellow-400 px-6 py-3 rounded-full"
            >
              <Typography variant="body" weight="bold">Upgrade to Pro</Typography>
            </TouchableOpacity>
          </View>
        </Surface>
      </View>
      <SubscriptionPaywall
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        feature={`unlimited_${resource}`}
      />
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
  const { isPro } = useRevenueCat();

  const currentPlan = isPro ? 'PRO' : 'FREE';
  const isActive = true; // RevenueCat handles this
  const isExpired = false; // RevenueCat handles this

  const badgeColors: Record<string, string> = {
    FREE: 'bg-blue-500',
    PRO: 'bg-yellow-500',
    STUDIO_AI: 'bg-purple-600',
  };

  const badgeText: Record<string, string> = {
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
