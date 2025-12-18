import { useScreenDimensions } from "@/providers/ScreenDimensionsProvider";
import { useCallback, useEffect, useMemo } from "react";
import { Platform, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { StateMachine } from "@/controller/stateMachine";
import { ImagesGalleryListState, ModalTabState } from "@/controller/states";
import { Slider } from "@/components/slider/Slider";
import { PhotoPreview } from "@/components/PhotoPreview";
import { Resolution } from "@/hooks/useScale";
import { useFilteredPhotos } from "@/providers/FilteredPhotosProvider";

/**
 * Helper definitions - photo preview layout props
 */
export type PhotoPreviewLayoutProps = {
  dimensions: Resolution;
  animateBackdrop?: boolean; // Decides whether to use animated backdrop
};

/**
 * PhotoPreviewLayout
 *
 * An outside-navigation view for displaying selected photo full-screen preview.
 */
export default function PhotoPreviewLayout({
  animateBackdrop = true,
}: PhotoPreviewLayoutProps) {
  // Media library photos (full resolution)
  const { filteredPhotos, filteredPhotosLoadingState } = useFilteredPhotos();

  // Obtain screen dimensions info for further layout calculations
  const { dimensions } = useScreenDimensions();

  // State hooks
  const selectedPhoto = StateMachine.observe<ImagesGalleryListState>(
    "photos_gallery_list",
  ).selectedPhoto;
  const state = StateMachine.observe<ModalTabState>("photo_preview_modal");
  const activeOrActivating = state === "ACTIVATING" || state === "ACTIVE";

  // Animation shared values - backdrop animation
  const backdropOpacity = useSharedValue(state === "ACTIVE" ? 1 : 0);

  // Animation parameters
  const timingConfig = useMemo(
    () => ({
      duration: Platform.isTV ? 500 : 300,
    }),
    [],
  );

  // Animation definitions - backdrop animation
  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  // State-related updates
  // - Activates the begin/end animations
  useEffect(() => {
    backdropOpacity.value = withTiming(
      activeOrActivating ? 1 : 0,
      timingConfig,
    );
  }, [activeOrActivating, backdropOpacity, timingConfig]);

  const keyExtractor = useCallback(
    (item: (typeof filteredPhotos)[number], index: number) => `slide-${index}-${item.originalPhotoUri}`,
    [],
  );

  const renderItem = useCallback(
    (item: (typeof filteredPhotos)[number], index: number, visible: boolean) => (
      <PhotoPreview 
        visible={visible}
        state={state}
        size={dimensions}
        uri={item.originalPhotoUri}
        origin={selectedPhoto?.origin ?? { x: 0, y: 0 }}
        photoStartSize={selectedPhoto?.size ?? 0}
        timing={timingConfig}
      />
    ), 
    [filteredPhotosLoadingState, selectedPhoto, state]
  );

  const handleSlide = useCallback(
    (index: number) => {
      StateMachine.set("photos_gallery_list", {
        selectedPhoto: { ...selectedPhoto, index: index },
      });
    },
    [selectedPhoto],
  );

  // If closed or no photos, render nothing
  if (state === "CLOSED" || !selectedPhoto || filteredPhotos.length === 0)
    return null;

  return (
    <>
      {animateBackdrop && (
        <Animated.View
          pointerEvents="none"
          style={[styles.backdrop, backdropAnimatedStyle]}
        />
      )}
      <Slider
        itemSize={dimensions}
        direction="horizontal"
        data={filteredPhotos}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onSlide={handleSlide}
        initialItemIdx={selectedPhoto!.index}
        extraData={state}
      />
    </>
  );
}

// Styles
const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "black",
  },
});
