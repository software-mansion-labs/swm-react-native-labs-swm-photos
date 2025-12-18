import { colors } from "@/config/colors";
import { FONT_MEDIUM, FONT_REGULAR } from "@/config/constants";
import { scaledPixels } from "@/hooks/useScale";
import { useCachedPhotos, Cache } from "@/providers/CachedPhotosProvider";
import { useScreenDimensions } from "@/providers/ScreenDimensionsProvider/ScreenDimensionsProvider";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { Loader } from "./Loader";
import { IconButton } from "./IconButton";
import { NavigationLink } from "./navigation/NavigationLink";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useCallback, useRef, useState } from "react";
import { useFilteredPhotos } from "@/providers/FilteredPhotosProvider";

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

  // Local references
  const filterInputRef = useRef<TextInput>(null);

  // Photos data
  const { filteredPhotos, filteredPhotosLoadingState, query } = useFilteredPhotos();
  const { cachedPhotos, cachedPhotosLoadingState } = useCachedPhotos();

  // Filter input state
  const [filterInput, setFilterInput] = useState("");

  /**
   * Shared values & animation definitions
   */

  // First page opacity O is equal to this shared value, hovewer - the second page (after hitting magnifying glass icon) equals (1 - O)
  const subheaderFirstPageOpacity = useSharedValue(1);

  const subheaderFirstPageStyle = useAnimatedStyle(() => ({
    opacity: subheaderFirstPageOpacity.value,
    zIndex: Math.round(subheaderFirstPageOpacity.value)
  }));

  const headerSecondPageStyle = useAnimatedStyle(() => ({
    opacity: 1 - subheaderFirstPageOpacity.value,
    zIndex: Math.round(1 - subheaderFirstPageOpacity.value)
  }));

  /**
   * Event handlers
   */

  const handleMagnifierClick = useCallback(() => {
    subheaderFirstPageOpacity.value = withTiming(0, { duration: 350, });
  }, [subheaderFirstPageOpacity]);

  const handleBackButtonClick = useCallback(() => {
    filterInputRef.current?.blur();   // Reset the focus to hide native elements such as keyboard
    subheaderFirstPageOpacity.value = withTiming(1, { duration: 350 });
  }, [subheaderFirstPageOpacity]);

  const handleClearInput = useCallback(() => {
    setFilterInput("");

    // Keep the input focused after clearing for quick further input
    filterInputRef.current?.focus();
  }, [setFilterInput]);

  // We apply the input query exactly at the time the input focus is lost
  const handleInputFocusLoss = useCallback(async () => {
    await query(filterInput);
  }, [query, filterInput]);

  /**
   * Subcomponents properties & styles
   */

  // Set up default subtitle text if no subtitle is explicitely define
  const usingFilteredItems = filteredPhotos.length !== cachedPhotos.length;
  const itemCountPhrase = usingFilteredItems ? `${filteredPhotos.length} out of ${cachedPhotos.length}` : `${filteredPhotos.length}`;
  const subtitleText = `${itemCountPhrase} items`;

  return (
    <View style={styles.header}>
      <Animated.View style={[styles.subheader, subheaderFirstPageStyle]}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerText}>{title}</Text>
          <Text style={styles.headerSubtitle}>{subtitleText}</Text>
        </View>
        {Cache.isLoading(cachedPhotosLoadingState) || filteredPhotosLoadingState === "CALCULATING_EMBEDDINGS" ? (
          <Loader />
        ) : (
          <IconButton
            iconSource={require("@/assets/images/magnifying-glass-icon.png")}
            size={scaledPixels(42)}
            style={styles.button}
            iconStyle={styles.buttonIcon}
            onPress={handleMagnifierClick}
          />
        )}
        <NavigationLink href="/settings">
          <IconButton
            iconSource={require("@/assets/images/settings-icon.png")}
            size={scaledPixels(52)}
            style={styles.button}
            iconStyle={styles.buttonIcon}
          />
        </NavigationLink>
      </Animated.View>
      <Animated.View
        style={[styles.subheader, styles.subheaderSecondPage, headerSecondPageStyle]}
      >
        <IconButton
          iconSource={require("@/assets/images/back-icon.png")}
          size={scaledPixels(36)}
          style={styles.button}
          iconStyle={styles.buttonIcon}
          onPress={handleBackButtonClick}
        />
        <View style={styles.searchInputWrapper}>
          <TextInput
            ref={filterInputRef}
            onChangeText={setFilterInput} // Update text in state on change
            onBlur={handleInputFocusLoss}
            value={filterInput}
            placeholder="Search..."
            placeholderTextColor={colors.white}
            style={[
              styles.searchInput,
              { width: screen.dimensions.width - scaledPixels(92) },
            ]}
          />
          {filterInput.length > 0 && (
            <View style={styles.clearIconButton}>
              <IconButton
                iconSource={require("@/assets/images/close-icon.png")}
                size={scaledPixels(32)}
                style={{ backgroundColor: "transparent" }}
                iconStyle={styles.buttonIcon}
                onPress={handleClearInput}
              />
            </View>
          )}
        </View>
      </Animated.View>
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
    backgroundColor: colors.blue,
    padding: scaledPixels(16),
    borderBottomLeftRadius: scaledPixels(16),
    borderBottomRightRadius: scaledPixels(16),
  },
  subheader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: scaledPixels(16),
  },
  subheaderSecondPage: {
    position: "absolute",
    left: scaledPixels(16),
    top: scaledPixels(16)
  },
  headerTextContainer: {
    flex: 1,
  },
  headerText: {
    color: colors.white,
    fontFamily: FONT_MEDIUM,
    fontSize: scaledPixels(30),
    lineHeight: scaledPixels(36),
    marginBottom: scaledPixels(8),
  },
  headerSubtitle: {
    color: colors.white,
    fontFamily: FONT_REGULAR,
    fontSize: scaledPixels(16),
    lineHeight: scaledPixels(24),
  },
  button: {
    backgroundColor: colors.blue,
  },
  buttonIcon: {
    tintColor: colors.white,
  },
  searchInputWrapper: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  clearIconButton: {
    position: "absolute",
    right: scaledPixels(8),
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    // ensure touch target is large enough
    paddingHorizontal: scaledPixels(6),
  },
  searchInput: {
    color: colors.white,
    fontFamily: FONT_MEDIUM,
    fontSize: scaledPixels(24),
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: scaledPixels(12),
    paddingRight: scaledPixels(50),       // Room for the clear icon inside the input
    paddingVertical: scaledPixels(10),    // Only for iOS
    borderRadius: scaledPixels(10),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  }
});
