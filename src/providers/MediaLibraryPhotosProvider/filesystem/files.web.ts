// Filter type definition
export type FileFilter<T extends File> = (file: T) => boolean;

/**
 * A predicate to check whether file is an image
 *
 * @param file - File to check
 */
export function isImageFile<T extends File = File>(file: T): boolean {
  return (
    file.type.startsWith("image/") ||
    /\.(jpg|jpeg|png|gif|bmp|webp|svg|avif|heic)$/i.test(file.name)
  );
}

// Ordering function type definition
export type FileOrderer<T extends File> = (files: T[], asc: boolean) => T[];

/**
 * Sorts an array of File objects by file name.
 *
 * @param files - Array of File objects to sort.
 * @param asc - If true, sorts in ascending order (A–Z); if false, descending (Z–A).
 */
export function sortByName<T extends File = File>(
  files: T[],
  asc: boolean,
): T[] {
  return files.sort((a, b) =>
    asc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
  );
}

/**
 * Sorts an array of File objects by last modification date.
 *
 * @param files - Array of File objects to sort.
 * @param asc - If true, sorts in ascending order (oldest first); if false, descending (newest first).
 */
export function sortByModificationDate<T extends File = File>(
  files: T[],
  asc: boolean,
): T[] {
  return files.sort((a, b) =>
    asc ? a.lastModified - b.lastModified : b.lastModified - a.lastModified,
  );
}
