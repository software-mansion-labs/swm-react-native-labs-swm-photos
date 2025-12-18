import { colors } from "@/config/colors";
import { PropsWithChildren } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ImagesGalleryHeader,
  ImagesGalleryHeaderProps,
} from "./ImagesGalleryHeader";
import { scaledPixels } from "@/hooks/useScale";
import { IS_WIDE_SCREEN } from "@/config/constants";

// Window properties
// - Nothing wrong with using static dimensions here since we only need height
const screenHeight = Dimensions.get("window").height;

export const ImagesGalleryContainer = ({
  children,
  title,
  subtitle,
}: PropsWithChildren & ImagesGalleryHeaderProps) => {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View
        style={[
          styles.imageContainer,
          IS_WIDE_SCREEN && styles.imageContainerWideScreen,
        ]}
      >
        <ImagesGalleryHeader title={title} subtitle={subtitle} />
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IS_WIDE_SCREEN ? colors.white : colors.blue,
  },
  imageContainer: {
    flex: 1,
    backgroundColor: colors.white,
    paddingTop: scaledPixels(80),
  },
  imageContainerWideScreen: {
    marginTop: screenHeight * 0.02,
    paddingTop: scaledPixels(80) + screenHeight * 0.02,
    overflow: "visible",
  },
});
