import { useCallback, useEffect, useState } from "react";
import { MMKV } from "react-native-mmkv";

const storage = new MMKV({
  id: "persisted-state",
});

export type PersistedStateStatus = "RESTORING" | "IN_MEMORY";

/**
 * A hook that works like useState but with persistence capabilities.
 * It automatically saves state changes to disk and restores the state on mount.
 *
 * @param key - Unique key for storing the value in persistent storage
 * @param initialValue - Initial value if no persisted value exists
 * @returns Object containing the current value, setter function, and restoration status
 */
export function usePersistedState<T>(key: string, initialValue: T) {
  const [{ value, restorationStatus }, setState] = useState<{
    value: T;
    restorationStatus: PersistedStateStatus;
  }>({
    value: initialValue,
    restorationStatus: "RESTORING",
  });

  // Load persisted value on mount
  useEffect(() => {
    const restorePersistedState = async () => {
      try {
        const persistedValue = storage.getString(key);

        // console.log(`${key}: persisted value: ${persistedValue}`);

        if (persistedValue != null) {
          // Try to parse the persisted value
          try {
            const parsedValue = JSON.parse(persistedValue);
            // console.log(`${key}: parsed value: ${persistedValue}`);
            setState((prev) => ({
              ...prev,
              value: parsedValue,
              restorationStatus: "IN_MEMORY",
            }));
          } catch (parseError) {
            logger.main.error(
              `Failed to parse persisted value for key "${key}":`,
              parseError,
            );
            // If parsing fails, use the raw value (for primitive types)
            setState((prev) => ({
              ...prev,
              value: persistedValue as T,
              restorationStatus: "IN_MEMORY",
            }));
          }
        } else {
          // No persisted value found, using initial value
          setState((prev) => ({
            ...prev,
            restorationStatus: "IN_MEMORY",
          }));
        }
      } catch (error) {
        logger.main.error(
          `Failed to restore persisted value for key "${key}":`,
          error,
        );
        setState((prev) => ({
          ...prev,
          restorationStatus: "IN_MEMORY",
        }));
      }
    };

    restorePersistedState();
  }, [key]);

  // Wrapper for setValue that also persists the new value
  const setStateAndPersist = useCallback(
    (state: T | ((prev: T) => T)) => {
      setState((prev) => {
        const value =
          typeof state === "function"
            ? (state as (prev: T) => T)(prev.value)
            : state;

        // trigger asynchronous save
        setTimeout(() => saveToStorage(key, value), 0);

        return {
          ...prev,
          value,
        };
      });
    },
    [key],
  );

  return [value, setStateAndPersist, restorationStatus] as const;
}

const saveToStorage = (key: string, value: any) => {
  try {
    const valueToStore =
      typeof value === "object" ? JSON.stringify(value) : String(value);
    storage.set(key, valueToStore);
  } catch (error) {
    logger.main.error(`Failed to persist value for key "${key}":`, error);
  }
};
