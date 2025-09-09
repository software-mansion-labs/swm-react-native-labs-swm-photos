import { Button } from "@/components/Button";
import { HeaderText } from "@/components/HeaderText";
import { Label } from "@/components/Label";
import LoadingProgressView from "@/components/LoadingProgressView";
import { Logo } from "@/components/Logo";
import { SegmentedButton } from "@/components/SegmentedButton";
import { SWMLogo } from "@/components/SWMLogo";
import { colors } from "@/config/colors";
import { BUILD_TYPE } from "@/config/constants";
import { scaledPixels } from "@/hooks/useScale";
import { useCachedPhotos } from "@/providers/CachedPhotosProvider";
import { useGalleryUISettings } from "@/providers/GalleryUISettingsProvider";
import { useMediaLibraryPhotos } from "@/providers/MediaLibraryPhotosProvider";
import { usePerformanceLogs } from "@/utils/logPerformance";
import { useTimersData } from "@/utils/useMeasureImageLoadTime";
import { useNavigation } from "expo-router";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsLayout() {
  const {
    galleryGap,
    setGalleryGap,
    numberOfColumns,
    setNumberOfColumns,
    offscreenDrawDistanceWindowSize,
    setOffscreenDrawDistanceWindowSize,
    availableColumnCounts,
    availableGalleryGaps,
    availableOffscreenDrawDistanceWindowSizes,
  } = useGalleryUISettings();
  const {
    mediaLibraryPermissionsStatus,
    mediaLibraryLoadingState,
    mediaLibraryPhotosCount,
    mediaLibraryPhotos,
    reloadMediaLibraryPhotos,
  } = useMediaLibraryPhotos();
  const { cachedPhotos, cachedPhotosLoadingState, recalculateCachedPhotos } =
    useCachedPhotos();

  const { resetTimers, timersData } = useTimersData();
  const { resetLogs, performanceLogs } = usePerformanceLogs();

  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeAreaView}>
      <ScrollView contentContainerStyle={styles.container}>
        <Logo />

        <View style={styles.optionsContainer}>
          <HeaderText>Photos gallery columns count</HeaderText>
          <SegmentedButton
            options={availableColumnCounts.map((count) => ({
              label: count,
              value: count,
            }))}
            value={numberOfColumns}
            onChange={setNumberOfColumns}
          />
        </View>

        <View style={styles.optionsContainer}>
          <HeaderText>
            MediaLibrary permissions: {mediaLibraryPermissionsStatus}
          </HeaderText>
          <LoadingProgressView
            total={mediaLibraryPhotosCount ?? 0}
            current={mediaLibraryPhotos.length}
            label={mediaLibraryLoadingState}
          />
          <Button onPress={async () => await reloadMediaLibraryPhotos()}>
            Reload MediaGallery photos
          </Button>
        </View>

        <View style={styles.optionsContainer}>
          <LoadingProgressView
            total={mediaLibraryPhotosCount ?? 0}
            current={cachedPhotos.length}
            label={cachedPhotosLoadingState}
          />
          <Button onPress={() => recalculateCachedPhotos()}>
            Recalculate cached photos {"\n"}(delete the whole cache)
          </Button>
        </View>

        {BUILD_TYPE === "dev" && (
          <>
            <View style={styles.optionsContainer}>
              <HeaderText>Photos gallery gap</HeaderText>
              <SegmentedButton
                options={availableGalleryGaps.map((gap) => ({
                  label: gap,
                  value: gap,
                }))}
                value={galleryGap}
                onChange={setGalleryGap}
              />
            </View>

            <View style={styles.optionsContainer}>
              <HeaderText>Lists draw distance window size</HeaderText>
              <SegmentedButton
                options={availableOffscreenDrawDistanceWindowSizes.map(
                  (distance) => ({
                    label: distance,
                    value: distance,
                  }),
                )}
                value={offscreenDrawDistanceWindowSize}
                onChange={setOffscreenDrawDistanceWindowSize}
              />
            </View>

            <View style={styles.optionsContainer}>
              <HeaderText>Image components timings</HeaderText>
              <Label>{getLoadTimesAverage("Image", timersData.Image)}</Label>
              <Label>
                {getLoadTimesAverage("ExpoImage", timersData.ExpoImage)}
              </Label>
              <Button onPress={resetTimers}>Reset timings</Button>
            </View>

            <View style={styles.optionsContainer}>
              <HeaderText>Performance logs</HeaderText>
              <Label>{JSON.stringify(performanceLogs)}</Label>
              <Button onPress={resetLogs}>Reset logs</Button>
            </View>
          </>
        )}

        <SWMLogo />

        {Platform.isTV && (
          <Button
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            Close
          </Button>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getLoadTimesAverage(
  componentName: string,
  loadTimes: {
    averageLoadTimeFromMount: number;
    averageLoadTimeFromStartLoading: number;
  },
) {
  const timeFromMount = isNaN(loadTimes.averageLoadTimeFromMount)
    ? "N/A"
    : `${loadTimes.averageLoadTimeFromMount.toFixed(2)}ms`;
  const timeFromLoadStart = isNaN(loadTimes.averageLoadTimeFromStartLoading)
    ? "N/A"
    : `${loadTimes.averageLoadTimeFromStartLoading.toFixed(2)}ms`;

  return `${componentName} average load time from mount: ${timeFromMount}\n${componentName}, average load time from start loading: ${timeFromLoadStart}`;
}

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
  },
  container: {
    justifyContent: "space-between",
    alignItems: "center",
    rowGap: scaledPixels(24),
    padding: scaledPixels(16),
  },
  optionsContainer: {
    rowGap: scaledPixels(16),
    width: "100%",
  },
  closeButton: {
    width: "25%",
    marginTop: scaledPixels(24),
    marginBottom: scaledPixels(12),
    alignSelf: "center",
    backgroundColor: colors.pink,
  },
});
