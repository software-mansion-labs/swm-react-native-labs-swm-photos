import Constants from "expo-constants";
import { Platform } from "react-native";

// Build constants
export const BUILD_TYPE: "dev" | "release" =
  Constants.expoConfig!.extra!.buildType;
export const BUILD_ID_KEY = "swm_photos_gallery_build_id";
export const BUILD_ID: string = Constants.expoConfig!.extra!.buildId;

export const SWMANSION_URL = "https://swmansion.com";

// Platform-dependable constants
export const IS_WIDE_SCREEN = (Platform.isTV ||
  Platform.OS === "web") as boolean;

// Other UI constants
export const FONT_REGULAR =
  Platform.OS === "web" ? undefined : "Aeonik-Regular";
export const FONT_MEDIUM = Platform.OS === "web" ? undefined : "Aeonik-Medium";
export const FONT_BOLD = Platform.OS === "web" ? undefined : "Aeonik-Bold";
