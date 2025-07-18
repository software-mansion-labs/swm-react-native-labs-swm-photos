import { colors } from "@/config/colors";
import { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ImagesGalleryHeader,
  ImagesGalleryHeaderProps,
} from "./ImagesGalleryHeader";

export const ImagesGalleryContainer = ({
  children,
  title,
  subtitle,
}: PropsWithChildren & ImagesGalleryHeaderProps) => {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.imageContainer}>
        <ImagesGalleryHeader title={title} subtitle={subtitle} />
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.blue,
  },
  imageContainer: {
    flex: 1,
    backgroundColor: colors.white,
    paddingTop: 80,
  },
});
