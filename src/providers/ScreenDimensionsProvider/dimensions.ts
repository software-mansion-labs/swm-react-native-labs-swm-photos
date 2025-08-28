import { Resolution } from "@/hooks/useScale";

// Create an alias for better readability
export type Dimensions = Resolution;

export type DisplayMode = "PORTRAIT" | "LANDSCAPE";

/**
 * Helper function - check for effective window mode (based on window proportions)
 *
 * @param dimensions - screen dimensions
 * @returns Either PORTRAIT or LANDSCAPE mode
 */
export function mode(dimensions: Dimensions): DisplayMode {
  return dimensions.height >= dimensions.width ? "PORTRAIT" : "LANDSCAPE";
}

/**
 * Helper function - flip dimensions (change display mode)
 *
 * @param dimensions - screen dimensions
 */
export function rotate(dimensions: Dimensions): Dimensions {
  return { width: dimensions.height, height: dimensions.width };
}
