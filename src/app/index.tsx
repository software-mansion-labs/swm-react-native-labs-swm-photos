import { ImagesGalleryContainer } from "@/components/ImagesGalleryContainer";
import { ImagesGalleryList } from "@/components/ImagesGalleryList";
import { ModalTab } from "@/components/modal/ModalTab";
import { useGalleryUISettings } from "@/providers/GalleryUISettingsProvider";
import {
  useScreenDimensions,
  rotate,
} from "@/providers/ScreenDimensionsProvider";
import React from "react";
import { Platform } from "react-native";
import PhotoPreviewLayout from "./photo";

export default function PhotosGalleryLayout() {
  // Display-related settings & properties
  const { dimensions, displayMode } = useScreenDimensions();
  const { numberOfColumns, galleryGap } = useGalleryUISettings();

  // For mobile devices, we want to change UI a little bit after rotation of the screen
  const rotatedDimensions = rotate(dimensions);

  const dimensionsPortait =
    displayMode === "PORTRAIT" ? dimensions : rotatedDimensions;
  const dimensionsLandscape =
    displayMode === "PORTRAIT" ? rotatedDimensions : dimensions;

  const photoPreviewTimeout = Platform.isTV ? 500 : 300;

  // Note that we use different number of columns in landscape mode
  return (
    <>
      <ImagesGalleryContainer title="Your photos">
        {displayMode === "PORTRAIT" && (
          <ImagesGalleryList
            name="photos_gallery_list"
            dimensions={dimensionsPortait}
            numberOfColumns={numberOfColumns}
            galleryGap={galleryGap}
          />
        )}
        {displayMode === "LANDSCAPE" && (
          <ImagesGalleryList
            name="photos_gallery_list"
            dimensions={dimensionsLandscape}
            numberOfColumns={
              Platform.isTV
                ? numberOfColumns
                : Math.floor(
                    (numberOfColumns * dimensions.width) / dimensions.height,
                  )
            }
            galleryGap={galleryGap}
          />
        )}
      </ImagesGalleryContainer>
      <ModalTab
        name="photo_preview_modal"
        activationTimeout={photoPreviewTimeout}
        closeTimeout={photoPreviewTimeout}
        style={{ zIndex: 10 }}
      >
        {displayMode === "PORTRAIT" && (
          <PhotoPreviewLayout dimensions={dimensionsPortait} />
        )}
        {displayMode === "LANDSCAPE" && (
          <PhotoPreviewLayout dimensions={dimensionsLandscape} />
        )}
      </ModalTab>
    </>
  );
}
