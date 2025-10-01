import { useEffect, useState } from "react";
import { ImageStyle } from "react-native";
import { SvgXml } from "react-native-svg";
import * as FileSystem from "expo-file-system";

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
 * For Vega, displaying .svg image with expo-image is not supported, so replacement is required.
 * In this case we read a .svg file as string and pass it to SvgXml component.
 * 
 * @param source Relative, Vega sandbox path to given .svg image, eg. /pkg/assets/svg/swmansion-logo.svg
 */
export const SvgImage = ({source, width, height, style}: SvgImageProps) => {
  const [svg, setSvg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Async loading of the svg file from given path
  useEffect(() => {
    setLoading(true);

    if (!source || typeof source !== "string") {
      setSvg(null);
			setLoading(false);
			return;
    }

    // An async wrapper
    const loadSvgContent = async (path: string) => {
      try {
        const content = await FileSystem.readAsStringAsync(path);

        setSvg(content);
        setLoading(false);
      } catch (e: any) {
        const err: Error = e instanceof Error ? e : new Error(String(e));
        logger.filesystem.error(`Failed to read SVG at path: ${path}`, err);

        setSvg(null);
        setLoading(false);
      }
    };

    loadSvgContent(source);
  }, [source])

  if (loading)
    return null;

  return (
    <SvgXml 
      xml={svg} 
      width={width} 
      height={height} 
      style={style} 
    />
  );
}