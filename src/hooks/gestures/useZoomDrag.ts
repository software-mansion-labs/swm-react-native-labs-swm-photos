import {
  clamp,
  runOnJS,
  SharedValue,
  useSharedValue,
} from "react-native-reanimated";
import { GestureHandlerProps } from "./types";
import { Point } from "../useScale";
import { useMemo } from "react";
import { Gesture } from "react-native-gesture-handler";
import { Dimensions } from "@/providers/ScreenDimensionsProvider";

/**
 * Helper definitions - zoom drag handler props
 */
export type ZoomDragHandlerProps = GestureHandlerProps & {
  // Required props to implement a proper zoom drag animation
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  scale: SharedValue<number>;

  // Other properties of the object being animated
  targetOrigin: Point;
  itemSize: Dimensions;
  screenSize: Dimensions;
};

/**
 * Zoom drag gesture hook
 *
 * It's a classic pan gesture, but performed on zoomed object (see multi zoom gesture)
 */
export const useZoomDrag = ({
  active,
  translateX,
  translateY,
  scale,
  targetOrigin,
  itemSize,
  screenSize,
  onBegin,
  onUpdate,
  onEnd,
}: ZoomDragHandlerProps) => {
  // Helper shared values
  const ptX = useSharedValue(0); // Current pan gesture translations
  const ptY = useSharedValue(0);

  return useMemo(() => {
    return Gesture.Pan()
      .enabled(active)
      .onBegin(() => {
        ptX.value = 0;
        ptY.value = 0;

        if (onBegin) runOnJS(onBegin)();
      })
      .onUpdate((event) => {
        const xDiff = event.translationX - ptX.value;
        const yDiff = event.translationY - ptY.value;

        const dw = Math.max(
          (scale.value * itemSize.width - screenSize.width) / 2,
          0,
        );
        const dh = Math.max(
          (scale.value * itemSize.height - screenSize.height) / 2,
          0,
        );

        // Clamp the translation vector to not escape beyond the screen
        translateX.value = clamp(
          translateX.value + xDiff,
          targetOrigin.x - dw,
          targetOrigin.x + dw,
        );
        translateY.value = clamp(
          translateY.value + yDiff,
          targetOrigin.y - dh,
          targetOrigin.y + dh,
        );

        ptX.value = event.translationX;
        ptY.value = event.translationY;

        onUpdate?.(event);
      })
      .onEnd(() => {
        if (onEnd) runOnJS(onEnd)();
      });
  }, [
    active,
    targetOrigin,
    itemSize,
    screenSize,
    onBegin,
    onUpdate,
    onEnd,
    translateX,
    translateY,
    scale,
    ptX,
    ptY,
  ]);
};
