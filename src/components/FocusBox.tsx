import { colors } from "@/config/colors";
import { useEffect } from "react";
import { StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

/**
 * Helper definitions - focus box props
 */
export type FocusBoxProps = {
  focused: boolean; // Directly controls the animation state
  minSize: number; // Starting size of a box, before completing animation
  maxSize: number; // Target size of a box, after full animation completed
  style?: ViewStyle;
};

/**
 * FocusBox component
 *
 * An animated magnifier-like box. Absolutely positioned, requires positioning of parent component.
 */
export default function FocusBox({
  focused,
  minSize,
  maxSize,
  style,
}: FocusBoxProps) {
  // Animation state - shared value
  const offset = useSharedValue<number>(0);

  // Calculate offset based on given size range
  const maxOffset = (maxSize - minSize) / 2;

  // Component state update
  // - Each time focus state changes, we need to update the shared value to trigger animation
  useEffect(() => {
    offset.value = focused ? withSpring(maxOffset) : 0;
  }, [focused, maxOffset, offset]);

  // Animated style
  // - Note that the component is positioned absolute by default, so we can animate it easily with left and top props
  const animatedStyle = useAnimatedStyle(() => {
    return {
      top: -offset.value,
      left: -offset.value,
      width: minSize + 2 * offset.value,
      height: minSize + 2 * offset.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.box,
        { width: minSize, height: minSize, borderWidth: minSize * 0.045 },
        animatedStyle,
      ]}
    />
  );
}

// Styles
const styles = StyleSheet.create({
  box: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 2,
    borderColor: colors.blue,
  },
});
