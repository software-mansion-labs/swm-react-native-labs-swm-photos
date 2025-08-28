#!/usr/bin/env bun
import inquirer from "inquirer";
import cliProgress from "cli-progress";
import { exec as _exec } from "node:child_process";
import { stat as _stat, mkdirSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { promisify } from "node:util";

const exec = promisify(_exec);
const stat = promisify(_stat);

// Paths
const PHOTOS_PATH = resolve(__dirname, "../assets/photos");
const NUMBERED_PHOTOS_PATH = resolve(
  __dirname,
  "../assets/photos/numbered-photos",
);

const NUMBERED_PHOTOS_BASENAME = "numbered-photos";

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

type IosSimulatorsJson = {
  devices: Record<
    string,
    {
      name: string;
      udid: string;
      state: string;
      isAvailable: boolean;
      deviceTypeIdentifier: string;
    }[]
  >;
};

/**
 * Query the system for available iOS simulators
 */
async function getAvailableIosSimulators(): Promise<
  {
    name: string;
    udid: string;
    state: string;
    runtime: string;
  }[]
> {
  const output = await exec("xcrun simctl list --json");
  const data = JSON.parse(output.stdout) as IosSimulatorsJson;
  const result: {
    name: string;
    udid: string;
    state: string;
    runtime: string;
  }[] = [];

  for (const [runtime, devices] of Object.entries(data.devices)) {
    for (const device of devices) {
      if (device.isAvailable) {
        result.push({
          name: device.name,
          udid: device.udid,
          state: device.state,
          runtime,
        });
      }
    }
  }
  return result;
}

// Device types

type DeviceType = "ios" | "android";
type Device = {
  type: DeviceType;
  name: string;
  id: string; // udid for iOS, serial/avd for Android
  state?: string;
  runtime?: string;
  isEmulator?: boolean;
};

/**
 * List connected Android devices using adb
 */
async function getConnectedAndroidDevices(): Promise<Device[]> {
  try {
    const { stdout } = await exec("adb devices -l");
    const lines = stdout.split("\n").slice(1).filter(Boolean);
    return lines
      .filter((line) => line.includes("device") && !line.includes("offline"))
      .map((line) => {
        const [serial, state, ...rest] = line.split(/\s+/);
        return {
          type: "android",
          name: `Android Device (${serial})`,
          id: serial,
          state,
          isEmulator: serial.startsWith("emulator"),
        };
      });
  } catch {
    return [];
  }
}

/**
 * List available Android emulators (AVDs)
 */
async function getAvailableAndroidEmulators(): Promise<Device[]> {
  try {
    const { stdout } = await exec("emulator -list-avds");
    return stdout
      .split("\n")
      .filter(Boolean)
      .map((avd) => ({
        type: "android",
        name: `Android Emulator (${avd})`,
        id: avd,
        isEmulator: true,
      }));
  } catch {
    return [];
  }
}

/**
 * Boot Android emulator if not already running
 */
async function ensureAndroidEmulatorBooted(device: Device) {
  // Check if emulator is already running
  const { stdout } = await exec("adb devices");
  if (!stdout.includes(device.id)) {
    console.log(`Booting Android emulator '${device.name}'...`);
    await exec(`emulator -avd ${device.id} -netdelay none -netspeed full &`);
    // Wait for device to be ready
    await exec(`adb -s emulator-5554 wait-for-device`); // 5554 is default, but may need to be more robust
    // Optionally, wait for boot complete
    await exec(
      `adb -s emulator-5554 shell 'while [[ $(getprop sys.boot_completed) != 1 ]]; do sleep 1; done'`,
    );
  }
}

/**
 * Push images to Android device
 */
async function pushImagesToAndroid(device: Device, images: string[]) {
  console.log(
    `📱 Pushing ${images.length} images to Android device '${device.name}'...`,
  );

  // Create a directory on the device for the images
  const deviceDir = "/sdcard/DCIM/Camera/";
  await exec(`adb -s ${device.id} shell mkdir -p "${deviceDir}"`);

  // Create progress bar for batch processing
  const progressBar = createProgressBar("📦 Pushing to Android", images.length);

  // Push images in batches of 20
  const BATCH_SIZE = 20;

  for (let i = 0; i < images.length; i += BATCH_SIZE) {
    const batch = images.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (imagePath) => {
        const fileName = imagePath.split("/").pop();
        await exec(
          `adb -s ${device.id} push "${imagePath}" "${deviceDir}/${fileName}"`,
        );
      }),
    );

    progressBar.update(i + BATCH_SIZE);
  }

  progressBar.stop();

  console.log(`✅ Images pushed to ${deviceDir} on ${device.name}`);

  // Trigger media scanner to make Google Photos recognize the new images
  console.log(`🔄 Triggering media scanner to refresh Google Photos...`);
  try {
    // Method 1: Use am broadcast to trigger media scanner
    await exec(
      `adb -s ${device.id} shell am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d file://${deviceDir}`,
    );

    // Method 2: Alternative approach - trigger media scanner for the entire DCIM directory
    await exec(
      `adb -s ${device.id} shell am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d file:///sdcard/DCIM/`,
    );

    // Method 3: Force refresh media database (works on some devices)
    await exec(
      `adb -s ${device.id} shell content call --uri content://media/external/file --method scan_file --arg /sdcard/DCIM/Camera/`,
    );

    console.log(
      `✅ Android media scanner triggered successfully. Images should be available in the Google Photos app.`,
    );
  } catch (error) {
    console.log(
      `⚠️  Media scanner trigger failed, but images are still available. You may need to restart the device or manually refresh Google Photos.`,
    );
    console.log(
      `💡 Alternative: Open Google Photos app and pull down to refresh, or restart the device.`,
    );
  }
}

