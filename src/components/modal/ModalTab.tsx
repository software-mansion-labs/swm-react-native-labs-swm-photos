import React, { useCallback, useEffect } from "react";
import {
  StyleProp,
  ViewStyle,
  BackHandler,
  Platform,
  View,
  StyleSheet,
} from "react-native";
import { useEdgeSwipeBack } from "@/hooks/gestures/useEdgeSwipeBack";
import { GestureDetector } from "react-native-gesture-handler";
import { StateMachine } from "@/controller/stateMachine";
import { ModalTabState } from "@/controller/states";

/**
 * Helper definitions - modal tab props
 */
export type ModalTabProps = {
  children: React.ReactNode;
  name: string;
  activationTimeout?: number; // In [ms]
  closeTimeout?: number; // In [ms]
  onClose?: () => void; // An extra callback after modal starts closing
  style?: StyleProp<ViewStyle>;
};

/**
 * ModalTab component
 *
 * It's a modal-style component which behaves as a navigation tab, without using navigation packages.
 * The main purpose is to implement image preview tab animation while avoid complications related to using different navigation libraries on Kepler compared to other platforms.
 * For compatibility with Kepler platform, we do not use a standard Modal component, but a specialized View instead.
 */
export const ModalTab = ({
  children,
  name,
  activationTimeout = 0,
  closeTimeout = 0,
  onClose,
  style,
}: ModalTabProps) => {
  /**
   * Modal state management
   */

  // State is indexed by the name since there might be many modal tabs
  const state = StateMachine.observe<ModalTabState>(name);
  const active = state !== "CLOSED";

  // State updates
  useEffect(() => {
    if (state === "ACTIVATING") {
      StateMachine.lock(name);
      setTimeout(
        () => StateMachine.set(name, "ACTIVE", true),
        activationTimeout,
      );
    }
    // Similarly to activating, start a timeout before closing the modal
    if (state === "CLOSING") {
      StateMachine.lock(name);
      setTimeout(() => StateMachine.set(name, "CLOSED", true), closeTimeout);
    }
  }, [state, name, activationTimeout, closeTimeout]);

  // State change handlers - closing the modal
  const handleClose = useCallback(() => {
    if (state === "ACTIVE") {
      onClose?.();
      StateMachine.set(name, "CLOSING");
    }
  }, [state, onClose, name]);

  /**
   * Modal dismissal handling
   */

  // Just like in navigation tab, we need to handle back events
  useEffect(() => {
    // Do not engage in catching events if modal is not active
    if (!active) return;

    // A callback after back button / gesture is clicked / performed
    const handleBack = () => {
      handleClose();
      return true;
    };

    // We use a standard React Native back handler component
    // - So far it works on Android, Android TV and Kepler as well
    // - TODO: surely needs a separate implementation for web
    const sub = BackHandler.addEventListener("hardwareBackPress", handleBack);
    return () => sub.remove();
  }, [active, handleClose]);

  // Edge back gesture - iOS only
  // - iOS devices do not have a standard back button, so we need to use a gesture to close modal tab
  const edgeSwipeBackPan = useEdgeSwipeBack({
    active,
    onEnd: handleClose,
  });

  if (!active) return null;

  return (
    <View
      pointerEvents="auto"
      hasTVPreferredFocus={true} // To disable focus behavior for overlayed components
      style={[StyleSheet.absoluteFill, style]}
    >
      {Platform.OS === "ios" && active && (
        <GestureDetector gesture={edgeSwipeBackPan!}>
          <View style={styles.overlayStrip} />
        </GestureDetector>
      )}
      {children}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  overlayStrip: {
    position: "absolute",
    left: 0,
    top: 0,
    width: "5%",
    height: "100%",
    backgroundColor: "transparent",
    zIndex: 100,
  },
});
