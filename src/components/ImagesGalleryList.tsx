import { IS_WIDE_SCREEN } from "@/config/constants";
import { useCachedPhotos } from "@/providers/CachedPhotosProvider";
import { useGalleryUISettings } from "@/providers/GalleryUISettingsProvider";
import { useMediaLibraryPhotos } from "@/providers/MediaLibraryPhotosProvider";
import { Dimensions } from "@/providers/ScreenDimensionsProvider";
import { useCallback, useMemo } from "react";
import { Platform, StyleSheet, View, ViewStyle } from "react-native";
import { FocusableImage } from "./image/FocusableImage";
import { ImageComponent } from "./image/ImageComponent";
import { NoPhotosMessage } from "./NoPhotosMessage";
import { EmptyGalleryList } from "./EmptyGalleryList";
import { SplashScreen } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { scaledPixels } from "@/hooks/useScale";
import { getHandle, useFocusRefs } from "@/providers/FocusRefProvider";

/**
 * Helper definitions - images gallery list props
 */
export type ImagesGalleryListProps = {
  dimensions: Dimensions;
  numberOfColumns: number;
  galleryGap: number;
  style?: ViewStyle;
};

/**
 * Images list component
 *
 * @param dimensions - The target screen dimensions within which to display the list.
 * @param style - Styles for the list View wrapper component
 */
export const ImagesGalleryList = ({
  dimensions,
  numberOfColumns,
  galleryGap,
  style,
}: ImagesGalleryListProps) => {
  // Obtain data from providers
  const focusRefs = useFocusRefs();
  const settingsButtonHandle = getHandle(focusRefs["settings"]);

  const { cachedPhotos, cachedPhotosLoadingState } = useCachedPhotos();
  const { mediaLibraryPhotos, mediaLibraryLoadingState } =
    useMediaLibraryPhotos();
  const { offscreenDrawDistanceWindowSize } = useGalleryUISettings();

  /**
   * Helper functions - properties calculation
   */
  const calculateSingleImageSize = useCallback(() => {
    const effectiveWidth =
      dimensions.width - (numberOfColumns + 1) * galleryGap;
    return IS_WIDE_SCREEN
      ? (effectiveWidth - dimensions.width * 0.1) / numberOfColumns
      : effectiveWidth / numberOfColumns;
  }, [dimensions, numberOfColumns, galleryGap]);

  const calculateOffscreenDrawDistanceFromWindowSize = useCallback(
    () => Math.round(dimensions.height * offscreenDrawDistanceWindowSize),
    [dimensions, offscreenDrawDistanceWindowSize],
  );

  /**
   * List properties - a dynamically updated values based on gallery settings and screen dimensions
   */
  const properties = useMemo(
    () => ({
      singleImageSize: calculateSingleImageSize(),
      listOffscreenDrawDistance: calculateOffscreenDrawDistanceFromWindowSize(),
    }),
    [calculateSingleImageSize, calculateOffscreenDrawDistanceFromWindowSize],
  );

  const Image = Platform.isTV ? FocusableImage : ImageComponent;

  // Determine if we should show the "No Photos" message
  const shouldShowNoPhotosMessage =
    mediaLibraryLoadingState === "COMPLETED" && mediaLibraryPhotos.length === 0;

  // Determine if we should show loading skeletons
  const shouldShowLoadingSkeletons =
    mediaLibraryLoadingState !== "COMPLETED" ||
    (mediaLibraryPhotos.length > 0 && cachedPhotosLoadingState !== "COMPLETED");

  /**
   * Helper components - empty list placeholder
   */
  const ListEmptyComponent = useCallback(() => {
    if (shouldShowNoPhotosMessage) {
      return <NoPhotosMessage />;
    }

    if (shouldShowLoadingSkeletons) {
      return (
        <EmptyGalleryList
          itemSize={properties.singleImageSize}
          numberOfColumns={numberOfColumns}
          numberOfItems={100}
        />
      );
    }

    return null;
  }, [
    shouldShowNoPhotosMessage,
    shouldShowLoadingSkeletons,
    properties,
    numberOfColumns,
  ]);

  /**
   * Helper components - list render items
   */
  const renderItem = useCallback(
    ({
      item,
      index,
    }: {
      item: (typeof cachedPhotos)[number];
      index: number;
    }) => {
      // Since only TV uses FocusableImage component, only TV has focusable props here
      const focusProps = Platform.isTV
        ? {
            nextFocusLeft:
              index % numberOfColumns === 0 ? settingsButtonHandle : undefined,
            nextFocusUp:
              index < numberOfColumns ? settingsButtonHandle : undefined,
          }
        : {};

      return (
        <Image
          uri={item.cachedPhotoUri}
          itemSize={properties.singleImageSize}
          {...focusProps}
        />
      );
    },
    [properties, settingsButtonHandle, Image, numberOfColumns],
  );

  const ItemSeparator = useCallback(() => {
    return <View style={{ height: galleryGap }} />;
  }, [galleryGap]);

  const keyExtractor = useCallback(
    (item: (typeof cachedPhotos)[number]) => item.originalPhotoUri,
    [],
  );

  const handleLoad = useCallback(() => {
    setTimeout(() => {
      SplashScreen.hideAsync();
    }, 100);
  }, []);

  /**
   * Main list structure
   *
   * We wrap the list inside an additional View to enable styling the list
   */
  return (
    <View style={[styles.listContainer, style]}>
      <FlashList
        key={mediaLibraryLoadingState}    // Temporary solution to prevent empty list crash
        data={cachedPhotos}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={numberOfColumns}
        estimatedItemSize={properties.singleImageSize}
        contentContainerStyle={{
          paddingLeft: galleryGap,
          ...(IS_WIDE_SCREEN && {
            paddingLeft: galleryGap + dimensions.width * 0.05,
            paddingRight: dimensions.width * 0.05,
            paddingTop: Platform.isTV ? scaledPixels(20) : 0,
          }),
        }}
        /**
         * @see https://shopify.github.io/flash-list/docs/usage#drawdistance
         */
        drawDistance={properties.listOffscreenDrawDistance}
        ItemSeparatorComponent={ItemSeparator}
        ListEmptyComponent={ListEmptyComponent}
        onLoad={handleLoad}
        showsVerticalScrollIndicator={false}
        CellRendererComponent={(props) => {
          const { style, children, ...rest } = props;
          return (
            <View style={style} {...rest}>
              {children}
            </View>
          );
        }}
        disableAutoLayout={true}
      />
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
  },
});
