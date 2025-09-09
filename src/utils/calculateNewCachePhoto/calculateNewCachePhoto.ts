/**
 * This function does the actual cache calculation for a given photo.
 * It's limited to {@link CACHE_CALCULATION_PARALLELISM_LIMIT} photos at a time.
 */

import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import pLimit from "p-limit";
import { PixelRatio } from "react-native";

export const calculateNewCachePhoto = async (
  photoUri: string,
  mipmapWidth: number,
) => {
  return cacheCalculationLimiter(async () => {
    const manipulatorContext = ImageManipulator.manipulate(photoUri);
    manipulatorContext.resize({
      /**
       * {@link ImageManipulator.resize} expects the width in pixels (px) and not layout size (dp).
       */
      width: PixelRatio.getPixelSizeForLayoutSize(mipmapWidth),
    });

    const optimizedImage = await manipulatorContext.renderAsync();
    const result = await optimizedImage.saveAsync({
      format: SaveFormat.JPEG,
      compress: 0.8,
    });
    optimizedImage.release();

    return result;
  });
};

/**
 * Determines how many jobs will be executed in parallel.
 */
const CACHE_CALCULATION_PARALLELISM_LIMIT = 30;

/**
 * Limiter instance for cache calculations
 */
const cacheCalculationLimiter = pLimit(CACHE_CALCULATION_PARALLELISM_LIMIT);
