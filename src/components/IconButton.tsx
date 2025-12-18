import { colors } from "@/config/colors";
import {
  ImageSourcePropType,
  ImageStyle,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { Image } from "expo-image";
import { scaledPixels } from "@/hooks/useScale";
import React, { useCallback, useState } from "react";
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
  onFocus?: () => void;
  onBlur?: () => void;
  iconSource: ImageSourcePropType;
  size: number;
  animate?: boolean;
  style?: ViewStyle;
  iconStyle?: ImageStyle;
};

/**
 * IconButton component
 *
 * Creates a button-like icon based on TouchableOpacity component.
 * The button can be additionally animated (scaling on focus) when specyfing animate={true}.
 *
 * We use forwardRef to allow passing the references to the button inner container
 */
export const IconButton = React.forwardRef<View, IconButtonProps>(
  function IconButton(
    { onPress, onFocus, onBlur, iconSource, size, animate, style, iconStyle}: IconButtonProps,
     ref: React.ForwardedRef<View>,
  ) {
  // Component state
  const [isFocused, setIsFocused] = useState(false);
  const scale = useSharedValue(1);

  // Component state handlers
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (animate) scale.value = withSpring(1.25, { stiffness: 300, damping: 10 });

    onFocus?.();
  }, [scale, onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    if (animate) scale.value = withSpring(1, { stiffness: 300, damping: 10 });

    onBlur?.();
  }, [scale, onBlur]);

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
        onPress={onPress}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={[
          styles.buttonContainer,
          { width: size, height: size, borderRadius: size / 2 },
          style, 
          tvFocusOverride,
        ]}
      >
        <Image
          source={iconSource}
          style={[
            styles.buttonIcon, 
            { width: size, height: size },
            iconStyle, 
            tvIconOverride,
          ]}
        />
      </TouchableOpacity>
    </Animated.View>
  );
});

// Styles
const styles = StyleSheet.create({
  buttonContainer: {
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: scaledPixels(3),
    borderColor: "transparent",
  },
  buttonIcon: {
    tintColor: colors.blue,
    filter:
      Platform.OS === "web"
        ? `invert(4%) sepia(100%) saturate(7000%) hue-rotate(220deg)`
        : undefined,
  },
});
