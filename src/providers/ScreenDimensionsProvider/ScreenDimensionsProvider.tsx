import { createContext, PropsWithChildren, useContext } from "react";
import { useWindowDimensions } from "react-native";
import { Dimensions, DisplayMode, mode } from "./dimensions";

/**
 * Helper definitions - screen dimensions context type
 */
type ScreenDimensionsContextDataType = {
  dimensions: Dimensions;
  displayMode: DisplayMode;
};

// Global context
export const ScreenDimensionsContext = createContext<
  ScreenDimensionsContextDataType | undefined
>(undefined);

/**
 * Screen dimensions provider.
 *
 * Each `useWindowDimensions` hook call registers a separate listener.
 * Ideally, we want only one instance (singleton) to avoid multiple listeners.
 * This pattern uses a single, global instance of `useWindowDimensions`,
 * reducing unnecessary re-renders.
 */

export const ScreenDimensionsProvider = ({ children }: PropsWithChildren) => {
  // This is a recommended (and responsive) way to obtain screen dimensions siześ
  const window = useWindowDimensions();

  // Calculate display mode based on the window dimensions
  const displayMode = mode(window);

  return (
    <ScreenDimensionsContext.Provider
      value={{
        dimensions: {
          width: Math.ceil(window.width),
          height: Math.ceil(window.height),
        },
        displayMode: displayMode,
      }}
    >
      {children}
    </ScreenDimensionsContext.Provider>
  );
};

// Create a hook for more straightforward usage of context provider
export const useScreenDimensions = () => {
  const context = useContext(ScreenDimensionsContext);

  if (!context)
    throw new Error(
      "useWindowDimensions must be used within WindowDimensionsProvider",
    );

  return context;
};