/**
 * List connected physical iOS devices using devicectl
 */
async function getConnectedPhysicalIosDevices(): Promise<Device[]> {
  try {
    const { stdout } = await exec("xcrun devicectl list devices");
    const lines = stdout.split("\n").filter(Boolean);

    const devices: Device[] = [];

    for (const line of lines) {
      // Skip header lines
      if (
        line.includes("Name") ||
        line.includes("Hostname") ||
        line.includes("Identifier") ||
        line.includes("State") ||
        line.includes("Model") ||
        line.includes("---")
      ) {
        continue;
      }

      // Look for lines that contain device information
      if (
        line.includes("iPhone") ||
        line.includes("iPad") ||
        line.includes("iPod") ||
        line.includes("Apple TV")
      ) {
        // Parse the actual devicectl output format
        // Example: "Szczepan Posępny   00008110-001A098E1A2A801E.coredevice.local   41048927-C861-5A6C-B721-7D2C55FA4C76   available (paired)   iPhone14,4"

        // Split by multiple spaces to handle the tabular format
        const parts = line.trim().split(/\s{2,}/);

        if (parts.length >= 4) {
          const deviceName = parts[0].trim();
          const _hostname = parts[1].trim();
          const identifier = parts[2].trim();
          const state = parts[3].trim();
          const _model = parts[4]?.trim() || "";

          // Extract just the device name without the hostname part
          const cleanDeviceName = deviceName.split(".")[0];

          devices.push({
            type: "ios",
            name: `Physical ${cleanDeviceName}`,
            id: identifier,
            state,
            isEmulator: false,
          });
        }
      }
    }

    return devices;
  } catch (error) {
    // If devicectl fails, return empty array (device might not be connected or trusted)
    return [];
  }
}

/**
 * Unified device selection for iOS and Android
 */
