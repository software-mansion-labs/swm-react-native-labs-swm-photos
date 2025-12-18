/**
 *  Type definitions - general gesture handler props
 *
 *  Defines a common contract for all gesture handler hooks.
 */
export type GestureHandlerProps = {
  active: boolean; // Whether handler is active and gestures are recognizable
  onBegin?: (e?: any) => void; // A function called at the beginning of a gesture
  onUpdate?: (e: any) => void; // A worklet called during a gesture state update
  onEnd?: (e?: any) => void; // A function called at the end of a gesture
};
