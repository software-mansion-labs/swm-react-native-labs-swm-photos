import { Dimensions } from "@/providers/ScreenDimensionsProvider";
import { Slide } from "./Slide";
import { useRef, useState } from "react";
import { FlashList } from "@shopify/flash-list";

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
  const estimatedItemSize =
    direction === "horizontal" ? itemSize.width : itemSize.height;

  // List reference
  // - Used to slap back to the middle slot
  const listRef = useRef<FlashList<number>>(null);
  const scrolling = useRef(false);

  // Slider state - current item index & indices window
  const [currentIndex, setCurrentIndex] = useState(initialItemIdx);

  const scrollToIndexAnimated = (index: number) => {
    if (scrolling.current) return;

    scrolling.current = true;

    listRef.current?.scrollToIndex({
      index,
      animated: true,
    });

    setCurrentIndex(index);
    setTimeout(() => {
      scrolling.current = false;
      onSlide?.(index);
    }, 300);
  };

  if (numberOfItems === 0) return null;

  return (
    <FlashList
      ref={listRef}
      data={data}
      extraData={[currentIndex, extraData]} // We pass currentIndex to force a reload of list elements after each change of an active slide
      horizontal={direction === "horizontal"}
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      estimatedItemSize={estimatedItemSize}
      drawDistance={0}
      initialScrollIndex={initialItemIdx}
      keyExtractor={keyExtractor}
      renderItem={({ item, index }) => (
        <Slide
          active={index === currentIndex && !scrolling.current}
          size={itemSize}
          direction={direction}
          isFirst={index === 0}
          isLast={index === numberOfItems - 1}
          onSlideLeft={() => {
            if (currentIndex > 0) scrollToIndexAnimated(currentIndex - 1);
          }}
          onSlideRight={() => {
            if (currentIndex < numberOfItems - 1)
              scrollToIndexAnimated(currentIndex + 1);
          }}
          onSlideUp={() => {
            if (currentIndex > 0) scrollToIndexAnimated(currentIndex - 1);
          }}
          onSlideDown={() => {
            if (currentIndex < numberOfItems - 1)
              scrollToIndexAnimated(currentIndex + 1);
          }}
        >
          {renderItem(item, index, index === currentIndex)}
        </Slide>
      )}
    />
  );
}
