import {
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from "react-native";
import { useState } from "react";
import { ImageViewProps } from "./types";
import { ImageComponent } from "./ImageComponent";
import FocusBox from "../FocusBox";

/**
 * FocusableImage component
 *
 * An image component with an additional, animated focus box.
 * Currently used exclusively on TV version of the app.
 */
export function FocusableImage({
  uri,
  itemSize,
  nextFocusUp,
  nextFocusDown,
  nextFocusLeft,
  nextFocusRight,
}: ImageViewProps & TouchableOpacityProps) {
  const [isFocused, setIsFocused] = useState<boolean>(false);

  return (
    <View style={styles.imageContainer}>
      <TouchableOpacity
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        nextFocusUp={nextFocusUp}
        nextFocusDown={nextFocusDown}
        nextFocusLeft={nextFocusLeft}
        nextFocusRight={nextFocusRight}
        activeOpacity={0.5}
      >
        <ImageComponent uri={uri} itemSize={itemSize} />
      </TouchableOpacity>
      {isFocused && (
        <FocusBox
          focused={isFocused}
          minSize={itemSize}
          maxSize={itemSize * 1.12}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    position: "relative",
  },
});
