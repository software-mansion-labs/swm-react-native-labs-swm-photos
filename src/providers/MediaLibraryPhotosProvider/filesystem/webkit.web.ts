import { FileFilter, FileOrderer } from "./files.web";
import { FileEntry, WebkitDirectory } from "./types.web";

/**
 * Scans given directions and loads all the files that meet the specified criterion
 *
 * @param directory - A webkit directory represented as a list of files
 * @param maxNoFiles - Maximum number of files to load
 * @param criterion - A predicate function that filters which files to include (returns true to include).
 * @param ordering  - A sorting function applied on obtained file list
 * @param orderingAsc - Whether to sort in ascending order
 * @returns A promise that resolves to an array of files matching the criterion.
 */
export function loadAllFiles(
  directory: WebkitDirectory,
  maxNoFiles: number = Infinity,
  criterion?: FileFilter<File>,
  ordering?: FileOrderer<FileEntry>,
  orderingAsc?: boolean,
): FileEntry[] {
  // We can instantly apply filtering
  const files = Array.from(directory || []).filter(
    (f) => !criterion || criterion(f),
  );
  const limitedFiles = Number.isFinite(maxNoFiles)
    ? files.slice(0, maxNoFiles)
    : files;

  // Convert to FileEntry objects
  const fileEntries = limitedFiles.map((file) => ({
    ...file,
    uri: URL.createObjectURL(file),
    name: file.name,
    path: (file as any).webkitRelativePath || file.name,
  }));

  // Sort files according to given ordering rule
  if (ordering) return ordering(fileEntries, orderingAsc ?? true);

  return fileEntries;
}
