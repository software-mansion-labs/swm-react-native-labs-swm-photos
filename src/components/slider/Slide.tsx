import { Dimensions } from "@/providers/ScreenDimensionsProvider";
import React, { useEffect, useRef, useState } from "react";
import { findNodeHandle, StyleSheet, View } from "react-native";

/**
 * Helper definitions - slide props
 */
export type SlideProps = {
  children: React.ReactNode;
  active: boolean;
  size: Dimensions;
  direction: "horizontal" | "vertical";
  isFirst: boolean;
  isLast: boolean;
  onSlideLeft?: () => void;
  onSlideRight?: () => void;
  onSlideUp?: () => void;
  onSlideDown?: () => void;
};

/**
 * Slide component
 *
 * A wrapper component which allows to slide content with focus change
 */
export const Slide = ({
  children,
  active,
  size,
  direction,
  isFirst,
  isLast,
  onSlideLeft,
  onSlideRight,
  onSlideUp,
  onSlideDown,
}: SlideProps) => {
  const activeHorizontal = active && direction === "horizontal";
  const activeVertical = active && direction === "vertical";

  // Guard references to handle focus switch
  const containerRef = useRef<View>(null);
  const leftGuardRef = useRef<View>(null);
  const rightGuardRef = useRef<View>(null);
  const topGuardRef = useRef<View>(null);
  const bottomGuardRef = useRef<View>(null);
  const [containerTargetId, setContainerTargetId] = useState<number | undefined>(
    undefined
  );
  const [leftTargetId, setLeftTargetId] = useState<number | undefined>(
    undefined,
  );
  const [rightTargetId, setRightTargetId] = useState<number | undefined>(
    undefined,
  );
  const [topTargetId, setTopTargetId] = useState<number | undefined>(undefined);
  const [bottomTargetId, setBottomTargetId] = useState<number | undefined>(
    undefined,
  );

  // Update native target ids when the central item changes
  // - This is a safer way than inline findNodeHandle, because some platforms delay setting up node handles
  useEffect(() => {
    setContainerTargetId(findNodeHandle(containerRef.current) ?? undefined);
    if (activeHorizontal) {
      setLeftTargetId(findNodeHandle(leftGuardRef.current) ?? undefined);
      setRightTargetId(findNodeHandle(rightGuardRef.current) ?? undefined);
    } else if (activeVertical) {
      setTopTargetId(findNodeHandle(topGuardRef.current) ?? undefined);
      setBottomTargetId(findNodeHandle(bottomGuardRef.current) ?? undefined);
    }
  }, [active, activeHorizontal, activeVertical]);

  return (
    <View
      ref={containerRef}
      collapsable={false}
      focusable={active}
      hasTVPreferredFocus={active}
      nextFocusLeft={activeHorizontal && !isFirst ? leftTargetId : containerTargetId}
      nextFocusRight={activeHorizontal && !isLast ? rightTargetId : containerTargetId}
      nextFocusUp={activeVertical && !isFirst ? topTargetId : containerTargetId}
      nextFocusDown={activeVertical && !isLast ? bottomTargetId : containerTargetId}
      style={{ ...size }}
    >
      {activeHorizontal && (
        <>
          <View
            ref={leftGuardRef}
            focusable
            collapsable={false}
            importantForAccessibility="no"
            onFocus={onSlideLeft}
            style={styles.focusGuard}
          />
          <View
            ref={rightGuardRef}
            focusable
            collapsable={false}
            importantForAccessibility="no"
            onFocus={onSlideRight}
            style={styles.focusGuard}
          />
        </>
      )}
      {activeVertical && (
        <>
          <View
            ref={topGuardRef}
            focusable
            collapsable={false}
            importantForAccessibility="no"
            onFocus={onSlideUp}
            style={styles.focusGuard}
          />
          <View
            ref={bottomGuardRef}
            focusable
            collapsable={false}
            importantForAccessibility="no"
            onFocus={onSlideDown}
            style={styles.focusGuard}
          />
        </>
      )}
      {children}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  focusGuard: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 1,
    height: 1,
    opacity: 0,
  },
});
