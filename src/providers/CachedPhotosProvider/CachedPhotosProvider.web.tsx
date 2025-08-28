import React, { createContext, useContext, PropsWithChildren } from "react";
import { useMediaLibraryPhotos } from "../MediaLibraryPhotosProvider/MediaLibraryPhotosProvider.web";
import { CachedPhotoType } from "./cache-service";
import { CachedPhotosLoadingState } from "./useCachedPhotos";

type CachedPhotosDataType = {
  cachedPhotos: CachedPhotoType[];
  cachedPhotosLoadingState: CachedPhotosLoadingState;
  recalculateCachedPhotos: () => void;
};

const CachedPhotosContext = createContext<CachedPhotosDataType | undefined>(
  undefined,
);

export const CachedPhotosProvider = ({ children }: PropsWithChildren) => {
  const mediaLibraryPhotosContext = useMediaLibraryPhotos();

  return (
    <CachedPhotosContext.Provider
      value={{
        cachedPhotos: mediaLibraryPhotosContext.mediaLibraryPhotos.map(
          (item) => ({
            originalPhotoUri: item.uri,
            mipmapWidth: 100,
            cachedPhotoUri: item.uri,
          }),
        ),
        cachedPhotosLoadingState:
          mediaLibraryPhotosContext.mediaLibraryLoadingState === "COMPLETED"
            ? "COMPLETED"
            : "CALCULATING",
        recalculateCachedPhotos:
          mediaLibraryPhotosContext.reloadMediaLibraryPhotos,
      }}
    >
      {children}
    </CachedPhotosContext.Provider>
  );
};

export const useCachedPhotos = (): CachedPhotosDataType => {
  const context = useContext(CachedPhotosContext);
  if (!context) {
    throw new Error(
      "useCachedPhotos must be used within a CachedPhotosProvider",
    );
  }
  return context;
};
