import { colors } from "@/config/colors";
import { scaledPixels } from "@/hooks/useScale";
import { useCachedPhotos } from "@/providers/CachedPhotosProvider";
import { useGalleryUISettings } from "@/providers/GalleryUISettingsProvider";
import { useScreenDimensions } from "@/providers/ScreenDimensionsProvider/ScreenDimensionsProvider";
import { Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { IconButton } from "./IconButton";
import { NavigationLink } from "./navigation/NavigationLink";
import { useFocusRefs } from "@/providers/FocusRefProvider";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useCallback, useRef, useState } from "react";
import { useFilteredPhotos } from "@/providers/FilteredPhotosProvider";
import { FONT_MEDIUM } from "@/config/constants";

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


const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);


/**
 * ImagesGalleryHeader component
 */
export const ImagesGalleryHeader = ({
  title = "Your photos",
  subtitle,
}: ImagesGalleryHeaderProps) => {
  // Screen size for some responsivness
  const screen = useScreenDimensions();

  // Local references
  const filterInputRef = useRef<TextInput>(null);
  // Global references
  const focusRefs = useFocusRefs();
  const settingsRef = focusRefs["settings"];

  // Photos data
  const { filteredPhotos, filteredPhotosLoadingState, query } = useFilteredPhotos();
  const { cachedPhotos, cachedPhotosLoadingState } = useCachedPhotos();
  const { galleryGap } = useGalleryUISettings();

  // Filter input state
  const [filterInput, setFilterInput] = useState("");

  /**
   * Shared values & animation definitions
   */

  const subheaderFirstPageOpacity = useSharedValue(1);

  const magnifierAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subheaderFirstPageOpacity.value,
    zIndex: Math.ceil(subheaderFirstPageOpacity.value)
  }));

  const searchInputAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - subheaderFirstPageOpacity.value,
    zIndex: Math.floor(1 - subheaderFirstPageOpacity.value)
  }));

  /**
   * Event handlers
   */

  const focusInput = useCallback(() => {
    filterInputRef.current?.focus();
  }, []);

  const handleMagnifierFocusGain = useCallback(() => {
    subheaderFirstPageOpacity.value = withTiming(0, { duration: 500 }, (finished) => {
      if (finished)
        runOnJS(focusInput)();
    });
  }, [subheaderFirstPageOpacity, filterInputRef]);

  const handleSearchInputFocusLoss = useCallback(async () => {
    subheaderFirstPageOpacity.value = withTiming(1, { duration: 500 });
    await query(filterInput);
  }, [subheaderFirstPageOpacity, filterInput]);

  /**
   * Subcomponents properties & styles
   */

  // Set up default subtitle text if no subtitle is explicitely define
  const usingFilteredItems = filteredPhotos.length !== cachedPhotos.length;
  const itemCountPhrase = usingFilteredItems ? `${filteredPhotos.length} out of ${cachedPhotos.length}` : `${filteredPhotos.length}`;
  const subtitleText = subtitle ?? `${itemCountPhrase} items in galery`

  // Compose styles based on the launch platform
  const headerStyle = {
    ...styles.header,
    ...{
      left: screen.dimensions.width * 0.05,
      right: screen.dimensions.width * 0.05,
      paddingHorizontal: galleryGap,
    },
  };

  return (
    <View style={headerStyle}>
      <View style={styles.headerBar}>
        <Text style={styles.headerText}>SWM Photos</Text>
        <NavigationLink href="/settings">
          <IconButton
            iconSource={require("@/assets/images/settings-icon.png")}
            size={scaledPixels(52)}
            animate={Platform.isTV}
            ref={settingsRef}
          />
        </NavigationLink>
        <View style={styles.searchBar} >
          <Animated.View
            focusable={false}
            style={magnifierAnimatedStyle}
          >
            <IconButton
              iconSource={require("@/assets/images/magnifying-glass-icon.png")}
              size={scaledPixels(44)}
              animate={Platform.isTV}
              onFocus={handleMagnifierFocusGain}
              style={magnifierAnimatedStyle}
            />
          </Animated.View>
          <AnimatedTextInput
            ref={filterInputRef}
            onChangeText={setFilterInput} // Update text in state on change
            onBlur={handleSearchInputFocusLoss}
            value={filterInput}
            placeholder="Search..."
            placeholderTextColor={colors.blue}
            style={[
              styles.searchInput,
              searchInputAnimatedStyle
            ]}
          />
        </View>
      </View>
      {filteredPhotosLoadingState === "COMPLETED" && (
        <Text style={styles.headerSubtitle}>{subtitleText}</Text>
      )}
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
    height: scaledPixels(90),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "transparent",
  },
  headerTextContainer: {
    flex: 1,
  },
  headerBar: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: scaledPixels(20),
  },
  headerText: {
    color: colors.blue,
    fontSize: scaledPixels(40),
    fontWeight: "600",
  },
  headerSubtitle: {
    color: colors.blue,
    fontSize: scaledPixels(20),
  },
  searchBar: {
    position: "relative",
    justifyContent: "center",
  },
  searchInput: {
    width: 100,
    position: "absolute",
    color: colors.blue,
    fontFamily: FONT_MEDIUM,
    fontSize: scaledPixels(28),
    backgroundColor: "rgba(255,255,255,0.08)",
  }
});
