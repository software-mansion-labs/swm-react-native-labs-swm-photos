import { Dimensions } from "@/providers/ScreenDimensionsProvider";
import { Slide } from "./Slide";
import { useCallback, useRef, useState } from "react";
import { FlashList } from "@shopify/flash-list";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
} from "react-native";

/**
 * Helper definitions - slider props
 */
export type SliderProps = {
  itemSize: Dimensions;
  direction: "horizontal" | "vertical";
  data: any[];
  extraData?: any;
  initialItemIdx?: number;
  keyExtractor: (item: any, index: number) => string;
  renderItem: (item: any, index: number, visible: boolean) => React.ReactNode;
  onSlide?: (index: number) => void;
};

/**
 * Slider component
 *
 * Slider is basically a Flashlist wrapper which renders only 3 items of maximum size, with only 1 (central) being displayed
 */
export function Slider({
  itemSize,
  direction,
  data,
  extraData = undefined,
  initialItemIdx = 0,
  keyExtractor,
  renderItem,
  onSlide,
}: SliderProps) {
  // Calculate some properties
  const numberOfItems = data.length;
  const slideLength =
    direction === "horizontal" ? itemSize.width : itemSize.height;
  const drawDistance = Platform.isTV
    ? 0 // For TVs we can use draw distance 0, since user can only change the slide with slow focus navigation
    : direction === "horizontal"
      ? itemSize.width
      : itemSize.height;

  // List reference
  // - Used to slap back to the middle slot
  const listRef = useRef<FlashList<number>>(null);

  // Slider state - current item index & indices window
  const [currentIndex, setCurrentIndex] = useState(initialItemIdx);

  // Gesture end: detect page and update current index accordingly, then recenter list
  // - This works on mobile, and apparently also on Android TV
  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset =
      direction === "horizontal"
        ? e.nativeEvent.contentOffset.x
        : e.nativeEvent.contentOffset.y;

    const page = Math.round(offset / slideLength);

    if (page === currentIndex - 1 && currentIndex > 0) {
      setCurrentIndex(page);
      onSlide?.(page);
    } else if (page === currentIndex + 1 && currentIndex < numberOfItems - 1) {
      setCurrentIndex(page);
      onSlide?.(page);
    } else
      listRef.current?.scrollToIndex({ index: currentIndex, animated: false });
  };

  // Handlers
  const handleSlideLeft = useCallback(() => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : prev));
  }, []);

  const handleSlideRight = useCallback(() => {
    setCurrentIndex(prev =>
      prev < numberOfItems - 1 ? prev + 1 : prev
    );
  }, [numberOfItems]);

  const handleSlideUp = handleSlideLeft;
  const handleSlideDown = handleSlideRight;

  if (numberOfItems === 0) return null;

  return (
    <FlashList
      ref={listRef}
      data={data}
      extraData={{ currentIndex, extraData }} // We pass currentIndex to force a reload of list elements after each change of an active slide
      horizontal={direction === "horizontal"}
      disableHorizontalListHeightMeasurement
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      estimatedItemSize={slideLength}
      estimatedListSize={{ ...itemSize }}
      drawDistance={drawDistance}
      initialScrollIndex={initialItemIdx}
      onMomentumScrollEnd={onMomentumScrollEnd}
      keyExtractor={keyExtractor}
      renderItem={({ item, index }) => (
        <Slide
          active={index === currentIndex}
          size={itemSize}
          direction={direction}
          isFirst={index === 0}
          isLast={index === numberOfItems - 1}
          onSlideLeft={handleSlideLeft}
          onSlideRight={handleSlideRight}
          onSlideUp={handleSlideUp}
          onSlideDown={handleSlideDown}
        >
          {renderItem(item, index, index === currentIndex)}
        </Slide>
      )}
    />
  );
}
