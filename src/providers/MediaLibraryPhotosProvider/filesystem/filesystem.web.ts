import { FileFilter, FileOrderer } from "./files.web";
import { FileEntry, FilesystemDirectory } from "./types.web";

/**
 * Scans given directions and loads all the files that meet the specified criterion
 *
 * @param directory - A FileSystemDirectoryHandle representing the root directory to scan.
 * @param maxNoFiles - Maximum number of files to load
 * @param criterion - A predicate function that filters which files to include (returns true to include).
 * @param ordering  - A sorting function applied on obtained file list
 * @param orderingAsc - Whether to sort in ascending order
 * @param recursive - If set to true, recursively scans subdirectories of given directory
 * @returns A promise that resolves to an array of files matching the criterion.
 */
export async function loadAllFiles(
  directory: FilesystemDirectory,
  maxNoFiles: number = Infinity,
  criterion?: FileFilter<FileEntry>,
  ordering?: FileOrderer<FileEntry>,
  orderingAsc?: boolean,
  recursive?: boolean,
): Promise<FileEntry[]> {
  const files: FileEntry[] = [];
  try {
    // @ts-ignore
    for await (const [name, handle] of directory.entries()) {
      if (files.length >= maxNoFiles) break;
      if (handle.kind === "file") {
        try {
          const file = await handle.getFile();
          if (criterion && criterion(file)) {
            files.push({
              ...file,
              uri: URL.createObjectURL(file),
              name: file.name,
              path: name,
            });
          }
        } catch (err) {
          logger.filesystem.warn(`Could not access file ${name}:`, err);
        }
      } else if (handle.kind === "directory" && recursive) {
        try {
          const subFiles = await loadAllFiles(
            handle,
            maxNoFiles - files.length,
            criterion,
            ordering,
            orderingAsc,
            name,
          );
          files.push(...subFiles);
        } catch (err) {
          logger.filesystem.warn(`Could not access directory ${name}:`, err);
        }
      }
    }
  } catch (err) {
    logger.filesystem.error("Error reading directory:", err);
    throw new Error("Failed to read directory contents");
  }

  if (ordering) return ordering(files, orderingAsc ?? true);
  return files;
}
