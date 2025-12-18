import { IS_WIDE_SCREEN } from "@/config/constants";
import { useCachedPhotos } from "@/providers/CachedPhotosProvider";
import { useGalleryUISettings } from "@/providers/GalleryUISettingsProvider";
import { useMediaLibraryPhotos } from "@/providers/MediaLibraryPhotosProvider";
import { Dimensions } from "@/providers/ScreenDimensionsProvider";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { FocusableImage } from "./image";
import { NoPhotosMessage } from "./NoPhotosMessage";
import { EmptyGalleryList } from "./EmptyGalleryList";
import * as SplashScreen from "expo-splash-screen";
import { FlashList } from "@shopify/flash-list";
import { Point, scaledPixels } from "@/hooks/useScale";
import { getHandle, useFocusRefs } from "@/providers/FocusRefProvider";
import { CachedPhotoType } from "@/providers/CachedPhotosProvider/cache-service";
import { StateMachine } from "@/controller/stateMachine";
import { ImagesGalleryListState, ModalTabState } from "@/controller/states";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFilteredPhotos } from "@/providers/FilteredPhotosProvider";

/**
 * Helper definitions - images gallery list props
 */
export type ImagesGalleryListProps = {
  name: string;
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
  name,
  dimensions,
  numberOfColumns,
  galleryGap,
  style,
}: ImagesGalleryListProps) => {
  /**
   * Photos data & related properties
   */

  const { filteredPhotos, filteredPhotosLoadingState } = useFilteredPhotos();
  const { mediaLibraryPhotos, mediaLibraryLoadingState } =
    useMediaLibraryPhotos();
  const { offscreenDrawDistanceWindowSize } = useGalleryUISettings();

  // Helper function - image size calculation
  const calculateSingleImageSize = useCallback(() => {
    const effectiveWidth =
      dimensions.width - (numberOfColumns + 1) * galleryGap;
    return IS_WIDE_SCREEN
      ? (effectiveWidth - dimensions.width * 0.1) / numberOfColumns
      : effectiveWidth / numberOfColumns;
  }, [dimensions, numberOfColumns, galleryGap]);

  // Helper function - ofscreen render distance calculation
  const calculateOffscreenDrawDistanceFromWindowSize = useCallback(
    () => Math.round(dimensions.height * offscreenDrawDistanceWindowSize),
    [dimensions, offscreenDrawDistanceWindowSize],
  );

  // List properties - dynamically updated values based on gallery settings and screen dimensions
  const properties = useMemo(
    () => ({
      singleImageSize: calculateSingleImageSize(),
      listOffscreenDrawDistance: calculateOffscreenDrawDistanceFromWindowSize(),
    }),
    [calculateSingleImageSize, calculateOffscreenDrawDistanceFromWindowSize],
  );

  // Determine if we should show the "No Photos" message
  const shouldShowNoPhotosMessage =
    mediaLibraryLoadingState === "COMPLETED" && mediaLibraryPhotos.length === 0;

  // Determine if we should show loading skeletons
  const shouldShowLoadingSkeletons =
    mediaLibraryLoadingState !== "COMPLETED" ||
    (mediaLibraryPhotos.length > 0 && filteredPhotosLoadingState !== "COMPLETED");

  /**
   * List & items positioning
   */

  const listContainerRef = useRef<View | null>(null); // A helper reference to list container
  const listRef = useRef<FlashList<CachedPhotoType> | null>(null); // A main reference to the list item
  const listOrigin = useRef<Point | null>(null); // Used to turn relative x, y coords within the list into absolute coords
  const scrollOffset = useRef<number>(0); // Used to properly calculate an absolute layout within the list

  const safeAreaInsets = useSafeAreaInsets(); // A correction to transform safe-area relative layout to absolute layout

  // Helper function - item absolute position calculation
  const calculateItemPosition = useCallback((index: number) => {
    if (!listRef.current) return null;
    const layout = listRef.current.recyclerlistview_unsafe?.getLayout(index);
    if (!layout || !listOrigin.current) return null;

    return {
      x: listOrigin.current.x + layout.x,
      y: listOrigin.current.y + layout.y - scrollOffset.current,
    };
  }, []);

  /**
   * Focus references & management
   */

  // Global references
  const focusRefs = useFocusRefs();
  const settingsButtonHandle = getHandle(focusRefs["settings"]);

  // Local references
  const itemRefs = useRef<Map<number, View | null>>(new Map()); // Use a hash map instead of array to index elements easier

  // Modal tab state
  const selectedPhoto = StateMachine.observe<ImagesGalleryListState>(
    "photos_gallery_list",
  ).selectedPhoto;

  const photoPreviewState = StateMachine.observe<ModalTabState>(
    "photo_preview_modal",
  );

  useEffect(() => {
    if (photoPreviewState === "CLOSED" && selectedPhoto) {
      itemRefs.current.get(selectedPhoto.index)?.requestTVFocus();
      StateMachine.set(name, { selectedPhoto: null });
    }
  }, [photoPreviewState, selectedPhoto, name]);

  /**
   * Selected photo management
   */

  // Automatically update origin after each change of selected photo
  // - This allows to sync other components which use selected photo property
  useEffect(() => {
    if (photoPreviewState !== "CLOSED" && selectedPhoto) {
      let newOrigin = calculateItemPosition(selectedPhoto.index);

      if (!newOrigin) return;

      // If the photo is outside the visible part of a list, scroll onto it
      if (newOrigin.y < 0 || newOrigin.y > dimensions.height) {
        listRef.current?.scrollToIndex({
          index: selectedPhoto.index,
          animated: false,
        });

        // Calculate new origin since scroll offset has changed
        newOrigin = calculateItemPosition(selectedPhoto.index);
      }

      // Now we can update the origin
      StateMachine.set(name, {
        selectedPhoto: { ...selectedPhoto, origin: newOrigin },
      });
    }
  }, [
    selectedPhoto,
    calculateItemPosition,
    dimensions,
    name,
    photoPreviewState,
  ]);

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

  // A helper function to handle item clicks
  const handleItemSelect = useCallback(
    (index: number) => {
      const origin = calculateItemPosition(index);

      if (origin) {
        StateMachine.set(name, {
          selectedPhoto: {
            index,
            origin,
            size: properties.singleImageSize,
          },
        } as ImagesGalleryListState);
      }
    },
    [properties, calculateItemPosition, name],
  );

  const renderItem = useCallback(
    ({
      item,
      index,
    }: {
      item: (typeof filteredPhotos)[number];
      index: number;
    }) => {
      return (
        <FocusableImage
          ref={(el) => {
            itemRefs.current.set(index, el);
          }} // Dynamic references
          uri={item.cachedPhotoUri}
          itemSize={properties.singleImageSize}
          disableFocusEffect={!Platform.isTV}
          nextFocusLeft={
            index % numberOfColumns === 0 ? settingsButtonHandle : undefined
          }
          nextFocusUp={
            index < numberOfColumns ? settingsButtonHandle : undefined
          }
          onPress={() => handleItemSelect(index)}
        />
      );
    },
    [properties, settingsButtonHandle, numberOfColumns, handleItemSelect],
  );

  const ItemSeparator = useCallback(() => {
    return <View style={{ height: galleryGap }} />;
  }, [galleryGap]);

  const keyExtractor = useCallback(
    (item: (typeof filteredPhotos)[number]) => item.originalPhotoUri,
    [],
  );

  /**
   * Helper functions - list action handlers
   */
  const handleLayout = useCallback(
    (e: any) => {
      const { x, y } = e.nativeEvent.layout;
      listOrigin.current = {
        x: x + galleryGap + (IS_WIDE_SCREEN ? dimensions.width * 0.05 : 0),
        y: y + (IS_WIDE_SCREEN ? scaledPixels(20) : 0) + safeAreaInsets.top,
      };
    },
    [galleryGap, safeAreaInsets, dimensions],
  );

  const handleLoad = useCallback(() => {
    setTimeout(() => {
      SplashScreen.hideAsync();
    }, 100);
  }, []);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollOffset.current = e.nativeEvent.contentOffset.y;
    },
    [],
  );

  /**
   * Main list structure
   *
   * We wrap the list inside an additional View to enable styling the list
   */
  return (
    <View
      ref={listContainerRef}
      style={[styles.listContainer, style]}
      onLayout={handleLayout}
    >
      <FlashList
        ref={listRef}
        key={mediaLibraryLoadingState}    // Temporary solution to prevent empty list crash
        data={filteredPhotos}
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
        onScroll={handleScroll}
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
