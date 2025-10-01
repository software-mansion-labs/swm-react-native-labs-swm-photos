import { Image } from "expo-image";
import { ImageStyle } from "react-native";

/**
 * Helper definitions - SVG image props type
 */
export type SvgImageProps = {
  source: any;    
  width: number;
  height: number;
  style?: ImageStyle;
};

/**
 * **SvgImage component**
 * 
 * In this version we simply utilize expo-image capabilities to display a .svg image
 * 
 * @param source A module identifier (obtained with require()) for given .svg image
 */
export const SvgImage = ({source, width, height, style}: SvgImageProps) => {
  return (
    <Image 
      source={source}
      style={[{ width, height }, style]}
      contentFit="contain"
    />
  );
}