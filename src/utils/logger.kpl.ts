type LoggingMethods = {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

const createSimpleLogger = (prefix: string): LoggingMethods => ({
  debug: (...args: unknown[]) => console.log(`[USER-DEBUG][${prefix}]`, ...args),
  info: (...args: unknown[]) => console.log(`[USER-INFO][${prefix}]`, ...args),
  warn: (...args: unknown[]) => console.log(`[USER-WARN][${prefix}]`, ...args),
  error: (...args: unknown[]) => console.log(`[USER-ERROR][${prefix}]`, ...args),
});

// @ts-expect-error assigning new global variable
globalThis.logger = {
  main: createSimpleLogger("main"),
  mediaLibrary: createSimpleLogger("mediaLibrary"),
  cachedPhotos: createSimpleLogger("cachedPhotos"),
  performance: createSimpleLogger("performance"),
  filesystem: createSimpleLogger("filesystem"),
};

export {};
