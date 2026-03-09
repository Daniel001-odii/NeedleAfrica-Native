import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CloseSquare, Check, Crown, Star1, ShieldTick, Magicpen } from 'iconsax-react-native';
import { Typography } from './ui/Typography';
import { useRevenueCat } from '../hooks/useRevenueCat';
import { revenueCatService } from '../services/RevenueCatService';
import { PurchasesPackage } from 'react-native-purchases';
import Toast from 'react-native-toast-message';
import { Surface } from './ui/Surface';
import { usePostHog } from 'posthog-react-native';

interface SubscriptionPaywallProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  feature?: string;
}


export const SubscriptionPaywall: React.FC<SubscriptionPaywallProps> = ({
  visible,
  onClose,
  onSuccess,
  feature,
}) => {
  const {
    isLoading,
    purchasePackage,
    restorePurchases,
  } = useRevenueCat();
  const posthog = usePostHog();

  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [loadingPackages, setLoadingPackages] = useState(true);

  useEffect(() => {
    if (visible) {
      loadPackages();

      // Track when user opens the subscription paywall
      posthog.capture('subscription_attempted', {
        source_feature: feature || 'manual_upgrade',
      });
    }
  }, [visible]);

  const loadPackages = async () => {
    try {
      setLoadingPackages(true);
      const offerings = await revenueCatService.getOfferings();
      if (offerings) {
        // Flatten all packages from all offerings
        const allPackages: PurchasesPackage[] = [];
        Object.values(offerings.all).forEach(offering => {
          allPackages.push(...offering.availablePackages);
        });

        // Remove duplicates (based on identifier)
        const uniquePackages = allPackages.filter((pkg, index, self) =>
          index === self.findIndex((p) => p.identifier === pkg.identifier)
        );

        setPackages(uniquePackages);

        // Default select monthly package
        const monthlyPackage = uniquePackages.find((pkg: PurchasesPackage) =>
          pkg.identifier.toLowerCase().includes('monthly')
        );
        if (monthlyPackage) {
          setSelectedPackage(monthlyPackage.identifier);
        } else if (uniquePackages.length > 0) {
          setSelectedPackage(uniquePackages[0].identifier);
        }
      }
    } catch (error) {
      console.error('Failed to load packages:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load subscription options',
      });
    } finally {
      setLoadingPackages(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select a subscription plan',
      });
      return;
    }

    try {
      await purchasePackage(selectedPackage);
      Toast.show({
        type: 'success',
        text1: 'Success!',
        text2: 'You are now a Pro subscriber',
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      const errorMessage = (error as any)?.message || 'Purchase failed';
      Toast.show({
        type: 'error',
        text1: 'Purchase Failed',
        text2: errorMessage,
      });
    }
  };

  const handleRestore = async () => {
    try {
      await restorePurchases();
      Toast.show({
        type: 'success',
        text1: 'Success!',
        text2: 'Your purchases have been restored',
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      const errorMessage = (error as any)?.message || 'Restore failed';
      Toast.show({
        type: 'error',
        text1: 'Restore Failed',
        text2: errorMessage,
      });
    }
  };

  const getPackageIcon = (packageType: string) => {
    if (packageType.includes('yearly')) {
      return <Crown size={24} color="#FDB022" />;
    }
    return <Star1 size={24} color="#6366f1" />;
  };

  const getPackageBadge = (packageType: string) => {
    if (packageType.includes('yearly')) {
      return 'BEST VALUE';
    }
    return null;
  };

  const getPackageTitle = (pkg: PurchasesPackage) => {
    if (pkg.product.title) {
      return pkg.product.title.split('(')[0].trim();
    }

    const identifier = pkg.identifier;
    if (identifier.includes('Studio')) {
      return identifier.toLowerCase().includes('yearly') ? 'Studio Yearly' : 'Studio Monthly';
    }
    return identifier.toLowerCase().includes('yearly') ? 'Pro Yearly' : 'Pro Monthly';
  };

  const getPricePeriod = (pkg: PurchasesPackage) => {
    return pkg.identifier.toLowerCase().includes('yearly') ? '/ year' : '/ month';
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Premium Header */}
          <View className="relative">
            <LinearGradient
              colors={['#818cf8', '#6366f1', '#4f46e5']}
              className="px-6 pt-12 pb-16 rounded-b-[40px]"
            >
              <View className="flex-row justify-between items-center mb-6">
                <View className="bg-white/20 p-2 rounded-full">
                  <Crown size={24} color="white" />
                </View>
                <TouchableOpacity onPress={onClose} className="bg-white/10 p-2 rounded-full">
                  <CloseSquare size={24} color="white" />
                </TouchableOpacity>
              </View>

              <Typography variant="h1" weight="bold" color="white" className="text-3xl mb-2">
                Get Needle Pro
              </Typography>
              <Typography variant="body" color="white" className="opacity-80 leading-6 text-lg">
                The ultimate toolkit for modern tailors and fashion designers.
              </Typography>
            </LinearGradient>

            {/* Absolute badge */}
            <View className="absolute -bottom-6 self-center bg-white px-6 py-3 rounded-2xl shadow-lg border border-indigo-100 flex-row items-center">
              <ShieldTick size={20} color="#6366f1" />
              <Typography variant="small" weight="bold" className="ml-2 text-indigo-900 uppercase tracking-widest">
                Trusted by thousands
              </Typography>
            </View>
          </View>

          <View className="px-6 pt-12">
            {feature && (
              <Surface variant="lavender" className="p-4 rounded-xl border border-indigo-100 mb-6">
                <View className="flex-row items-center">
                  <Magicpen size={20} color="#6366f1" />
                  <Typography variant="body" weight="medium" className="ml-3 text-indigo-900">
                    This feature requires a Pro subscription
                  </Typography>
                </View>
              </Surface>
            )}

            <Typography variant="subtitle" weight="bold" className="mb-6 text-xl">
              Pro Member Benefits:
            </Typography>

            <View className="flex-row flex-wrap justify-between">
              {[
                { title: 'Unlimited Orders', icon: <Check size={20} color="#10B981" /> },
                { title: 'AI Measurements', icon: <Magicpen size={20} color="#6366f1" /> },
                { title: 'Custom Invoices', icon: <Check size={20} color="#10B981" /> },
                { title: 'Team Access', icon: <Check size={20} color="#10B981" /> },
                { title: 'Priority Support', icon: <Check size={20} color="#10B981" /> },
                { title: 'Cloud Sync', icon: <Check size={20} color="#10B981" /> },
              ].map((item, index) => (
                <View key={index} className="flex-row items-center mb-4 w-[48%] bg-gray-50 p-3 rounded-lg border border-gray-100">
                  {item.icon}
                  <Typography variant="small" weight="semibold" className="ml-2 text-gray-700">
                    {item.title}
                  </Typography>
                </View>
              ))}
            </View>
          </View>

          {loadingPackages ? (
            <View className="items-center py-20">
              <ActivityIndicator size="large" color="#6366f1" />
              <Typography variant="body" color="gray" className="mt-4">
                Fetching premium plans...
              </Typography>
            </View>
          ) : (
            <View className="py-5 px-6">
              <Typography variant="subtitle" weight="bold" className="mb-6 text-xl">
                Select Subscription:
              </Typography>
              {packages.map((pkg: PurchasesPackage) => {
                const isSelected = selectedPackage === pkg.identifier;
                const badge = getPackageBadge(pkg.packageType);

                return (
                  <TouchableOpacity
                    key={pkg.identifier}
                    onPress={() => setSelectedPackage(pkg.identifier)}
                    activeOpacity={0.9}
                  >
                    <Surface
                      variant={isSelected ? "lavender" : "white"}
                      hasBorder
                      className={`p-5 mb-4 ${isSelected ? 'border-brand-primary' : 'border-gray-100'}`}
                    >
                      <View className="flex-row justify-between items-center">
                        <View className="flex-1">
                          <View className="flex-row items-center mb-1">
                            <Typography variant="subtitle" weight="bold" color={isSelected ? "primary" : "black"}>
                              {getPackageTitle(pkg)}
                            </Typography>
                            {badge && (
                              <View className="bg-card-orange px-2 py-0.5 rounded ml-2">
                                <Typography variant="small" weight="bold" color="white" className="text-[10px]">
                                  {badge}
                                </Typography>
                              </View>
                            )}
                          </View>
                          <View className="flex-row items-end">
                            <Typography variant="h2" weight="bold" color={isSelected ? "primary" : "black"}>
                              {pkg.product.priceString}
                            </Typography>
                            <Typography variant="body" color="gray" className="mb-1 ml-1">
                              {getPricePeriod(pkg)}
                            </Typography>
                          </View>
                        </View>
                        <View className={`w-6 h-6 rounded-full border-2 justify-center items-center ${isSelected ? 'border-brand-primary bg-brand-primary' : 'border-gray-300'
                          }`}>
                          {isSelected && <Check size={14} color="white" variant="Bold" />}
                        </View>
                      </View>

                      {pkg.identifier.toLowerCase().includes('yearly') && (
                        <View className="mt-3 pt-3 border-t border-indigo-100 flex-row items-center">
                          <View className="bg-green-100 px-2 py-0.5 rounded">
                            <Typography variant="small" weight="bold" className="text-green-700">
                              SAVE 20%
                            </Typography>
                          </View>
                          <Typography variant="small" color="gray" className="ml-2">
                            Compared to monthly billing
                          </Typography>
                        </View>
                      )}
                    </Surface>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View className="py-5 px-6">
            <TouchableOpacity
              className={`py-4 rounded-xl items-center mb-3 ${(!selectedPackage || isLoading) ? 'bg-gray-300' : 'bg-brand-primary'
                }`}
              onPress={handlePurchase}
              disabled={!selectedPackage || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Typography variant="subtitle" weight="bold" color="white">
                  Start Free Trial
                </Typography>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="py-3 items-center"
              onPress={handleRestore}
              disabled={isLoading}
            >
              <Typography variant="body" weight="medium" color="primary">
                Restore Purchases
              </Typography>
            </TouchableOpacity>

            <View className="mt-5 px-2">
              <Typography variant="small" color="gray" className="text-center leading-5">
                Subscription automatically renews unless auto-renew is turned off at least
                24 hours before the end of the current period. Payment will be charged to
                your iTunes Account at confirmation of purchase.
              </Typography>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

