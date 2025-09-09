import { Button } from "@/components/Button";
import { ImagesGalleryContainer } from "@/components/ImagesGalleryContainer";
import { Logo } from "@/components/Logo";
import { scaledPixels } from "@/hooks/useScale";
import { useMediaLibraryPhotos } from "@/providers/MediaLibraryPhotosProvider/MediaLibraryPhotosProvider.web";
import { useScreenDimensions } from "@/providers/ScreenDimensionsProvider";
import React, { useCallback, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ImagesGalleryList } from "@/components/ImagesGalleryList";
import { useGalleryUISettings } from "@/providers/GalleryUISettingsProvider";

export default function PhotosGalleryLayout() {
  const { dimensions } = useScreenDimensions();
  const { numberOfColumns, galleryGap } = useGalleryUISettings();

  // Reference to access the input object
  const inputRef = useRef<HTMLInputElement>(null);

  const { api, photosDirectory, changePhotosDirectory } =
    useMediaLibraryPhotos();

  /**
   * Handlers - directory selection with filesystem api & webkit
   */
  const handleDirectorySelect = useCallback(() => {
    // Use File System Access API as a default, unless we are sure it's not available
    if (api === "filesystem" && "showDirectoryPicker" in window)
      handleFilesystemDirectorySelect();
    else handleWebkitDirectorySelect();
  }, [api]);

  // Opens directory picker window
  const handleFilesystemDirectorySelect = async () => {
    try {
      // Request directory access
      // @ts-ignore
      const dirHandle = await window.showDirectoryPicker({ mode: "read" });

      changePhotosDirectory(dirHandle, "filesystem");
    } catch (err: any) {
      // User cancelled the picker
      if (err.name === "AbortError") return;

      logger.filesystem.error("Error selecting folder:", err);

      // Check if it's the iframe error and suggest fallback
      if (err.message.includes("Cross origin sub frames")) {
        logger.filesystem.info(
          "File System API is not available in this environment. The app will use the fallback file selection method.",
        );
        handleWebkitDirectorySelect();
      }
    }
  };

  // Redirects to the input webkit element
  const handleWebkitDirectorySelect = () => {
    inputRef.current?.click();
  };

  /**
   * Directory selector screen
   */
  if (photosDirectory == null) {
    return (
      <>
        <SelectDirectoryScreen onButtonPress={handleDirectorySelect} />
        <input
          type="file"
          // @ts-ignore
          webkitdirectory=""
          multiple
          accept="image/*"
          ref={inputRef}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            changePhotosDirectory(e.target.files, "webkit")
          }
          style={{ display: "none" }}
        />
      </>
    );
  }

  /**
   * Gallery list screen
   */
  return (
    <ImagesGalleryContainer title="Your photos">
      <ImagesGalleryList
        dimensions={dimensions}
        numberOfColumns={numberOfColumns}
        galleryGap={galleryGap}
      />
    </ImagesGalleryContainer>
  );
}

const SelectDirectoryScreen = ({
  onButtonPress,
}: {
  onButtonPress: () => void;
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Logo />
        <Button onPress={onButtonPress}>Select images directory</Button>
      </View>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    alignItems: "center",
    rowGap: scaledPixels(30),
  },
});
