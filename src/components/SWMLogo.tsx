import { SWMANSION_URL } from "@/config/constants";
import { Image } from "expo-image";
import React from "react";
import { Linking, StyleSheet, TouchableOpacity } from "react-native";
import { scaledPixels } from "@/hooks/useScale";

export function SWMLogo() {
  return (
    <TouchableOpacity
      onPress={() => Linking.openURL(SWMANSION_URL)}
      style={{ alignItems: "center" }}
    >
      <Image
        source={require("@/assets/svg/swmansion-logo.svg")}
        style={styles.companyLogo}
        contentFit="contain"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  companyLogo: {
    height: scaledPixels(60),
    width: scaledPixels(108),
  },
});
