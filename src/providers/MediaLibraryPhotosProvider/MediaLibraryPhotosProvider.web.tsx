import {
  createContext,
  PropsWithChildren,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  MediaLibraryLoadingState,
  MediaLibraryPhoto,
  useMediaLibraryPhotos as useMediaLibraryPhotosHook,
} from "./useMediaLibraryPhotos.web";
import { API, Directory, FilesystemDirectory } from "./filesystem/types.web";
import { DirectoryStorage } from "./filesystem/storage.web";

// Helper type definition
export type MediaLibraryPhotosDataType = {
  api: API;
  mediaLibraryPhotosCount: number | undefined;
  mediaLibraryPhotos: MediaLibraryPhoto[];
  mediaLibraryLoadingState: MediaLibraryLoadingState;
  reloadMediaLibraryPhotos: () => void;
  photosDirectory: Directory | null;
  changePhotosDirectory: (directory: Directory | null, api: API) => void;
};

// Context definition
const MediaLibraryPhotosContext = createContext<
  MediaLibraryPhotosDataType | undefined
>(undefined);

export const MediaLibraryPhotosProvider = ({ children }: PropsWithChildren) => {
  // API mode
  const [api, setApi] = useState<API>("filesystem");

  // Selected photos directory
  const [photosDirectory, setDirectory] = useState<Directory | null>(null);

  // Provided photos - depends on selected directory
  const {
    mediaLibraryPhotosCount,
    mediaLibraryPhotos,
    mediaLibraryLoadingState,
    reloadMediaLibraryPhotos,
  } = useMediaLibraryPhotosHook(photosDirectory, api);

  // Try to restore saved directory from local storage at provider's initialization stage
  useEffect(() => {
    // Async wrapper for local storage access
    const loadDirectory = async () => {
      const storedDirectory = await DirectoryStorage.getStoredDirectory();

      if (storedDirectory && storedDirectory.handle)
        setDirectory(storedDirectory.handle);
    };

    DirectoryStorage.clearOnBuildChange();
    loadDirectory();
  }, []);

  const changePhotosDirectory = useCallback(
    (directory: Directory | null, api: API) => {
      setApi(api);
      setDirectory(directory);

      // Save directory handle to IndexedDB in locacal storage (only for filesystem API)
      if (api === "filesystem") {
        const dirHandle = directory as FilesystemDirectory;

        DirectoryStorage.storeDirectory(dirHandle, dirHandle.name);
      }
    },
    [],
  );

  return (
    <MediaLibraryPhotosContext
      value={useMemo(
        () => ({
          api,
          mediaLibraryPhotosCount,
          mediaLibraryPhotos,
          mediaLibraryLoadingState,
          reloadMediaLibraryPhotos,
          photosDirectory,
          changePhotosDirectory,
        }),
        [
          api,
          mediaLibraryPhotosCount,
          mediaLibraryPhotos,
          mediaLibraryLoadingState,
          reloadMediaLibraryPhotos,
          photosDirectory,
          changePhotosDirectory,
        ],
      )}
    >
      {children}
    </MediaLibraryPhotosContext>
  );
};

// We create a wrapper for the hook to return shared data from global context
export const useMediaLibraryPhotos = (): MediaLibraryPhotosDataType => {
  const context = use(MediaLibraryPhotosContext);

  if (context === undefined) {
    throw new Error(
      "useMediaLibraryPhotos must be used within an MediaLibraryPhotosProvider",
    );
  }

  return context;
};
