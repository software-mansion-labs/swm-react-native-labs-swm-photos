/**
 * This function performs cache calculation (resize + encode) for a given photo.
 * Uses legacy manipulateAsync API (expo-image-manipulator <= 11.6.0).
 * Limited to {@link CACHE_CALCULATION_PARALLELISM_LIMIT} concurrent photos.
 */
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import pLimit from "p-limit";
import { PixelRatio } from "react-native";

export const calculateNewCachePhoto = async (
  photoUri: string,
  mipmapWidth: number,
) => {
  return cacheCalculationLimiter(async () => {
    const pixelWidth = PixelRatio.getPixelSizeForLayoutSize(mipmapWidth);
    const result = await manipulateAsync(
      photoUri,
      [
        {
          resize: { width: pixelWidth },
        },
      ],
      {
        format: SaveFormat.JPEG,
        compress: 0.8,
      },
    );
    // result has shape { uri, width?, height? }
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
