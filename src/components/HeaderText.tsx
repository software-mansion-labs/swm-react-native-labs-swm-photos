import { colors } from "@/config/colors";
import { PropsWithChildren } from "react";
import { StyleProp, StyleSheet, Text, TextStyle } from "react-native";
import { scaledPixels } from "@/hooks/useScale";
import { FONT_BOLD } from "@/config/constants";

type HeaderTextProps = PropsWithChildren & {
  style?: StyleProp<TextStyle>;
  invert?: boolean;
  size?: number;
};

export const HeaderText = ({
  style,
  children,
  invert,
  size = scaledPixels(20),
}: HeaderTextProps) => {
  return (
    <Text
      style={[
        styles.text,
        { fontSize: size },
        invert && styles.invertColor,
        style,
      ]}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    color: colors.blue,
    fontFamily: FONT_BOLD,
    marginBottom: scaledPixels(4),
    textAlign: "center",
  },
  invertColor: {
    color: colors.white,
  },
});
