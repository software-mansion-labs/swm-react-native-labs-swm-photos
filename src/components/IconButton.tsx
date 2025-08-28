import { colors } from "@/config/colors";
import {
  ImageSourcePropType,
  ImageStyle,
  Platform,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import { Image } from "expo-image";
import { scaledPixels } from "@/hooks/useScale";
import { useState } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

/**
 * Helper definitions - button props
 */
export type IconButtonProps = {
  onPress?: () => void;
  iconSource: ImageSourcePropType;
  animate?: boolean;
  style?: ViewStyle;
  iconStyle?: ImageStyle;
  ref?: any;
};

/**
 * IconButton component
 *
 * Creates a button-like icon based on TouchableOpacity component.
 * The button can be additionally animated (scaling on focus) when specyfing animate={true}.
 */
export function IconButton({
  onPress,
  iconSource,
  animate,
  style,
  iconStyle,
  ref,
}: IconButtonProps) {
  // Component state
  const [isFocused, setIsFocused] = useState(false);
  const scale = useSharedValue(1);

  // Component state handlers
  const handleFocus = () => {
    setIsFocused(true);
    if (animate) scale.value = withSpring(1.1, { stiffness: 300, damping: 10 });
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (animate) scale.value = withSpring(1, { stiffness: 300, damping: 10 });
  };

  // TV-specific styles to maintain consistent colors when focused
  const tvFocusOverride =
    Platform.isTV && isFocused
      ? {
          backgroundColor:
            style?.backgroundColor || styles.buttonContainer.backgroundColor,
        }
      : {};

  const tvIconOverride =
    Platform.isTV && isFocused
      ? {
          tintColor: iconStyle?.tintColor || styles.buttonIcon.tintColor,
        }
      : {};

  // Scale animation style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        ref={ref}
        focusable
        onPress={onPress}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={[styles.buttonContainer, style, tvFocusOverride]}
      >
        <Image
          source={iconSource}
          style={[styles.buttonIcon, iconStyle, tvIconOverride]}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

// Styles
const styles = StyleSheet.create({
  buttonContainer: {
    backgroundColor: colors.white,
    borderRadius: scaledPixels(26),
    alignItems: "center",
    justifyContent: "center",
    width: scaledPixels(52),
    height: scaledPixels(52),
    borderWidth: scaledPixels(3),
    borderColor: "transparent",
  },
  buttonIcon: {
    width: scaledPixels(52),
    height: scaledPixels(52),
    tintColor: colors.blue,
    filter:
      Platform.OS === "web"
        ? `invert(4%) sepia(100%) saturate(7000%) hue-rotate(220deg)`
        : undefined,
  },
});
