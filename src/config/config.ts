// --------------------
// Media library config
// --------------------

// A limitation for photos loaded in photos gallery from device / local filesystem
// - Set to Infinity if you want to disable it
export const MEDIA_LIBRARY_PHOTOS_LIMIT = Infinity;

// ------------------
// UI config - images
// ------------------

// Decides whether to use image native components from expo-image or react-native-image
export const IMAGE_NATIVE_PRESET: "expo" | "rni" = "expo";

// ----------------------
// UI config - UI scaling
// ----------------------

// A relative screen size preset for UI scaling (phone, tablet or fullhd)
export const UI_DESIGN_PRESET: "phone" | "tablet" | "fullhd" = "phone";

// How should UI be scaled for custom device screen (via screen height or diagonal)
export const UI_SCALING_METHOD: "height" | "diagonal" = "height";
