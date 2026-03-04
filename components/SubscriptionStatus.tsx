import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Crown, Refresh } from 'iconsax-react-native';
import { useRevenueCat } from '../hooks/useRevenueCat';
import { SubscriptionPaywall } from './SubscriptionPaywall';
import { Typography } from './ui/Typography';
import { Surface } from './ui/Surface';

interface SubscriptionStatusProps {
  style?: any;
  className?: string;
  showUpgradeButton?: boolean;
  onSubscriptionChange?: () => void;
}

export const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({
  style,
  className,
  showUpgradeButton = true,
  onSubscriptionChange,
}) => {
  const {
    isPro,
    subscriptionStatus,
    isLoading,
    error,
    refreshCustomerInfo,
    getSubscriptionStatusForDisplay,
  } = useRevenueCat();

  const [showPaywall, setShowPaywall] = useState(false);
  const [displayStatus, setDisplayStatus] = useState<{
    plan: 'FREE' | 'PRO';
    status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'TRIAL';
    expiryDate: Date | null;
    willRenew: boolean;
  }>({
    plan: 'FREE',
    status: 'ACTIVE',
    expiryDate: null,
    willRenew: false,
  });

  useEffect(() => {
    loadDisplayStatus();
  }, [isPro, subscriptionStatus]);

  const loadDisplayStatus = async () => {
    try {
      const status = await getSubscriptionStatusForDisplay();
      setDisplayStatus(status);
    } catch (error) {
      console.error('Failed to load display status:', error);
    }
  };

  const handleUpgradePress = () => {
    setShowPaywall(true);
  };

  const handlePaywallSuccess = () => {
    setShowPaywall(false);
    refreshCustomerInfo();
    onSubscriptionChange?.();
  };

  const handleRefresh = async () => {
    await refreshCustomerInfo();
    await loadDisplayStatus();
  };

  const getStatusColor = (): "primary" | "gray" | "red" | "black" => {
    if (displayStatus.plan === 'FREE') return 'gray';
    if (displayStatus.status === 'ACTIVE') return 'primary';
    if (displayStatus.status === 'EXPIRED') return 'red';
    if (displayStatus.status === 'CANCELLED') return 'black';
    return 'gray';
  };

  const getStatusText = () => {
    if (displayStatus.plan === 'FREE') return 'Free Plan';
    if (displayStatus.status === 'ACTIVE') return 'Pro Plan';
    if (displayStatus.status === 'EXPIRED') return 'Expired';
    if (displayStatus.status === 'CANCELLED') return 'Cancelled';
    return 'Unknown';
  };

  const getExpiryText = () => {
    if (!displayStatus.expiryDate) return null;

    const expiryDate = new Date(displayStatus.expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 0) {
      return 'Expired';
    } else if (daysUntilExpiry === 1) {
      return 'Expires tomorrow';
    } else if (daysUntilExpiry <= 7) {
      return `Expires in ${daysUntilExpiry} days`;
    } else {
      return `Expires ${expiryDate.toLocaleDateString()}`;
    }
  };

  const getRenewalText = () => {
    if (displayStatus.plan === 'FREE') return null;
    if (!displayStatus.willRenew && displayStatus.status === 'ACTIVE') {
      return 'Will not renew';
    }
    if (displayStatus.willRenew && displayStatus.status === 'ACTIVE') {
      return 'Auto-renewal on';
    }
    return null;
  };

  if (error) {
    return (
      <Surface variant="white" hasBorder style={[styles.container, style]} className={className}>
        <View style={styles.errorContainer}>
          <Typography variant="caption" color="red" style={styles.errorText}>
            Failed to load subscription status
          </Typography>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <Refresh size={16} color="#6366f1" />
          </TouchableOpacity>
        </View>
      </Surface>
    );
  }

  return (
    <>
      <Surface
        variant="white"
        hasBorder
        style={[styles.container, style]}
        className={className}
      >
        <View style={styles.statusContainer}>
          <View style={styles.statusHeader}>
            <View style={styles.planInfo}>
              {displayStatus.plan === 'PRO' && (
                <Crown size={20} color="#FDB022" style={styles.crownIcon} />
              )}
              <Typography
                variant="subtitle"
                weight="bold"
                color={getStatusColor()}
              >
                {getStatusText()}
              </Typography>
            </View>
            {isLoading ? (
              <ActivityIndicator size="small" color="#6366f1" />
            ) : (
              <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
                <Refresh size={16} color="#6366f1" />
              </TouchableOpacity>
            )}
          </View>

          {(getExpiryText() || getRenewalText()) && (
            <View style={styles.statusDetails}>
              {getExpiryText() && (
                <Typography variant="small" color="gray" className="mt-1">
                  {getExpiryText()}
                </Typography>
              )}
              {getRenewalText() && (
                <Typography variant="small" color="gray" className="mt-0.5">
                  {getRenewalText()}
                </Typography>
              )}
            </View>
          )}
        </View>

        {showUpgradeButton && displayStatus.plan === 'FREE' && !isLoading && (
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={handleUpgradePress}
            activeOpacity={0.8}
          >
            <Crown size={16} color="white" />
            <Typography color="white" weight="bold" variant="caption" className="ml-2">
              Upgrade to Pro
            </Typography>
          </TouchableOpacity>
        )}
      </Surface>

      <SubscriptionPaywall
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSuccess={handlePaywallSuccess}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  statusContainer: {
    flex: 1,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  crownIcon: {
    marginRight: 8,
  },
  refreshButton: {
    padding: 4,
  },
  statusDetails: {
    marginTop: 6,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    flex: 1,
    marginRight: 8,
  },
});
