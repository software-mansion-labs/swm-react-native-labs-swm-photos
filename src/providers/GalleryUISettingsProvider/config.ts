import { Dimensions, Platform } from "react-native";

// Static window size
const window = Dimensions.get("window");
const maxDim = Math.max(window.width, window.height);
const minDim = Math.min(window.width, window.height);

/**
 * Predefined available settings
 */

export const availableGalleryGaps = [1, 2, 4, 8, 12] as const;

export const availableColumnCountsPortrait: readonly number[] = [
  1, 2, 4, 5, 8,
] as const;
export const availableColumnCountsLandscape: readonly number[] =
  Platform.isTV || Platform.OS === "web"
    ? availableColumnCountsPortrait
    : availableColumnCountsPortrait.map(
        // Note that the platform might be landscape by default, so it is more safe to use min() and max() here
        (cnt: number) => Math.floor((cnt * maxDim) / minDim),
      );

export const availableOffscreenDrawDistanceWindowSizes = [
  0.25, 0.5, 1, 2, 3, 5, 10,
] as const;

/**
 * Initial gallery settings
 */

export const INITIAL_GALLERY_SETTINGS = {
  galleryGap: availableGalleryGaps[2],

  numberOfColumns: availableColumnCountsPortrait[3],

  // On TVs, scrolling the gallery with remote contoller is generally slower compared to mobile devices
  offscreenDrawDistanceWindowSize: Platform.isTV
    ? availableOffscreenDrawDistanceWindowSizes[4]
    : availableOffscreenDrawDistanceWindowSizes[5],
};
