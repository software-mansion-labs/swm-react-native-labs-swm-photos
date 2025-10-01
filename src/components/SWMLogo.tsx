import { SWMANSION_URL } from "@/config/constants";
import React from "react";
import { Linking, Platform, TouchableOpacity } from "react-native";
import { scaledPixels } from "@/hooks/useScale";
import { SvgImage } from "./image/SvgImage";

//@ts-ignore
const SWM_LOGO_SOURCE = Platform.OS === "kepler" ? 
  "/pkg/assets/svg/swmansion-logo.svg" :
  require("@/assets/svg/swmansion-logo.svg");

export function SWMLogo() {
  return (
    <TouchableOpacity
      onPress={() => Linking.openURL(SWMANSION_URL)}
      style={{ alignItems: "center" }}
    >
      <SvgImage
        source={SWM_LOGO_SOURCE}
        width={scaledPixels(124)}
        height={scaledPixels(84)}
      />
    </TouchableOpacity>
  );
}
