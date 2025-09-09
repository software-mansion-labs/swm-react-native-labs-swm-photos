import React from "react";
import { findNodeHandle } from "react-native";

/**
 * Global reference names
 *
 * Can refer to any React component
 */
export const references = [
  "settings",
  // Add more if needed
];

// Helper function - obtaining reference handle
export function getHandle(ref: React.RefObject<any>) {
  return findNodeHandle(ref.current) ?? undefined;
}
