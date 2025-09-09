import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { scaledPixels } from "@/hooks/useScale";

export const NoPhotosMessage = () => {
  return (
    <View style={styles.container}>
      <View style={styles.messageContainer}>
        <Text style={styles.title}>📷</Text>
        <Text style={styles.message}>No Photos Available</Text>
        <Text style={styles.subtitle}>
          Your photo gallery is empty. Add some photos to your device to see
          them here.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scaledPixels(40),
  },
  messageContainer: {
    alignItems: "center",
    maxWidth: scaledPixels(400),
  },
  title: {
    fontSize: scaledPixels(48),
    marginBottom: scaledPixels(16),
  },
  message: {
    fontSize: scaledPixels(24),
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: scaledPixels(12),
  },
  subtitle: {
    fontSize: scaledPixels(16),
    color: "#666",
    textAlign: "center",
    lineHeight: scaledPixels(22),
  },
});
