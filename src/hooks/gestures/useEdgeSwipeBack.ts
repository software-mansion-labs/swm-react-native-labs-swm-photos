import { useMemo } from "react";
import { Gesture, GestureUpdateEvent } from "react-native-gesture-handler";
import { GestureHandlerProps } from "./types";
import { PanGestureHandlerEventPayload } from "react-native-screens";
import { useScreenDimensions } from "@/providers/ScreenDimensionsProvider";
import { clamp, runOnJS, useSharedValue } from "react-native-reanimated";

/**
 * Helper definitions - edge swipa back handler props
 */
export type EdgeSwipeBackHandlerProps = GestureHandlerProps & {
  edgeWidth?: number; // A distance from left screen edge to qualify a gesture
  distanceThresholdFactor?: number; // A relative (0, 1] factor to scale screen width
  velocityThreshold?: number;
};

/**
 * Edge swipe back gesture hook
 *
 * Overrides swipe back gesture with custom callback functions. Only detected very near the screen edge.
 */
export const useEdgeSwipeBack = ({
  active = true,
  onBegin,
  onUpdate,
  onEnd,
  // Gesture-specific props
  edgeWidth = 30,
  distanceThresholdFactor = 0.3,
  velocityThreshold = 800,
}: EdgeSwipeBackHandlerProps) => {
  // Obtain screen dimension details
  const { dimensions } = useScreenDimensions();

  // Calculate additional properties based on screen dimensions
  const distanceThreshold = distanceThresholdFactor * dimensions.width;

  // Component state
  const startedFromEdge = useSharedValue(false);

  return useMemo(() => {
    // Early return optimization
    if (!active) return Gesture.Pinch().enabled(false);

    return Gesture.Pan()
      .onBegin((e: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
        const startX = (e && (e.x ?? (e as any).absoluteX)) ?? 0;
        startedFromEdge.value = startX <= edgeWidth;

        if (startedFromEdge.value && onBegin) runOnJS(onBegin)();
      })
      .onUpdate((e: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
        if (!startedFromEdge.value) return;

        const translationX = e.translationX ?? 0;
        const velocityX = (e as any).velocityX ?? 0;
        const progress = clamp(translationX / dimensions.width, 0, 1);

        onUpdate?.({ progress, translationX, velocityX });
      })
      .onEnd((e: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
        if (!startedFromEdge.value) return;

        const translationX = e.translationX ?? 0;
        const velocityX = (e as any).velocityX ?? 0;
        const progress = clamp(translationX / dimensions.width, 0, 1);
        const completed =
          translationX > distanceThreshold ||
          Math.abs(velocityX) > velocityThreshold;

        if (onEnd)
          runOnJS(onEnd)({ progress, translationX, velocityX, completed });

        startedFromEdge.value = false;
      })
      .onFinalize(() => {
        startedFromEdge.value = false;
      });
  }, [
    active,
    edgeWidth,
    velocityThreshold,
    onBegin,
    onUpdate,
    onEnd,
    startedFromEdge,
    dimensions,
    distanceThreshold,
  ]);
};
