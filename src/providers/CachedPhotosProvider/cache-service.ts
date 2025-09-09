import { MMKV } from "react-native-mmkv";
import { MediaLibraryPhoto } from "../MediaLibraryPhotosProvider/useMediaLibraryPhotos";
import { Platform } from "react-native";

export type CachedPhotoType = {
  originalPhotoUri: string;
  mipmapWidth: number;
  cachedPhotoUri: string;
};

type CacheKey = {
  originalPhotoUri: string;
  mipmapWidth: number;
};

export const storage = new MMKV({
  id: "photos-cache",
});

/**
 * Queries the cache for a photo.
 */
export const getPhotoFromCache = async (
  photoKey: CacheKey,
): Promise<CachedPhotoType | undefined> => {
  if (!(await existsInCache(photoKey))) {
    return;
  }

  const cachedPhotoUri = storage.getString(cacheKeyToString(photoKey));
  if (!cachedPhotoUri) {
    return;
  }

  // Since expo-file-system does not support web, we need to omit this step in case of web build
  if (Platform.OS !== "web") {
    // Dynamic import
    const { File } = await import("expo-file-system/next");

    const fileInfo = new File(cachedPhotoUri);
    if (!fileInfo.exists) {
      return;
    }
  }

  return {
    cachedPhotoUri: cachedPhotoUri,
    originalPhotoUri: photoKey.originalPhotoUri,
    mipmapWidth: photoKey.mipmapWidth,
  };
};

/**
 * Clears the cache effectively wiping out all stored photos.
 */
export const clearCache = async () => {
  storage.clearAll();
};

/**
 * Loads all photos from the cache that match the {@link mipmapWidth} and {@link mediaLibraryPhotos} unless there's no match even for a single photo.
 * @returns photos that match the {@link mipmapWidth}
 */
export const loadAllPhotosFromCache = (
  mediaLibraryPhotos: MediaLibraryPhoto[],
  mipmapWidth: number,
): CachedPhotoType[] => {
  const results = storage.getAllKeys();
  const pairs = results.map((key) => [key, storage.getString(key)]);

  const sizeMatchingPhotos = pairs
    .map((pair) => {
      if (!pair[0] || !pair[1]) {
        return;
      }

      const { originalPhotoUri, mipmapWidth } = cacheKeyFromString(pair[0]);

      return {
        originalPhotoUri,
        mipmapWidth,
        cachedPhotoUri: pair[1],
      };
    })
    .filter((photo): photo is NonNullable<typeof photo> => photo !== undefined)
    .filter((photo) => photo.mipmapWidth === Number(mipmapWidth.toFixed(2)))
    .reduce(
      (acc, el) => {
        acc[el.originalPhotoUri] = el;
        return acc;
      },
      {} as Record<string, CachedPhotoType>,
    );

  const matchingPhotos = mediaLibraryPhotos
    .map((photo) => {
      const cachedPhoto = sizeMatchingPhotos[photo.uri];
      if (!cachedPhoto) {
        return;
      }

      return cachedPhoto;
    })
    .filter((photo): photo is NonNullable<typeof photo> => photo !== undefined);

  return matchingPhotos.length === mediaLibraryPhotos.length
    ? matchingPhotos
    : [];
};

/**
 * Checks if a photo is in the cache.
 */
const existsInCache = async (cacheKey: CacheKey) => {
  return Boolean(storage.getString(cacheKeyToString(cacheKey)));
};

const cacheKeyToString = (cacheKey: CacheKey): string => {
  return `${cacheKey.originalPhotoUri}--${cacheKey.mipmapWidth.toFixed(2)}`;
};

const cacheKeyFromString = (photoKeyString: string): CacheKey => {
  const [originalPhotoUri, mipmapWidth] = photoKeyString.split("--");
  return {
    originalPhotoUri,
    mipmapWidth: Number(parseFloat(mipmapWidth).toFixed(2)),
  };
};

/**
 * Stores a photo in the cache.
 */
export const setPhotoInCache = async (
  cacheKey: CacheKey,
  cachedPhotoUri: string,
): Promise<CachedPhotoType> => {
  storage.set(cacheKeyToString(cacheKey), cachedPhotoUri);

  return {
    originalPhotoUri: cacheKey.originalPhotoUri,
    mipmapWidth: cacheKey.mipmapWidth,
    cachedPhotoUri: cachedPhotoUri,
  };
};
