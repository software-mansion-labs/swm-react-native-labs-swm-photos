import { colors } from "@/config/colors";
import { FONT_MEDIUM, FONT_REGULAR, IS_WIDE_SCREEN } from "@/config/constants";
import { scaledPixels } from "@/hooks/useScale";
import { useCachedPhotos, Cache } from "@/providers/CachedPhotosProvider";
import { useGalleryUISettings } from "@/providers/GalleryUISettingsProvider";
import { useScreenDimensions } from "@/providers/ScreenDimensionsProvider/ScreenDimensionsProvider";
import { Link } from "expo-router";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Loader, LoaderPlaceholder } from "./Loader";
import { IconButton } from "./IconButton";
import { useFocusRefs } from "@/providers/FocusRefProvider";

/**
 * Helper definitions - gallery header props
 */
export type ImagesGalleryHeaderProps = {
  /**
   * Main text on the header
   * @default "Your photos"
   */
  title?: string;
  /**
   * Subtext on the header
   * @default `{cachedPhotos.length} items`
   */
  subtitle?: string;
};

/**
 * ImagesGalleryHeader component
 */
export const ImagesGalleryHeader = ({
  title = "Your photos",
  subtitle,
}: ImagesGalleryHeaderProps) => {
  // Screen size for some responsivness
  const screen = useScreenDimensions();
  const focusRefs = useFocusRefs();

  // Dependencies - photos cache state (for number of loaded items in subtitle text) & gallery settings
  const { cachedPhotos, cachedPhotosLoadingState } = useCachedPhotos();
  const { galleryGap } = useGalleryUISettings();

  // Set up default subtitle text if no subtitle is explicitely define
  const subtitleText =
    subtitle ??
    (IS_WIDE_SCREEN
      ? `${cachedPhotos.length} items in galery`
      : `${cachedPhotos.length} items`);

  // Compose styles based on the launch platform
  const headerStyle = {
    ...styles.header,
    ...(IS_WIDE_SCREEN ? styles.headerWideScreen : styles.headerMobile),
    ...(IS_WIDE_SCREEN && {
      left: screen.dimensions.width * 0.05,
      right: screen.dimensions.width * 0.05,
      paddingHorizontal: galleryGap,
    }),
  };

  // Wide screen version - for both TV & web
  if (IS_WIDE_SCREEN) {
    return (
      <View style={headerStyle}>
        <View style={styles.headerBarWideScreen}>
          <Text style={styles.headerTextWideScreen}>SWM Photos</Text>
          <Link href="/settings" asChild>
            <IconButton
              iconSource={require("@/assets/images/settings-icon.png")}
              animate={Platform.isTV}
              ref={focusRefs["settings"]}
            />
          </Link>
        </View>
        {Cache.isCompleted(cachedPhotosLoadingState) && (
          <Text style={styles.headerSubtitleWideScreen}>{subtitleText}</Text>
        )}
      </View>
    );
  }

  return (
    <View style={headerStyle}>
      <View style={styles.headerTextContainer}>
        <Text style={styles.headerTextMobile}>{title}</Text>
        <Text style={styles.headerSubtitleMobile}>{subtitleText}</Text>
      </View>
      {Cache.isLoading(cachedPhotosLoadingState) ? (
        <Loader />
      ) : (
        <LoaderPlaceholder />
      )}
      <Link href="/settings" asChild>
        <IconButton
          iconSource={require("@/assets/images/settings-icon.png")}
          style={styles.settingsButtonMobile}
          iconStyle={styles.settingsButtonIconMobile}
        />
      </Link>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  headerMobile: {
    backgroundColor: colors.blue,
    padding: scaledPixels(16),
    borderBottomLeftRadius: scaledPixels(16),
    borderBottomRightRadius: scaledPixels(16),
    justifyContent: "flex-start",
    gap: scaledPixels(16),
  },
  headerWideScreen: {
    height: scaledPixels(90),
    justifyContent: "space-between",
    backgroundColor: "transparent",
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTextMobile: {
    color: colors.white,
    fontFamily: FONT_MEDIUM,
    fontSize: scaledPixels(30),
    lineHeight: scaledPixels(36),
    marginBottom: scaledPixels(8),
  },
  headerSubtitleMobile: {
    color: colors.white,
    fontFamily: FONT_REGULAR,
    fontSize: scaledPixels(16),
    lineHeight: scaledPixels(24),
  },
  headerBarWideScreen: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: scaledPixels(20),
  },
  headerTextWideScreen: {
    color: colors.blue,
    fontSize: scaledPixels(40),
    fontWeight: "600",
  },
  headerSubtitleWideScreen: {
    color: colors.blue,
    fontSize: scaledPixels(20),
  },
  settingsButtonMobile: {
    backgroundColor: colors.blue,
  },
  settingsButtonIconMobile: {
    tintColor: colors.white,
  },
});
