import { colors } from "@/config/colors";
import React from "react";
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { scaledPixels } from "@/hooks/useScale";
import { FONT_MEDIUM, FONT_REGULAR } from "@/config/constants";

type SegmentOption<T extends string | number> = {
  label: string | number;
  value: T;
};

type SegmentedButtonProps<T extends string | number> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export const SegmentedButton = <T extends string | number>({
  options,
  value,
  onChange,
  style,
  buttonStyle,
  textStyle,
}: SegmentedButtonProps<T>) => {
  return (
    <View style={[styles.container, style]}>
      {options.map((option, index) => {
        const isSelected = option.value === value;
        const isFirst = index === 0;
        const isLast = index === options.length - 1;

        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.button,
              isSelected && styles.selectedButton,
              isFirst && styles.firstButton,
              isLast && styles.lastButton,
              buttonStyle,
            ]}
            onPress={() => onChange(option.value)}
          >
            <Text
              style={[
                styles.text,
                isSelected && styles.selectedText,
                textStyle,
              ]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: scaledPixels(8),
    overflow: "hidden",
  },
  button: {
    flex: 1,
    paddingVertical: scaledPixels(10),
    paddingHorizontal: scaledPixels(8),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderRadius: scaledPixels(8),
  },
  selectedButton: {
    backgroundColor: colors.blue,
  },
  firstButton: {
    borderTopLeftRadius: scaledPixels(8),
    borderBottomLeftRadius: scaledPixels(8),
  },
  lastButton: {
    borderTopRightRadius: scaledPixels(8),
    borderBottomRightRadius: scaledPixels(8),
  },
  text: {
    fontSize: scaledPixels(14),
    fontFamily: FONT_REGULAR,
    color: "#333",
  },
  selectedText: {
    color: colors.white,
    fontFamily: FONT_MEDIUM,
  },
});
