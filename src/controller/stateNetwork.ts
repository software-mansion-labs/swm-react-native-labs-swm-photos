import { ImagesGalleryListState, ModalTabState } from "./states";
import { imageGalleryListToModalTabTransition } from "./transitions";
import { StateLink, StateNetwork } from "./types";

/**
 * State graph network deinition
 *
 * This structure should be manually updated each time we want to add a new component to the dependency network
 */

export const stateNetwork: StateNetwork = {
  photos_gallery_list: {
    initialState: { selectedPhoto: null },
    locked: false,
    links: [
      {
        name: "photo_preview_modal",
        transition: imageGalleryListToModalTabTransition,
      } as StateLink<ImagesGalleryListState, ModalTabState>,
    ],
  },
  photo_preview_modal: {
    initialState: "CLOSED",
    locked: false,
    links: [],
  },
};
