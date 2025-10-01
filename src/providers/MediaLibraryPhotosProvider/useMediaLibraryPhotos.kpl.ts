import { MEDIA_LIBRARY_PHOTOS_LIMIT } from "@/config/config";
import { usePersistedState } from "@/hooks/usePersistedState";
import logPerformance from "@/utils/logPerformance";
import * as FileSystem from "expo-file-system";
import { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";

/**
 * Determines how many MediaLibrary photos will be loaded in one batch.
 */
const LOAD_BATCH_SIZE = Platform.select({
  /**
   * iOS can provide results much faster than Android.
   */
  ios: Math.min(50, MEDIA_LIBRARY_PHOTOS_LIMIT),
  default: Math.min(30, MEDIA_LIBRARY_PHOTOS_LIMIT),
});

export type MediaLibraryLoadingState = "IDLE" | "LOADING" | "COMPLETED";

export type MediaLibraryPermissionsStatus =
  | "GRANTED"
  | "DENIED"
  | "UNDETERMINED";

export type MediaLibraryPhoto = {
  uri: string;
};

/**
 * Reads photos from MediaLibrary.
 */
export const useMediaLibraryPhotos = () => {
  // We're no longer using system MediaLibrary permissions; accessing bundled / mounted files.

  /**
   * We need to be sure that the restoration logic is called only once. No matter React running `useEffect` multiple times.
   */
  const didRunOnceFlag = useRef(false);
  const [state, setState, stateRestorationStatus] = usePersistedState<{
    mediaLibraryPermissionsStatus: MediaLibraryPermissionsStatus;
    mediaLibraryPhotosCount: number | undefined;
    mediaLibraryLoadingState: MediaLibraryLoadingState;
    mediaLibraryPhotos: MediaLibraryPhoto[];
  }>("mediaLibrary", {
    mediaLibraryLoadingState: "IDLE",
    mediaLibraryPermissionsStatus: "UNDETERMINED",
    mediaLibraryPhotosCount: undefined,
    mediaLibraryPhotos: [],
  });

  const loadMediaLibraryPhotos = useCallback(async () => {
    await logPerformance(async () => {
      try {
        logger.mediaLibrary.info("🛫 Starting reading bundled photos from /pkg/assets/photo/numbered-photos ...");

        const PHOTOS_DIR = "/pkg/assets/photos"; // Mounted assets directory provided by Kepler runtime
        const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp"];

        setState((prev) => ({
          ...prev,
          mediaLibraryPermissionsStatus: "GRANTED", // implicit
          mediaLibraryLoadingState: "LOADING",
        }));

        // Read directory (may throw if not present)
        let entries: string[] = [];
        try {
            entries = await FileSystem.readDirectoryAsync(PHOTOS_DIR);
        } catch (e) {
          logger.mediaLibrary.warn(`⚠️ Photos directory ${PHOTOS_DIR} not found, treating as empty.`);
          setState((prev) => ({
            ...prev,
            mediaLibraryPhotos: [],
            mediaLibraryPhotosCount: 0,
            mediaLibraryLoadingState: "COMPLETED",
          }));
          return;
        }

        // Filter and gather file info for sorting
        const filtered = entries.filter(name => {
          const ext = name.split('.').pop()?.toLowerCase();
          return !!ext && ALLOWED_EXT.includes(ext);
        });

        // Since Kepler build already copies and shuffles files, sorting by modification date does not make much sense
        // TOOD: change in the future after fixing populate-device-with-images script
        const files = filtered.map(name => `${PHOTOS_DIR}/${name}`);
        files.sort((a, b) => {
          const nameA = a.split("/").pop()?.toLowerCase() ?? "";
          const nameB = b.split("/").pop()?.toLowerCase() ?? "";
          if (nameA < nameB) return -1;
          if (nameA > nameB) return 1;
          return 0;
        });

        const total = Math.min(files.length, MEDIA_LIBRARY_PHOTOS_LIMIT);

        if (total === state.mediaLibraryPhotosCount) {
          logger.mediaLibrary.info(`✅ Bundled photos count (${total}) unchanged, skipping reload.`);
          setState((prev)=> ({...prev, mediaLibraryLoadingState: "COMPLETED"}));
          return;
        }

        setState({
          mediaLibraryPhotosCount: total,
          mediaLibraryPhotos: [],
          mediaLibraryPermissionsStatus: "GRANTED",
          mediaLibraryLoadingState: "LOADING",
        });

        logger.mediaLibrary.info(`🔄 Bundled photos count: ${total}, batches: ${Math.ceil(total / LOAD_BATCH_SIZE)}`);

        for (let i = 0; i < total; i += LOAD_BATCH_SIZE) {
          const slice = files.slice(i, i + LOAD_BATCH_SIZE).map(f => ({ uri: `file://${f}` }));
          setState((prev) => ({
            ...prev,
            mediaLibraryPhotos: [...prev.mediaLibraryPhotos, ...slice],
          }));
        }

        logger.mediaLibrary.info(`✅ Reading bundled photos completed (photos count: ${total})`);
        setState((prev)=> ({...prev, mediaLibraryLoadingState: "COMPLETED"}));
      } catch (e) {
        logger.mediaLibrary.error("❌ Error while reading MediaLibrary", e);
        setState((prev) => ({
          mediaLibraryLoadingState: "IDLE",
          mediaLibraryPhotosCount: undefined,
          mediaLibraryPhotos: [],
          mediaLibraryPermissionsStatus: prev.mediaLibraryPermissionsStatus,
        }));
      }
    }, ["loadMediaLibraryPhotos"]);
  }, [setState, state.mediaLibraryPhotosCount]);

  const reloadMediaLibraryPhotos = useCallback(async () => {
    if (state.mediaLibraryLoadingState === "LOADING") {
      return;
    }

    await loadMediaLibraryPhotos();
  }, [loadMediaLibraryPhotos, state.mediaLibraryLoadingState]);

  /**
   * Read MediaLibrary photos automatically upon app start..
   */
  useEffect(() => {
    if (stateRestorationStatus === "RESTORING") {
      return;
    }

    if (didRunOnceFlag.current) {
      return;
    }

    // Ensure we're not re-running this auto-restoration logic more than once.
    didRunOnceFlag.current = true;

    logger.mediaLibrary.info("Automatic MediaLibrary photo load start");
    loadMediaLibraryPhotos();
  }, [
    stateRestorationStatus,
    state.mediaLibraryLoadingState,
    loadMediaLibraryPhotos,
  ]);

  return {
    ...state,
    stateRestorationStatus,
    reloadMediaLibraryPhotos,
  };
};