import {
  clamp,
  runOnJS,
  SharedValue,
  useSharedValue,
} from "react-native-reanimated";
import { GestureHandlerProps } from "./types";
import { Point } from "../useScale";
import { Dimensions } from "@/providers/ScreenDimensionsProvider";
import { Gesture } from "react-native-gesture-handler";
import { useMemo } from "react";

/**
 * Helper definitions - multi zoom handler props
 */
export type MultiZoomHandlerProps = GestureHandlerProps & {
  // Required props to implement a proper zoom animation
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  scale: SharedValue<number>;

  // Other properties of the object being animated
  targetOrigin: Point;
  itemSize: Dimensions;
  screenSize: Dimensions;
};

/**
 * Multi pinch gesture hook
 *
 * Multi pinch is a composite gesture which accumulates the results of multiple pinch gestures on different origins.
 *
 * NOTE: We assume that the coordinate system is determined by top-left corner of the animated object bounds. All the calculations are relative to that point.
 */
export const useMultiZoom = ({
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
}: MultiZoomHandlerProps) => {
  // A switch point between pinch animation phases I & II
  const fitScale = Math.max(
    screenSize.width / itemSize.width,
    screenSize.height / itemSize.height,
  );

  // Define helper shared values
  const baseScale = useSharedValue(1); // An accumulated scale of the animated object, updated at the end of each of performed pinch gestures
  const duringScaling = useSharedValue(1); // A temporary scale value from previous frame (to calculate scale changes)
  const scaleOriginAbsolute = useSharedValue(targetOrigin); // An absolute origin (anywhere within the root container) - pinch phase I
  const scaleOriginClipped = useSharedValue(targetOrigin); // An origin within the shorter asis of symetry of the root container - pinch phase II

  return useMemo(() => {
    const middle = {
      x: targetOrigin.x + itemSize.width / 2,
      y: targetOrigin.y + itemSize.height / 2,
    };

    return Gesture.Pinch()
      .enabled(active)
      .onBegin((event) => {
        scaleOriginAbsolute.value = { x: event.focalX, y: event.focalY };
        scaleOriginClipped.value = {
          x: screenSize.width > screenSize.height ? middle.x : event.focalX,
          y: screenSize.height > screenSize.width ? middle.y : event.focalY,
        };

        baseScale.value = scale.value;
        duringScaling.value = 1;

        if (onBegin) runOnJS(onBegin)();
      })
      .onUpdate((event) => {
        const totalScale = baseScale.value * event.scale;

        if (totalScale < 1) {
          scale.value = 1;
          translateX.value = targetOrigin.x;
          translateY.value = targetOrigin.y;
          return;
        }

        // Select origin for either phase I or II
        const scaleOrigin =
          baseScale.value >= fitScale || totalScale >= fitScale
            ? scaleOriginAbsolute
            : scaleOriginClipped;
        const scaleDelta = event.scale / duringScaling.value;

        const dx =
          scaleOrigin.value.x - middle.x - (translateX.value - targetOrigin.x);
        const dy =
          scaleOrigin.value.y - middle.y - (translateY.value - targetOrigin.y);

        const tx = translateX.value - dx * (scaleDelta - 1);
        const ty = translateY.value - dy * (scaleDelta - 1);

        const dw = Math.max(
          (totalScale * itemSize.width - screenSize.width) / 2,
          0,
        );
        const dh = Math.max(
          (totalScale * itemSize.height - screenSize.height) / 2,
          0,
        );

        // Clamp the translation vector to not escape beyond the screen
        translateX.value = clamp(tx, targetOrigin.x - dw, targetOrigin.x + dw);
        translateY.value = clamp(ty, targetOrigin.y - dh, targetOrigin.y + dh);
        scale.value = totalScale;

        duringScaling.value = event.scale;

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
    baseScale,
    duringScaling,
    scaleOriginAbsolute,
    scaleOriginClipped,
    fitScale,
  ]);
};
