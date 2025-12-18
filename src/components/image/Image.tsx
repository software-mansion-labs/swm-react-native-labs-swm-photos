import { Image as ExpoImage } from "expo-image";
import { memo } from "react";
import { StyleSheet } from "react-native";
import { ImageViewProps } from "./types";

/**
 * Image component
 *
 * A wrapper class for ExpoImage providing additional optimization
 */
export const Image = memo(function ExpoImageComponent({
  uri,
  itemSize,
}: ImageViewProps) {
  return (
    <ExpoImage
      source={{ uri }}
      decodeFormat="rgb"
      recyclingKey={uri}
      transition={0}
      style={[styles.image, { width: itemSize, height: itemSize }]}
    />
  );
});

const styles = StyleSheet.create({
  image: {
    borderWidth: 1,
    borderColor: "grey",
  },
});
