import { createContext, PropsWithChildren, use, useMemo } from "react";
import { CachedPhotoType } from "../CachedPhotosProvider/cache-service";
import {
  FilteredPhotosLoadingState,
  useFilteredPhotos as useFilteredPhotosData,
} from "./useFilteredPhotos";

type FilteredPhotosDataType = {
  embeddingProgress: number;
  filteredPhotos: CachedPhotoType[];
  filteredPhotosLoadingState: FilteredPhotosLoadingState;
  query: (query: string) => Promise<void>;
  clearPhotosEmbeddings: () => Promise<void>;
};

const FilteredPhotosContext = createContext<FilteredPhotosDataType | undefined>(
  undefined,
);

/**
 * Provides the images filtered by text query
 */
export const FilteredPhotosProvider = ({ children }: PropsWithChildren) => {
  const {
    embeddingProgress,
    filteredPhotos,
    filteredPhotosLoadingState,
    query,
    clearPhotosEmbeddings,
  } = useFilteredPhotosData();

  return (
    <FilteredPhotosContext
      value={useMemo(
        () => ({
          embeddingProgress,
          filteredPhotos,
          filteredPhotosLoadingState,
          query,
          clearPhotosEmbeddings,
        }),
        [
          embeddingProgress,
          filteredPhotos,
          filteredPhotosLoadingState,
          query,
          clearPhotosEmbeddings,
        ],
      )}
    >
      {children}
    </FilteredPhotosContext>
  );
};

export const useFilteredPhotos = (): FilteredPhotosDataType => {
  const context = use(FilteredPhotosContext);

  if (context === undefined) {
    throw new Error(
      "useFilteredPhotos must be used within an FilteredPhotosProvider",
    );
  }

  return context;
};
