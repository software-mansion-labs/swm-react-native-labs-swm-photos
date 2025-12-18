import { Image as ExpoImage } from "expo-image";
import { PlaceholderProps } from "./types";
import { StyleSheet, View } from "react-native";
import { colors } from "@/config/colors";

const BACKGROUND_COLORS = [
  colors.yellow,
  colors.sea,
  colors.pink,
  colors.green,
];

export const PlaceholderStaticImage = ({ size, index }: PlaceholderProps) => {
  const backgroundColor = BACKGROUND_COLORS[index % BACKGROUND_COLORS.length];
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          backgroundColor,
        },
        styles.container,
      ]}
    >
      <ExpoImage
        source={require("@/assets/images/adaptive-icon.png")}
        style={{ width: size / 2, height: size / 2, borderRadius: 100 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
