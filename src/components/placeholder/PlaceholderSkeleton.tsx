import SwmPattern from "@/assets/swm-pattern";
import { colors } from "@/config/colors";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, Rect } from "react-native-svg";
import { PlaceholderProps } from "./types";
import { scaledPixels } from "@/hooks/useScale";

const MARGIN = 1;

type PlaceholderSkeletonProps = PlaceholderProps & {
  index: number;
};

export const PlaceholderSkeleton = ({
  size,
  index,
}: PlaceholderSkeletonProps) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      150 * index,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: 750 }),
          withTiming(0.3, { duration: 750 }),
        ),
        -1,
        true,
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        containerStyle,
        {
          width: size - MARGIN * 2,
          height: size - MARGIN * 2,
        },
      ]}
    >
      <Svg width="100%" height="100%" viewBox="0 0 600 600">
        <Defs>
          <SwmPattern color={colors.blue} />
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#swmpattern)" />
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.blue,
    borderRadius: scaledPixels(4),
    margin: MARGIN,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});
