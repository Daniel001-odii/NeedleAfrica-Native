import React from 'react';
import { View, Modal, TouchableOpacity } from 'react-native';
import { Calculator } from 'iconsax-react-native';
import { Typography } from './ui/Typography';
import { Button } from './ui/Button';
import { useTheme } from '../contexts/ThemeContext';
import Svg, { Path } from 'react-native-svg';

interface PricingCalculatorPromptModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  styleName?: string;
}

export function PricingCalculatorPromptModal({
  visible,
  onClose,
  onConfirm,
  styleName,
}: PricingCalculatorPromptModalProps) {
  const { isDark } = useTheme();

  if (!visible) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 justify-end">
        <View className={`rounded-[32px] p-6 pb-10 mb-6 m-4 ${isDark ? 'bg-background-dark border border-zinc-800' : 'bg-white'}`}>
          {/* Header Close button */}
          <View className="flex-row justify-end mb-2">
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

          {/* Icon and Main Text */}
          <View className="items-center mb-6">
            <View className={`w-16 h-16 rounded-2xl items-center justify-center mb-4 ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
              <Calculator size={36} color={isDark ? "#0A84FF" : "#007AFF"} variant="Bulk" />
            </View>
            <Typography variant="h3" weight="bold" className="text-center mb-2">
              Calculate Pricing?
            </Typography>
            <Typography variant="body" color="gray" className="text-center px-4 leading-5">
              Would you like to use the Pricing Calculator to properly calculate materials, labor, and overhead costs for <Typography weight="bold" className={isDark ? 'text-white' : 'text-zinc-900'}>"{styleName || 'this garment'}"</Typography>?
            </Typography>
          </View>

          {/* Action Buttons */}
          <View className="gap-3">
            <Button
              onPress={onConfirm}
              style={{
                borderWidth: 0,
              }}
              className="h-14 rounded-full border-none bg-blue-500 shadow-none outline-none animate-none"
              textClassName="text-white font-bold"
            >
              <Typography variant="body" weight="bold" className="text-white">
                Yes, Calculate Price
              </Typography>
            </Button>

            <TouchableOpacity
              onPress={onClose}
              className="h-12 items-center justify-center rounded-full bg-gray-400"
            >
              <Typography variant="body" color="gray" weight="bold">
                Maybe Later
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