async function selectDeviceUnified(): Promise<Device> {
  const iosSims = await getAvailableIosSimulators();
  const androidDevices = await getConnectedAndroidDevices();
  const androidEmulators = await getAvailableAndroidEmulators();
  const physicalIosDevices = await getConnectedPhysicalIosDevices();
  const allDevices: Device[] = [
    ...iosSims.map((sim) => ({
      type: "ios" as const,
      name: sim.name,
      id: sim.udid,
      state: sim.state,
      runtime: sim.runtime,
      isEmulator: true,
    })),
    ...androidDevices,
    ...androidEmulators,
    ...physicalIosDevices,
  ];
  if (allDevices.length === 0) {
    throw new Error("No available devices found.");
  }
  const { selected } = await inquirer.prompt([
    {
      type: "list",
      name: "selected",
      message: "Select a device to populate with images:",
      choices: allDevices.map((dev) => ({
        name: `${dev.name} (${dev.type})${dev.state ? ` [${dev.state}]` : ""}${dev.runtime ? ` [${dev.runtime}]` : ""}`,
        value: dev,
      })),
    },
  ]);
  return selected;
}

/**
 * Prompt the user for how many copies of each image they want
 */
async function getNumberOfCopies(): Promise<number> {
  const { copies } = await inquirer.prompt([
    {
      type: "input",
      name: "copies",
      message: "How many numbered copies of each image do you want?",
      default: "300",
      validate: (value: string) => {
        const num = parseInt(value);
        if (isNaN(num) || num < 1 || num > 1000) {
          return "Please enter a number between 1 and 1000";
        }
        return true;
      },
      filter: (value: string) => parseInt(value),
    },
  ]);
  return copies;
}

// 3. Add images to the selected simulator
type Simulator = {
  name: string;
  udid: string;
  state: string;
  runtime: string;
};

function getPhotoFiles(): string[] {
  return readdirSync(PHOTOS_PATH)
    .filter((file) => file.match(/\.(jpg|jpeg|png)$/i))
    .map((file) => join(PHOTOS_PATH, file));
}

async function ensureSimulatorBooted(sim: Simulator) {
  if (sim.state !== "Booted") {
    console.log(`Booting simulator '${sim.name}'...`);
    await exec(`xcrun simctl boot ${sim.udid}`);
  }
}

/**
 * Check if GraphicsMagick is available
 */
