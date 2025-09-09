export type API = "filesystem" | "webkit";

export type Directory = FilesystemDirectory | WebkitDirectory;

// For File System Acess API
export type FilesystemDirectory = FileSystemDirectoryHandle;

// For webkitdirectory API (fallback)
export type WebkitDirectory = FileList;

// A File object decorated with URL object - enables to display photos content
export type FileEntry = {
  uri: string;
  name: string;
  path: string;
} & File;
