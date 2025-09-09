import React, {
  PropsWithChildren,
  useRef,
  createContext,
  useContext,
  RefObject,
} from "react";
import { references } from "./references";
import { View } from "react-native";

/**
 * Helper definitions - focus references context type
 */
export type FocusRefsContextType = Record<string, RefObject<View | null>>;

export const FocusRefContext = createContext<FocusRefsContextType | null>(null);

/**
 * Focus references provider
 */
export const FocusRefProvider = ({ children }: PropsWithChildren) => {
  // Create a single ref object to hold all refs
  const focusRefs = useRef<FocusRefsContextType>({});

  // Initialize references only once
  references.forEach((name) => {
    if (!focusRefs.current[name]) {
      focusRefs.current[name] = React.createRef<View>();
    }
  });

  return (
    <FocusRefContext.Provider value={focusRefs.current}>
      {children}
    </FocusRefContext.Provider>
  );
};

export const useFocusRefs = (): FocusRefsContextType => {
  const ctx = useContext(FocusRefContext);
  if (!ctx)
    throw new Error("useFocusRefs must be used within FocusRefProvider");
  return ctx;
};
