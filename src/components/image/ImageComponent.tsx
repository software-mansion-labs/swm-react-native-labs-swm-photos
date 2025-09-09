import { ExpoImageComponent } from "./ExpoImageComponent";
import { RNImageComponent } from "./RNImageComponent";
import { ImageViewProps } from "./types";
import { IMAGE_NATIVE_PRESET } from "@/config/config";

/**
 * ImageComponent
 *
 * A simple proxy component which renders either ExpoImageComponent or RNImageComponent, depending on the configuration
 */

export function ImageComponent({ uri, itemSize }: ImageViewProps) {
  const Image =
    IMAGE_NATIVE_PRESET === "expo" ? ExpoImageComponent : RNImageComponent;

  return <Image uri={uri} itemSize={itemSize} />;
}
