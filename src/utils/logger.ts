import { consoleTransport, defLvlType, logger } from "react-native-logs";

type LoggingMethods = Record<defLvlType, (...args: unknown[]) => void>;

const rootLogger = logger.createLogger({
  transport: consoleTransport,
  transportOptions: {
    colors: {
      debug: "cyanBright",
      info: "default",
      warn: "yellowBright",
      error: "redBright",
    },
    extensionColors: {
      main: "default",
      mediaLibrary: "blueBright",
      cachedPhotos: "greenBright",
      performance: "magentaBright",
    },
  },
});

declare global {
  const logger: Record<
    "main" | "mediaLibrary" | "cachedPhotos" | "performance" | "filesystem",
    LoggingMethods
  >;
}

// @ts-expect-error assigning new global variable
globalThis.logger = {
  main: rootLogger.extend("main"),
  mediaLibrary: rootLogger.extend("mediaLibrary"),
  cachedPhotos: rootLogger.extend("cachedPhotos"),
  performance: rootLogger.extend("performance"),
  filesystem: rootLogger.extend("filesystem"),
};
