import { colors } from "@/config/colors";
import { FONT_MEDIUM } from "@/config/constants";
import { scaledPixels } from "@/hooks/useScale";
import { PropsWithChildren, useCallback } from "react";
import {
  GestureResponderEvent,
  Platform,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

/**
 * Helper definitions
 */

// Button props definition
type ButtonProps = PressableProps &
  PropsWithChildren & {
    style?: StyleProp<ViewStyle>;
    invert?: boolean;
  };

// Animated component definition
const AnimatedPressable = Animated.createAnimatedComponent(TouchableOpacity);

/**
 * Button component
 */

export const Button = ({
  style,
  children,
  invert,
  onPress,
  ...props
}: ButtonProps) => {
  const backgroundColor = useSharedValue(invert ? "transparent" : colors.blue);
  const pulseTransparency = useSharedValue(1);

  const pressWrapper = useCallback(
    async (e: GestureResponderEvent) => {
      backgroundColor.value = withTiming(invert ? "transparent" : colors.sea, {
        duration: 200,
      });
      pulseTransparency.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 600 }),
          withTiming(1, { duration: 600 }),
        ),
        -1,
        true,
      );
      await onPress?.(e);
      pulseTransparency.value = withTiming(1, { duration: 300 });
      backgroundColor.value = withTiming(invert ? "transparent" : colors.blue, {
        duration: 200,
      });
    },
    [backgroundColor, invert, onPress, pulseTransparency],
  );

  const animatedBackground = useAnimatedStyle(() => ({
    backgroundColor: backgroundColor.value,
    opacity: pulseTransparency.value,
  }));

  // Special case - TV
  // - (Android TV, FireTV) Using Animated style directly on TouchableOpacity causes some problems with focusing after clicking the button
  //                        The code below is a workaround for the mentioned issue
  if (Platform.isTV) {
    return (
      // @ts-ignore
      <TouchableOpacity
        onPress={pressWrapper}
        {...props}
        style={{ width: "100%" }}
      >
        <Animated.View style={[styles.button, animatedBackground, style]}>
          <Text style={[styles.text, invert && styles.invertColor]}>
            {children}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    // @ts-ignore
    <AnimatedPressable
      style={[styles.button, animatedBackground, style]}
      onPress={pressWrapper}
      {...props}
    >
      <Text style={[styles.text, invert && styles.invertColor]}>
        {children}
      </Text>
    </AnimatedPressable>
  );
};

// Styles
const styles = StyleSheet.create({
  button: {
    paddingVertical: scaledPixels(20),
    paddingHorizontal: scaledPixels(18),
    borderRadius: scaledPixels(10),
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  invertColor: {
    color: colors.blue,
  },
  text: {
    color: colors.white,
    fontSize: scaledPixels(20),
    fontFamily: FONT_MEDIUM,
    textAlign: "center",
  },
});
