import {
  PersistedStateStatus,
  usePersistedState,
} from "@/hooks/usePersistedState";
import * as Config from "./config";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
} from "react";

/**
 * Helper definitions - gallery UI settings context type
 */
type GalleryUISettingsDataType = {
  /**
   * Information about the current state of the persisted state.
   * Especially useful when waiting for the state to be restored from the disk.
   */
  stateRestorationStatus: PersistedStateStatus;

  // Gallery gap - selected & available
  galleryGap: number;
  availableGalleryGaps: typeof Config.availableGalleryGaps;
  setGalleryGap: (galleryGap: number) => void;

  /**
   * Derived from the {@link numberOfColumns}.
   */
  numberOfColumns: number;
  availableColumnCounts:
    | typeof Config.availableColumnCountsPortrait
    | typeof Config.availableColumnCountsLandscape;
  setNumberOfColumns: (numberOfColumns: number) => void;

  /**
   * The value is multiplied by {@link Dimensions.get("window").height} to determine offscreen rendering area.
   * A value of 0.25 means rendering extends to 25% of screen height beyond visible area to the top and bottom.
   * A value of `1` will pre-render content one full screen height above and below the viewport.
   */
  offscreenDrawDistanceWindowSize: number;
  setOffscreenDrawDistanceWindowSize: (drawDistance: number) => void;
  availableOffscreenDrawDistanceWindowSizes: typeof Config.availableOffscreenDrawDistanceWindowSizes;
};

/**
 * Gallery UI settings global context
 */
export const GalleryUISettingsContext = createContext<
  GalleryUISettingsDataType | undefined
>(undefined);

/**
 * GalleryUISettings provider
 *
 * Provides all the explicitely set settings fields, as well as available values for each field.
 */
export const GalleryUISettingsProvider = ({ children }: PropsWithChildren) => {
  // Provider state
  const [value, setValue, stateRestorationStatus] = usePersistedState<{
    numberOfColumns: number;
    galleryGap: number;
    offscreenDrawDistanceWindowSize: number;
  }>("galleryUISettings", Config.INITIAL_GALLERY_SETTINGS);

  // Provider state handlers
  const setNumberOfColumns = useCallback(
    (numberOfColumns: number) => {
      setValue((prev) => ({
        ...prev,
        numberOfColumns,
      }));
    },
    [setValue],
  );

  const setGalleryGap = useCallback(
    (galleryGap: number) => {
      setValue((prev) => ({
        ...prev,
        galleryGap,
      }));
    },
    [setValue],
  );

  const setOffscreenDrawDistanceWindowSize = useCallback(
    (windowSize: number) => {
      setValue((prev) => ({
        ...prev,
        offscreenDrawDistanceWindowSize: windowSize,
      }));
    },
    [setValue],
  );

  return (
    <GalleryUISettingsContext.Provider
      value={useMemo(
        () => ({
          ...value,
          setNumberOfColumns,
          setGalleryGap,
          setOffscreenDrawDistanceWindowSize,
          stateRestorationStatus,
          availableGalleryGaps: Config.availableGalleryGaps,
          availableColumnCounts: Config.availableColumnCountsPortrait,
          availableOffscreenDrawDistanceWindowSizes:
            Config.availableOffscreenDrawDistanceWindowSizes,
        }),
        [
          value,
          stateRestorationStatus,
          setGalleryGap,
          setNumberOfColumns,
          setOffscreenDrawDistanceWindowSize,
        ],
      )}
    >
      {children}
    </GalleryUISettingsContext.Provider>
  );
};

/**
 * Helper hook - useGalleryUISettings
 */
export const useGalleryUISettings = (): GalleryUISettingsDataType => {
  const context = useContext(GalleryUISettingsContext);

  if (context === undefined) {
    throw new Error(
      "useGalleryUISettings must be used within an GalleryUISettingsProvider",
    );
  }

  return context;
};
