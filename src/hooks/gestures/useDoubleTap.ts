import { useMemo } from "react";
import { GestureHandlerProps } from "./types";
import { Gesture, MouseButton } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";

/**
 * Helper definitions - double tap handler props
 *
 * See {@link https://docs.swmansion.com/react-native-gesture-handler/docs/gestures/tap-gesture | gesture handler docs}
 * for the examplanation of individual props.
 */
export type DoubleTapHandlerProps = Pick<
  GestureHandlerProps,
  "active" | "onBegin"
> & {
  maxDuration?: number;
  maxDelay?: number;
  maxDistance?: number;
};

/**
 * Double tap gesture hook
 *
 * It's a tap gesture which activates after 2 separate taps within the short range of time.
 * The effect executes on JS thread within the onStart() callback.
 */
export const useDoubleTap = ({
  active,
  maxDuration = 500,
  maxDelay = 500,
  maxDistance = 36,
  onBegin,
}: DoubleTapHandlerProps) => {
  return useMemo(
    () =>
      Gesture.Tap()
        .enabled(active)
        .numberOfTaps(2)
        .maxDuration(maxDuration)
        .maxDelay(maxDelay)
        .maxDistance(maxDistance)
        .mouseButton(MouseButton.LEFT)
        .onStart(() => {
          if (onBegin) runOnJS(onBegin)();
        }),
    [active, maxDuration, maxDelay, onBegin, maxDistance],
  );
};
