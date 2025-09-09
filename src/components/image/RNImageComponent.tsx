import { memo } from "react";
import { Image as RNImage, StyleSheet } from "react-native";
import { ImageViewProps } from "./types";

export const RNImageComponent = memo(function RNImageComponent({
  uri,
  itemSize,
}: ImageViewProps) {
  return (
    <RNImage
      source={{ uri, cache: "reload" }}
      fadeDuration={0}
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