async function checkGraphicsMagick(): Promise<boolean> {
  try {
    await exec("ls /opt/homebrew/bin/gm");
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if exiftool is available
 */
async function checkExifTool(): Promise<boolean> {
  try {
    await exec("which exiftool");
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a progress bar instance
 */
function createProgressBar(title: string, total: number) {
  const bar = new cliProgress.SingleBar({
    format: `${title} | {bar} | {percentage}% | {value}/{total} | {duration_formatted}`,
    barCompleteChar: "\u2588",
    barIncompleteChar: "\u2591",
    hideCursor: true,
  });

  bar.start(total, 0);
  return bar;
}

/**
 * Get image dimensions using GraphicsMagick
 */
async function getImageDimensions(imagePath: string): Promise<{
  width: number;
  height: number;
}> {
  try {
    const output = await exec(
      `/opt/homebrew/bin/gm identify -format "%w %h" "${imagePath}"`,
    );
    const [width, height] = output.stdout.trim().split(" ").map(Number);
    return { width, height };
  } catch {
    // Fallback dimensions if we can't get them
    return { width: 800, height: 600 };
  }
}

/**
 * Create a numbered version of an image using GraphicsMagick (much faster than Sharp)
 */
async function createNumberedImage(
  originalPath: string,
  number: number,
  outputPath: string,
  timestamp: Date,
): Promise<void> {
  try {
    // Get image dimensions
    const { width, height } = await getImageDimensions(originalPath);
    const fontSize = Math.min(width, height) * 0.25; // 25% of the smaller dimension

    // Generate date and time in EXIF format from the provided timestamp
    const exifDate = timestamp
      .toISOString()
      .replace(/T/, " ")
      .replace(/\..+/, ""); // Format: YYYY:MM:DD HH:MM:SS

    // GraphicsMagick command for fast text overlay
    const cmd = `/opt/homebrew/bin/gm convert "${originalPath}" \
      -fill white \
      -stroke black \
      -strokewidth 5 \
      -pointsize ${fontSize} \
      -gravity center \
      -draw "text 0,0 '${number}'" \
      "${outputPath}"`;

    await exec(cmd);

    // Set EXIF metadata with values pointing the proper date-time
    await exec(`exiftool -overwrite_original \\
      -DateTimeOriginal='${exifDate}' \
      -CreateDate='${exifDate}' \
      -ModifyDate='${exifDate}' \
      "${outputPath}"`);

    // Set file system timestamps to match the EXIF timestamp
    const touchCmd = `touch -t "${timestamp.getFullYear()}${(timestamp.getMonth() + 1).toString().padStart(2, "0")}${timestamp.getDate().toString().padStart(2, "0")}${timestamp.getHours().toString().padStart(2, "0")}${timestamp.getMinutes().toString().padStart(2, "0")}.${timestamp.getSeconds().toString().padStart(2, "0")}" "${outputPath}"`;
    await exec(touchCmd);
  } catch (error) {
    console.error(
      `❌ Error creating numbered image for ${originalPath}:`,
      error,
    );

    // Show the actual command that failed
    const { width, height } = await getImageDimensions(originalPath);
    const fontSize = Math.min(width, height) * 0.25;
    const exifDate = timestamp
      .toISOString()
      .replace(/T/, " ")
      .replace(/\..+/, "");
    const failedCmd = `/opt/homebrew/bin/gm convert "${originalPath}" -fill white -stroke black -strokewidth 5 -pointsize ${fontSize} -gravity center -draw "text 0,0 '${number}'" -set EXIF:DateTime "${exifDate}" -set EXIF:DateTimeOriginal "${exifDate}" -set EXIF:DateTimeDigitized "${exifDate}" "${outputPath}"`;
    console.error(`💥 Failed command: ${failedCmd}`);

    throw error;
  }
}

/**
 * Create numbered versions of all images using batch processing
 */
async function createNumberedImages(
  originalImages: string[],
  copies: number,
): Promise<string[]> {
  const startTime = Date.now();

  // Create numbered photos directory if it doesn't exist
  if (!(await exists(NUMBERED_PHOTOS_PATH))) {
    mkdirSync(NUMBERED_PHOTOS_PATH, { recursive: true });
  }

  // First, construct the complete input array of all tasks
  const allTasks: {
    originalImage: string;
    number: number;
    baseName: string;
    extension: string;
    numberedFileName: string;
    numberedPath: string;
    timestamp: Date;
  }[] = [];

  // Start with current time and decrement by one hour for each task
  let currentTimestamp = new Date();

  for (let copyNumber = 0; copyNumber < copies; copyNumber++) {
    for (
      let imageNumber = 0;
      imageNumber < originalImages.length;
      imageNumber++
    ) {
      const originalImage = originalImages[imageNumber];
      const baseName = originalImage.split("/").pop()?.split(".")[0];
      const extension = originalImage.split("/").pop()?.split(".").pop();
      const absoluteImageNumber =
        copyNumber * originalImages.length + imageNumber + 1;

      const numberedFileName = `${absoluteImageNumber.toString().padStart(4, "0")}-${baseName}-${(imageNumber + 1).toString().padStart(2, "0")}.${extension}`;
      const numberedPath = join(NUMBERED_PHOTOS_PATH, numberedFileName);

      allTasks.push({
        originalImage,
        number: absoluteImageNumber,
        baseName: baseName!,
        extension: extension!,
        numberedFileName,
        numberedPath,
        timestamp: new Date(currentTimestamp),
      });

      // Decrement timestamp by one hour for the next task
      currentTimestamp.setHours(currentTimestamp.getHours() - 24);
    }
  }

  console.log(
    `📋 Created ${allTasks.length} image generation tasks to process`,
  );

  const numberedImages: string[] = [];
  const batchSize = 10;
  let processedImages = 0;
  let skippedImages = 0;

  // Create progress bar
  const progressBar = createProgressBar(
    "🛠️ Processing images",
    allTasks.length,
  );

  // Process tasks in batches
  for (let i = 0; i < allTasks.length; i += batchSize) {
    const batch = allTasks.slice(i, i + batchSize);

    // Process current batch in parallel
    const batchPromises = batch.map(async (task) => {
      // Check if the numbered image already exists
      if (await exists(task.numberedPath)) {
        processedImages++;
        skippedImages++;
        progressBar.update(processedImages);
        return task.numberedPath;
      } else {
        // Create the numbered image with timestamp
        await createNumberedImage(
          task.originalImage,
          task.number,
          task.numberedPath,
          task.timestamp,
        );
        processedImages++;
        progressBar.update(processedImages);
        return task.numberedPath;
      }
    });

    // Wait for current batch to complete
    const batchResults = await Promise.all(batchPromises);
    numberedImages.push(...batchResults);
  }

  // Stop the progress bar
  progressBar.stop();

  const duration = Date.now() - startTime;
  console.log(
    `🎉 Created ${numberedImages.length - skippedImages} new images, reused ${skippedImages} existing images in ${duration}ms`,
  );
  return numberedImages;
}

/**
 * Clean up temporary files (now preserves numbered photos)
 */
function cleanupTempFiles(): void {
  const startTime = Date.now();
  // Note: We no longer delete NUMBERED_PHOTOS_DIR to preserve numbered images for reuse
  console.log(
    `💾 Preserving numbered photos in ${NUMBERED_PHOTOS_PATH} for future use`,
  );
  const duration = Date.now() - startTime;
  console.log(`🧹 Cleanup completed in ${duration}ms.`);
}

/**
 * Add images to to the selected device
 */
async function addImagesToSimulator(sim: Simulator, images: string[]) {
  if (images.length === 0) {
    throw new Error("No images found in assets/photos.");
  }

  const startTime = Date.now();
  console.log(
    `📱 Adding ${images.length} images to simulator '${sim.name}'...`,
  );

  // Process images in batches of 20
  const batchSize = 20;
  let processedImages = 0;

  // Create progress bar
  const progressBar = createProgressBar("📱 Adding images", images.length);

  for (let i = 0; i < images.length; i += batchSize) {
    const batch = images.slice(i, i + batchSize);
    const cmd = `xcrun simctl addmedia ${sim.udid} ${batch.map((img) => `"${img}"`).join(" ")}`;
    await exec(cmd);

    processedImages += batch.length;
    progressBar.update(processedImages);
  }

  progressBar.stop();

  const duration = Date.now() - startTime;
  console.log(`✅ Images added successfully in ${duration}ms!`);
}

/**
 * Push images to physical iOS device using AirDrop
 */
async function pushImagesToPhysicalIos(device: Device, images: string[]) {
  if (images.length === 0) {
    throw new Error("No images found in assets/photos.");
  }

  const zipFilename = `${NUMBERED_PHOTOS_BASENAME}-${images.length}.zip`;
  const zipPath = resolve(NUMBERED_PHOTOS_PATH, "..", zipFilename);

  // 1. Prepare a zip archive with all the numbered files inside
  if (!(await exists(zipPath))) {
    console.log(
      `📦 Creating zip archive of all numbered photos at ${zipPath}...`,
    );
    // Create progress bar for zip creation
    const zipBar = createProgressBar(`📦 Archiving`, images.length);

    // Execute zip command with progress tracking
    const zipProcess = _exec(
      `cd "${NUMBERED_PHOTOS_PATH}" && zip -r "${zipPath}" .`,
      {
        maxBuffer: 1024 * 1024 * 10,
      },
    );

    if (zipProcess.stdout) {
      let currentFileIndex = 0;

      zipProcess.stdout.on("data", (data) => {
        // Parse zip progress messages in format:
        // adding: 0108-mourad-saadi-GyDktTa0Nmw-unsplash-03.jpg                           ] 1% | ETA: 0s (deflated 0%)"
        const message = data.toString();
        const progressMatch = message.match(/adding: .*\.jpg/);
        if (progressMatch) {
          currentFileIndex += 1;
          zipBar.update(currentFileIndex);
        }
      });
    }

    await new Promise((resolve, reject) => {
      zipProcess.on("close", (code) => {
        zipBar.stop();
        if (code === 0) {
          resolve(null);
        } else {
          reject(new Error(`Zip process exited with code ${code}`));
        }
      });

      zipProcess.on("error", (err) => {
        zipBar.stop();
        reject(err);
      });
    });

    await exec(`cd "${NUMBERED_PHOTOS_PATH}" && zip -r "${zipPath}" .`);
    console.log("✅ Zip archive created at", zipPath);
  } else {
    console.log("✅ Zip archive already exists at", zipPath);
  }

  const port = 8080;

  // 3. Print instructions for the user
  // Get local IP
  let localIp = "192.168.1.100";
  try {
    localIp = (await exec("ipconfig getifaddr en0")).stdout.trim();
  } catch {}

  console.log("\n================================");
  console.log("📲 Download All Photos to iPhone");
  console.log("================================");
  console.log(
    `1. Make sure your iPhone is on the same Wi-Fi network as this computer.`,
  );
  console.log(
    "2. Start http-server that serves the zip file with all the photos inside:",
  );
  console.log(
    `\x1b[94m\n  bunx http-server ${resolve(zipPath, "..")} -p ${port}\n\x1b[0m`,
  );
  console.log(
    `3. On your iPhone, open Safari and go to: http://${localIp}:${port}/${zipFilename}.zip`,
  );
  console.log('3. Tap "Download" when prompted.');
  console.log(
    "5. After download, tap the download icon in Safari, then tap the zip file to preview or share.",
  );
  console.log(
    "6. You can use the Files app to extract the zip and save images to Photos.",
  );
  console.log("================================\n");
}

async function main() {
  const totalStartTime = Date.now();
  try {
    console.log("🚀 Starting image population process...");

    // Check if GraphicsMagick is available
    if (!(await checkGraphicsMagick())) {
      console.error("❌ Error: GraphicsMagick is required but not found.");
      console.error(
        "💡 Please install GraphicsMagick: brew install graphicsmagick",
      );
      process.exit(1);
    }

    // Check if exiftool is available
    if (!(await checkExifTool())) {
      console.error("❌ Error: exiftool is required but not found.");
      console.error("💡 Please install exiftool: brew install exiftool");
      process.exit(1);
    }

    const selected = await selectDeviceUnified();
    const originalImages = getPhotoFiles();

    if (originalImages.length === 0) {
      throw new Error("No images found in assets/photos.");
    }

    console.log(`🔧 Setting up device...`);
    if (selected.type === "ios" && selected.isEmulator) {
      await ensureSimulatorBooted({
        name: selected.name,
        udid: selected.id,
        state: selected.state!,
        runtime: selected.runtime!,
      });
    } else if (selected.type === "android" && selected.isEmulator) {
      await ensureAndroidEmulatorBooted(selected);
    }

    console.log(`📸 Found ${originalImages.length} original images`);

    const copies = await getNumberOfCopies();

    console.log(
      `🔄 Creating ${copies} numbered copies of each image (${originalImages.length * copies} total images)`,
    );

    const numberedImages = await createNumberedImages(originalImages, copies);

    if (selected.type === "ios" && selected.isEmulator) {
      await addImagesToSimulator(
        {
          name: selected.name,
          udid: selected.id,
          state: selected.state!,
          runtime: selected.runtime!,
        },
        numberedImages,
      );
    } else if (selected.type === "ios" && !selected.isEmulator) {
      await pushImagesToPhysicalIos(selected, numberedImages);
    } else if (selected.type === "android") {
      await pushImagesToAndroid(selected, numberedImages);
    }

    const totalDuration = Date.now() - totalStartTime;
    console.log(`🎉 Process completed successfully in ${totalDuration}ms!`);
  } catch (err) {
    const totalDuration = Date.now() - totalStartTime;
    console.error(
      `❌ Error after ${totalDuration}ms:`,
      err instanceof Error ? err.message : err,
    );
    process.exit(1);
  }
}

main();
