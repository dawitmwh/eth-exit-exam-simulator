/**
 * Haptic feedback utilities for native-like interactions
 * Works on devices that support the Vibration API
 */

export const haptics = {
  // Light tap feedback (for button presses)
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },

  // Medium feedback (for selections)
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },

  // Heavy feedback (for important actions)
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  },

  // Success pattern
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 10]);
    }
  },

  // Error pattern
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 50, 30, 50, 30]);
    }
  },

  // Warning pattern
  warning: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([20, 100, 20]);
    }
  },

  // Selection changed pattern
  selection: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(5);
    }
  },
};

/**
 * Hook for button press haptics
 */
export function useHapticFeedback() {
  const triggerLight = () => haptics.light();
  const triggerMedium = () => haptics.medium();
  const triggerHeavy = () => haptics.heavy();
  const triggerSuccess = () => haptics.success();
  const triggerError = () => haptics.error();
  const triggerWarning = () => haptics.warning();
  const triggerSelection = () => haptics.selection();

  return {
    triggerLight,
    triggerMedium,
    triggerHeavy,
    triggerSuccess,
    triggerError,
    triggerWarning,
    triggerSelection,
  };
}
