import { Image as ExpoImage } from "expo-image";
import { Point } from "@/hooks/useScale";
import { Dimensions } from "@/providers/ScreenDimensionsProvider";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useMultiZoom } from "@/hooks/gestures/useMultiZoom";
import { useZoomDrag } from "@/hooks/gestures/useZoomDrag";
import { useDoubleTap } from "@/hooks/gestures/useDoubleTap";
import { BinaryLRTState } from "@/controller/states";

/**
 * Helper definitions - photo preview props
 */

export type PhotoPreviewProps = {
  visible: boolean;
  state: BinaryLRTState;
  size: Dimensions;
  uri: string;
  origin: Point; // Only relevant if visible is true
  photoStartSize: number; // Only relevant if visible is true
  timing?: { duration: number }; // [ms]
};

/**
 * Helper definitions - animated touchable opacity component
 */
const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

/**
 * PhotoPreview component
 *
 * An animated
 */
export const PhotoPreview = ({
  visible,
  state,
  size,
  uri,
  origin,
  photoStartSize,
  timing = { duration: 500 },
}: PhotoPreviewProps) => {
  // State related properties
  const shouldAnimateBegin = visible && state === "ACTIVATING";
  const isActiveOrActivating = state === "ACTIVATING" || state === "ACTIVE";

  // Calculate target image layout properties
  const targetSize = Math.min(size.width * 0.95, size.height);
  const targetOrigin = useMemo(
    () => ({
      x: (size.width - targetSize) / 2,
      y: (size.height - targetSize) / 2,
    }),
    [size.width, size.height, targetSize],
  );
  const startOpacity = Platform.isTV && shouldAnimateBegin ? 0 : 1;
  const targetOpacity = isActiveOrActivating ? 1 : 0;

  const originDiff = (targetSize - photoStartSize) / 2;
  const photoOpacityDelay = (timing.duration * 2) / 5;

  // Animation shared values - photo animation
  const scale = useSharedValue(
    shouldAnimateBegin ? photoStartSize / targetSize : 1,
  );
  const translateX = useSharedValue(
    shouldAnimateBegin ? origin.x - originDiff : targetOrigin.x,
  );
  const translateY = useSharedValue(
    shouldAnimateBegin ? origin.y - originDiff : targetOrigin.y,
  );
  const photoOpacity = useSharedValue(shouldAnimateBegin ? startOpacity : 1);

  // Animation definitions - photo animation
  const photoAnimatedStyle = useAnimatedStyle(() => ({
    width: targetSize,
    height: targetSize,
    opacity: photoOpacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  /**
   * Gesture handling - pinch
   */

  // Helper function - handle onEnd event within the zoom gesture
  const handleZoomEnd = useCallback(() => {
    setDragActive(scale.value > DRAG_SCALE_TRESHOLD);
    setDoubleTapActive(scale.value > 1);
  }, [scale]);

  // Gesture definition
  const zoom = useMultiZoom({
    active: true,
    translateX,
    translateY,
    scale,
    targetOrigin,
    itemSize: { width: targetSize, height: targetSize },
    screenSize: size,
    onEnd: handleZoomEnd,
  });

  /**
   * Gesture handling - pan
   */

  const [dragActive, setDragActive] = useState<boolean>(false); // Can only be changed at the end of the zoom gesture
  const DRAG_SCALE_TRESHOLD = 1.2; // The drag gesture becomes active after scale reaches this value

  // Gesture definition
  const drag = useZoomDrag({
    active: dragActive,
    translateX,
    translateY,
    scale,
    targetOrigin,
    itemSize: { width: targetSize, height: targetSize },
    screenSize: size,
  });

  /**
   * Gesture handling - double tap (to reset the photo preview)
   */

  const [doubleTapActive, setDoubleTapActive] = useState<boolean>(false);

  // Helper function - handle double tap events
  const handleDoubleTap = useCallback(() => {
    // Animations properties
    const duration = Math.min(100 * scale.value, 500);
    const easing = Easing.sin;

    // Reset photo preview back to the original size & positioning - with some animations
    translateX.value = withTiming(targetOrigin.x, { duration, easing });
    translateY.value = withTiming(targetOrigin.y, { duration, easing });
    scale.value = withTiming(1, { duration, easing });

    setDoubleTapActive(false);
    setDragActive(false);
  }, [scale, translateX, translateY, targetOrigin]);

  // Gesture definition
  const doubleTap = useDoubleTap({
    active: doubleTapActive,
    maxDelay: 250,
    maxDistance: 40,
    onBegin: handleDoubleTap,
  });

  /**
   * Gesture handling - gesture compositions
   */

  const composed = Gesture.Simultaneous(zoom, drag, doubleTap);

  /**
   * State-dependant animation update
   */

  // State-related updates
  // - Activates the begin/end animations
  useEffect(() => {
    // Extra bit of optimization
    if (!visible) return;

    // Calculate target values
    const targetScale = isActiveOrActivating ? 1 : photoStartSize / targetSize;
    const targetTx = isActiveOrActivating
      ? targetOrigin.x
      : origin.x - originDiff;
    const targetTy = isActiveOrActivating
      ? targetOrigin.y
      : origin.y - originDiff;

    // Apply transitions
    translateX.value = withTiming(targetTx, timing);
    translateY.value = withTiming(targetTy, timing);
    scale.value = withTiming(targetScale, timing);
    if (!isActiveOrActivating)
      photoOpacity.value = withDelay(
        photoOpacityDelay,
        withTiming(targetOpacity, {
          duration: timing.duration - photoOpacityDelay,
        }),
      );
    else
      photoOpacity.value = withTiming(targetOpacity, {
        duration: timing.duration - photoOpacityDelay,
      });
  }, [
    visible,
    isActiveOrActivating,
    photoStartSize,
    targetSize,
    targetOrigin,
    origin,
    originDiff,
    translateX,
    translateY,
    scale,
    photoOpacity,
    photoOpacityDelay,
    targetOpacity,
    timing,
  ]);

  // Note that AnimatedTouchableOpacity's size is determined by photoAnimatedStyle, with targetSize as a default
  return (
    <GestureDetector gesture={composed}>
      <View style={{ ...size, overflow: "hidden" }}>
        <AnimatedTouchableOpacity
          activeOpacity={1.0}
          style={[photoAnimatedStyle]}
        >
          <ExpoImage
            source={uri}
            decodeFormat="rgb"
            transition={0}
            priority={visible ? "high" : "normal"}
            style={styles.photo}
          />
        </AnimatedTouchableOpacity>
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  photo: {
    width: "100%",
    height: "100%",
  },
});
