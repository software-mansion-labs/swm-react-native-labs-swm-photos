import { useCallback, useEffect, useState } from "react";

import logPerformance from "@/utils/logPerformance";
import {
  CLIP_VIT_BASE_PATCH32_IMAGE,
  CLIP_VIT_BASE_PATCH32_TEXT,
  TextEmbeddingsModule,
} from "react-native-executorch";
import { useCachedPhotos } from "../CachedPhotosProvider";
import { CachedPhotoType } from "../CachedPhotosProvider/cache-service";
import { OPSQLiteVectorStore } from "../FilteredPhotosProvider/OPSQLiteVectorStore";
import { ExecuTorchImageEmbeddings } from "./ImageEmbeddings";

export type FilteredPhotosLoadingState =
  | "IDLE"
  | "CALCULATING_EMBEDDINGS"
  | "COMPLETED";

// const threshold for matching similar photos - to set - print similarity results and see what matches your needs
// 0.24 seems to be good middleground
const SIMILARITY_THRESHOLD = 0.24;

const textEmbeddings = new TextEmbeddingsModule();
/**
 * Uses cached photos, calculates their embeddings and stores them in SQL-based vector store.
 */
export const useFilteredPhotos = () => {
  const [vectorStore, setVectorStore] = useState<OPSQLiteVectorStore | null>(
    null,
  );
  const [textEmbeddingsReady, setTextEmbeddingsReady] = useState(false);
  const [queryEmbedding, setQueryEmbedding] = useState<number[]>([]);
  const [queryChanged, setQueryChanged] = useState<boolean>(true);
  const [embeddingProgress, setEmbeddingProgress] = useState(0);

  const { cachedPhotos, cachedPhotosLoadingState } = useCachedPhotos();

  const [state, setState] = useState<{
    filteredPhotos: CachedPhotoType[];
    filteredPhotosLoadingState: FilteredPhotosLoadingState;
  }>({
    filteredPhotos: [],
    filteredPhotosLoadingState: "IDLE",
  });

  // Loading DB and models
  useEffect(() => {
    // TODO: causes a crash on iOS simulator
    const newVectorStore = new OPSQLiteVectorStore({
      name: "image_embeddings_db",
      embeddings: new ExecuTorchImageEmbeddings({
        model: CLIP_VIT_BASE_PATCH32_IMAGE,
        onDownloadProgress: (progress: number) => {
          logger.filteredPhotos.info(
            "ImageEmbeddings download progress",
            progress,
          );
        },
      }),
    });

    (async () => {
      await newVectorStore.load();
      setVectorStore(newVectorStore);
      await textEmbeddings.load(
        CLIP_VIT_BASE_PATCH32_TEXT,
        (progress: number) => {
          logger.filteredPhotos.info(
            "TextEmbeddings download progress",
            progress,
          );
        },
      );
      setTextEmbeddingsReady(true);
    })();

    return () => {
      newVectorStore?.unload();
      setVectorStore(null);
      textEmbeddings.delete();
      setTextEmbeddingsReady(false);
    };
  }, []);

  // calculating embeddings for photos
  // we depend on cached photos, so their loading needs to be completed before we can start
  useEffect(() => {
    if (
      cachedPhotosLoadingState === "COMPLETED" &&
      state.filteredPhotosLoadingState !== "CALCULATING_EMBEDDINGS" &&
      state.filteredPhotosLoadingState !== "COMPLETED" &&
      vectorStore &&
      textEmbeddingsReady
    ) {
      (async () => {
        await logPerformance(async () => {
          let processedPhotosCount = 0;
          const photosCountToProcess = cachedPhotos.length;

          const LOG_EVERY_N = 10;

          setState((prev) => ({
            ...prev,
            filteredPhotosLoadingState: "CALCULATING_EMBEDDINGS",
          }));

          while (processedPhotosCount < photosCountToProcess) {
            if (processedPhotosCount % LOG_EVERY_N === 0) {
              logger.filteredPhotos.info(
                `⚙️ Photos embeddings calculations (${processedPhotosCount}/${photosCountToProcess} currently done)`,
              );
            }

            // raw access to array but works
            // we store original uris in the DB that need to be matched with cached URI later during
            // similarity match
            await vectorStore.add(
              cachedPhotos[processedPhotosCount].originalPhotoUri,
            );

            processedPhotosCount++;
            setEmbeddingProgress(processedPhotosCount);
          }

          logger.filteredPhotos.info(
            `✅ Calculated ${photosCountToProcess} photos embeddings`,
          );

          setState((prev) => ({
            ...prev,
            filteredPhotosLoadingState: "COMPLETED",
          }));
        }, ["calculatePhotosEmbeddings"]);
      })();
    } else if (
      state.filteredPhotosLoadingState !== "CALCULATING_EMBEDDINGS" &&
      state.filteredPhotosLoadingState !== "COMPLETED"
    ) {
      logger.filteredPhotos.info(
        `🕒 Waiting for cached photos and vector store to load`,
      );
    }
  }, [
    cachedPhotos,
    cachedPhotosLoadingState,
    state.filteredPhotosLoadingState,
    textEmbeddingsReady,
    vectorStore,
  ]);

  const clearPhotosEmbeddings = useCallback(async () => {
    if (state.filteredPhotosLoadingState === "CALCULATING_EMBEDDINGS") {
      logger.filteredPhotos.warn(
        "❌ Recalculate photos embeddings is already in progress, skipping",
      );
      return;
    }

    logger.filteredPhotos.info("🔄 Recalculating photos embeddings");
    await vectorStore?.clearTable();
    setState({
      filteredPhotos: [],
      filteredPhotosLoadingState: "IDLE",
    });
    setEmbeddingProgress(0);
  }, [state.filteredPhotosLoadingState, vectorStore]);

  const query = useCallback(async (query: string) => {
    const embeddedQuery =
      query !== "" ? await textEmbeddings.forward(query) : [];
    logger.main.info("embedded query:", query);
    setQueryEmbedding(Array.from(embeddedQuery));
    setQueryChanged(true);
  }, []);

  /**
   * Set filtered photos bases on new query embedding
   * We only run it when cached photos fully loaded and AI models are loaded
   * We don't need all embeddings cached yet - but results won't be full!
   */
  useEffect(() => {
    // wait here for state.filteredPhotosLoadingState to be "COMPLETED"
    // if you only wish to work on full set of embedded photos
    if (
      !queryChanged ||
      cachedPhotosLoadingState !== "COMPLETED" ||
      !vectorStore
    ) {
      return;
    }

    if (queryEmbedding.length !== 0) {
      (async () => {
        const results = await vectorStore?.similaritySearchWithOwnEmbedding(
          queryEmbedding,
          SIMILARITY_THRESHOLD,
        );
        const photoUris = results?.map((el) => el.image_uri);

        const newFilteredPhotos = cachedPhotos.filter((photo) =>
          photoUris?.includes(photo.originalPhotoUri),
        );

        setState((prev) => ({
          ...prev,
          filteredPhotos: newFilteredPhotos,
        }));
      })();
    } else if (state.filteredPhotos.length !== cachedPhotos.length) {
      // If there is no query entered, then we should not filter any photos at all
      setState((prev) => ({
        ...prev,
        filteredPhotos: cachedPhotos,
      }));
    }

    setQueryChanged(false);
  }, [
    queryChanged,
    queryEmbedding,
    cachedPhotos,
    vectorStore,
    cachedPhotosLoadingState,
    state.filteredPhotos.length,
  ]);

  // We don't do cache reading per se - embeddings are stored in SQLite table, so they are always available after restart.

  return {
    ...state,
    embeddingProgress,
    query,
    clearPhotosEmbeddings,
  };
};
