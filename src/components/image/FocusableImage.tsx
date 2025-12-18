import {
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from "react-native";
import { forwardRef, useState } from "react";
import { ImageViewProps } from "./types";
import { FocusBox } from "../FocusBox";
import { Image } from "./Image";

/**
 * Helper definitions - focusable image props
 */
type FocusableImageProps = ImageViewProps &
  TouchableOpacityProps & {
    disableFocusEffect?: boolean;
  };

/**
 * FocusableImage component
 *
 * An image component with an additional, animated focus box.
 * Currently used exclusively on TV version of the app.
 */
export const FocusableImage = forwardRef<View, FocusableImageProps>(
  function FocusableImage(
    {
      uri,
      itemSize,
      nextFocusUp,
      nextFocusDown,
      nextFocusLeft,
      nextFocusRight,
      onPress,
      disableFocusEffect = false,
      style,
    }: FocusableImageProps,
    ref,
  ) {
    const [isFocused, setIsFocused] = useState<boolean>(false);

    return (
      <View style={styles.imageContainer}>
        <TouchableOpacity
          ref={ref}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          nextFocusUp={nextFocusUp}
          nextFocusDown={nextFocusDown}
          nextFocusLeft={nextFocusLeft}
          nextFocusRight={nextFocusRight}
          onPress={onPress}
          activeOpacity={disableFocusEffect ? 1.0 : 0.5}
          style={style}
        >
          <Image uri={uri} itemSize={itemSize} />
        </TouchableOpacity>
        {isFocused && !disableFocusEffect && (
          <FocusBox
            focused={isFocused}
            minSize={itemSize}
            maxSize={itemSize * 1.12}
          />
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  imageContainer: {
    position: "relative",
  },
});
