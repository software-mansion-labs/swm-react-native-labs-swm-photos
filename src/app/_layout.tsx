import * as SplashScreen from "expo-splash-screen";
import { CachedPhotosProvider } from "@/providers/CachedPhotosProvider";
import { GalleryUISettingsProvider } from "@/providers/GalleryUISettingsProvider";
import { MediaLibraryPhotosProvider } from "@/providers/MediaLibraryPhotosProvider";
import { ScreenDimensionsProvider } from "@/providers/ScreenDimensionsProvider";
import { NavigationStack } from "@/components/navigation/NavigationStack";
import "@/utils/logger";
import { FocusRefProvider } from "@/providers/FocusRefProvider";

/**
 * We call `SplashScreen.hide` in the `index.tsx` file once the app layout is ready.
 */
SplashScreen.preventAutoHideAsync();

// Since not all of the expo-splash-screen versions support this method, we use a conditional here
if ("setOptions" in SplashScreen && typeof SplashScreen.setOptions === "function") {
  SplashScreen.setOptions({
    duration: 200,
    fade: true,
  });
}


export default function RootLayout() {
  return (
    <FocusRefProvider>
      <ScreenDimensionsProvider>
        <GalleryUISettingsProvider>
          <MediaLibraryPhotosProvider>
            <CachedPhotosProvider>
              <NavigationStack screenOptions={{ headerShown: false }} />
            </CachedPhotosProvider>
          </MediaLibraryPhotosProvider>
        </GalleryUISettingsProvider>
      </ScreenDimensionsProvider>
    </FocusRefProvider>
  );
}
