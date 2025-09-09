import { BUILD_ID, BUILD_ID_KEY } from "@/config/constants";

export type StoredDirectory = {
  name: string;
  timestamp: number;
  handle?: FileSystemDirectoryHandle;
  path?: string; // Fallback for non-File System API environments
};

// IndexedDB utilities for storing directory handles and folder paths
const DB_NAME = "PhotoGalleryDB";
const DB_VERSION = 1;
const STORE_NAME = "directoryHandles";
const HANDLE_KEY = "selectedDirectory";

export class DirectoryStorage {
  // Static reference to the IndexedDB database
  private static db: IDBDatabase | null = null;

  /**
   * Initializes the IndexedDB database and creates the object store if needed.
   */
  static async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        DirectoryStorage.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  /**
   * Stores a directory object (handle, name, timestamp, optional path) in the database.
   *
   * @param handle - FileSystemDirectoryHandle or null
   * @param name - Directory name
   * @param path - Optional fallback path string
   */
  static async storeDirectory(
    handle: FileSystemDirectoryHandle | null,
    name: string,
    path?: string,
  ): Promise<void> {
    if (!DirectoryStorage.db) await DirectoryStorage.init();

    const tx = DirectoryStorage.db!.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const stored: StoredDirectory = {
      handle: handle || undefined,
      name,
      timestamp: Date.now(),
      path,
    };

    return new Promise((resolve, reject) => {
      const request = store.put(stored, HANDLE_KEY);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Retrieves the stored directory object from the database.
   *
   * @returns A StoredDirectory object or null if not found.
   */
  static async getStoredDirectory(): Promise<StoredDirectory | null> {
    if (!DirectoryStorage.db) await DirectoryStorage.init();

    const tx = DirectoryStorage.db!.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(HANDLE_KEY);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  /**
   * Removes the stored directory object from the database.
   */
  static async clearStoredDirectory(): Promise<void> {
    if (!DirectoryStorage.db) await DirectoryStorage.init();

    const tx = DirectoryStorage.db!.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete(HANDLE_KEY);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Checks if the build has changed. If yes, clears stored directory.
   * NOTE: only for a better showcase of storage functionality
   */
  static async clearOnBuildChange(): Promise<void> {
    const lastBuild = localStorage.getItem(BUILD_ID_KEY);
    logger.main.debug(`${lastBuild} | ${BUILD_ID}`);
    if (lastBuild !== BUILD_ID) {
      await DirectoryStorage.clearStoredDirectory();
      localStorage.setItem(BUILD_ID_KEY, BUILD_ID!);
    }
  }
}
