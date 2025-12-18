import { Point } from "@/hooks/useScale";

/**
 * State definitions - general states
 */

export type BinaryState = "ACTIVE" | "CLOSED";
export type BinaryLTState = BinaryState & "ACTIVATING"; // Binary state with Left Transition (ACTIVATING)
export type BinaryRTState = BinaryState & "CLOSING"; // Binary state with Right Transition (CLOSING)
export type BinaryLRTState = BinaryLTState & BinaryRTState; // Binary state with Left & Right Transition (ACTIVATING + CLOSING)

/**
 * State definitions - ImageGalleryList component
 */

export type ImagesGalleryListState = {
  selectedPhoto: {
    index: number;
    origin: Point;
    size: number;
  } | null;
};

/**
 * State definitions - ModalTab component
 */

export type ModalTabState = BinaryLRTState;
