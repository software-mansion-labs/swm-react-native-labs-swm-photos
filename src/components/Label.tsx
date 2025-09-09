import { colors } from "@/config/colors";
import { FONT_BOLD } from "@/config/constants";
import { scaledPixels } from "@/hooks/useScale";
import { PropsWithChildren } from "react";
import { StyleSheet, Text } from "react-native";

type LabelProps = PropsWithChildren;

export const Label = ({ children }: LabelProps) => {
  return <Text style={styles.text}>{children}</Text>;
};

const styles = StyleSheet.create({
  text: {
    fontVariant: ["tabular-nums"],
    color: colors.blue,
    fontFamily: FONT_BOLD,
    fontSize: scaledPixels(16),
  },
});
