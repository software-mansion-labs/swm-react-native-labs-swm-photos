const bundleIdentifier =
  process.env.EXPO_BUNDLE_IDENTIFIER ?? "com.swmansion.photos";
const androidPackage =
  process.env.EXPO_ANDROID_PACKAGE ?? "com.swmansion.photos";

export default {
  expo: {
    name: "SWM Photos",
    slug: "swm-photos",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "swmphotos",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#001A72",
      },
      edgeToEdgeEnabled: true,
      permissions: [
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.ACCESS_MEDIA_LOCATION",
      ],
      package: androidPackage,
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-sqlite",
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 108,
          resizeMode: "contain",
          backgroundColor: "#001A72",
        },
      ],
      [
        "expo-media-library",
        {
          photosPermission: "Allow $(PRODUCT_NAME) to access your photos.",
          savePhotosPermission: "Allow $(PRODUCT_NAME) to save photos.",
          isAccessMediaLocationEnabled: true,
        },
      ],
      [
        "expo-font",
        {
          fonts: ["./assets/fonts/Aeonik-Medium.ttf"],
        },
      ],
      ["./config-plugins/withProfileable"],
    ],
    experiments: {
      typedRoutes: true,
    },
  },
};
