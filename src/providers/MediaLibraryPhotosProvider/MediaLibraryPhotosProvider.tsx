import { PersistedStateStatus } from "@/hooks/usePersistedState";
import { createContext, PropsWithChildren, useContext, useMemo } from "react";
import {
  MediaLibraryLoadingState,
  MediaLibraryPermissionsStatus,
  MediaLibraryPhoto,
  useMediaLibraryPhotos as useMediaLibraryPhotosHook,
} from "./useMediaLibraryPhotos";

type MediaLibraryPhotosDataType = {
  mediaLibraryPermissionsStatus: MediaLibraryPermissionsStatus;
  mediaLibraryPhotosCount: number | undefined;
  mediaLibraryLoadingState: MediaLibraryLoadingState;
  mediaLibraryPhotos: MediaLibraryPhoto[];
  reloadMediaLibraryPhotos: () => Promise<void>;
  stateRestorationStatus: PersistedStateStatus;
};

const MediaLibraryPhotosContext = createContext<
  MediaLibraryPhotosDataType | undefined
>(undefined);

/**
 * Provides the device photos.
 */
export const MediaLibraryPhotosProvider = ({ children }: PropsWithChildren) => {
  const {
    mediaLibraryPhotosCount,
    mediaLibraryLoadingState,
    mediaLibraryPhotos,
    mediaLibraryPermissionsStatus,
    reloadMediaLibraryPhotos,
    stateRestorationStatus,
  } = useMediaLibraryPhotosHook();

  return (
    <MediaLibraryPhotosContext.Provider
      value={useMemo(
        () => ({
          mediaLibraryPermissionsStatus,
          mediaLibraryPhotosCount,
          mediaLibraryLoadingState,
          mediaLibraryPhotos,
          reloadMediaLibraryPhotos,
          stateRestorationStatus,
        }),
        [
          mediaLibraryPermissionsStatus,
          mediaLibraryPhotosCount,
          mediaLibraryLoadingState,
          mediaLibraryPhotos,
          reloadMediaLibraryPhotos,
          stateRestorationStatus,
        ],
      )}
    >
      {children}
    </MediaLibraryPhotosContext.Provider>
  );
};

export const useMediaLibraryPhotos = (): MediaLibraryPhotosDataType => {
  const context = useContext(MediaLibraryPhotosContext);

  if (context === undefined) {
    throw new Error(
      "useMediaLibraryPhotos must be used within an MediaLibraryPhotosProvider",
    );
  }

  return context;
};
