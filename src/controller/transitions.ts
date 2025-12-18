import { ImagesGalleryListState, ModalTabState } from "./states";

/**
 * Transitions - to ModalTab components
 */

export function imageGalleryListToModalTabTransition(
  pprev: ImagesGalleryListState,
  pnext: ImagesGalleryListState,
  nprev: ModalTabState,
) {
  // We can simply return an active state, since list state can only change via selecting item = triggering the modal
  if (
    pnext.selectedPhoto &&
    (!pprev.selectedPhoto ||
      pprev.selectedPhoto!.index !== pnext.selectedPhoto!.index)
  )
    return "ACTIVATING";
  else return null;
}
