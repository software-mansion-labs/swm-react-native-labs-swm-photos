import { useMeasureImageLoadTime } from "@/utils/useMeasureImageLoadTime";
import { Image as ExpoImage } from "expo-image";
import { memo } from "react";
import { StyleSheet } from "react-native";
import { ImageViewProps } from "./types";

export const ExpoImageComponent = memo(function ExpoImageComponent({
  uri,
  itemSize,
}: ImageViewProps) {
  const { onLoadEnd, onLoadStart } = useMeasureImageLoadTime("ExpoImage");

  return (
    <ExpoImage
      source={{ uri }}
      decodeFormat="rgb"
      // Disable caching to have reproducible results
      cachePolicy="none"
      recyclingKey={uri}
      transition={0}
      style={[styles.image, { width: itemSize, height: itemSize }]}
      onLoadStart={onLoadStart}
      onLoadEnd={onLoadEnd}
    />
  );
});

const styles = StyleSheet.create({
  image: {
    borderWidth: 1,
    borderColor: "grey",
  },
});
