import { colors } from "@/config/colors";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, View } from "react-native";
import { scaledPixels } from "@/hooks/useScale";

export function Logo() {
  return (
    <View style={styles.logoContainer}>
      <Image
        source={require("@/assets/images/adaptive-icon.png")}
        style={styles.logo}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    backgroundColor: colors.blue,
    borderRadius: scaledPixels(100),
    padding: scaledPixels(20),
  },
  logo: {
    height: scaledPixels(88),
    width: scaledPixels(88),
  },
});
