import fs from 'node:fs';
import path from 'node:path';
import { exec as _exec } from "node:child_process";
import { promisify } from "node:util";
import sharp from 'sharp';
import cliProgress from 'cli-progress';

const exec = promisify(_exec);


// --------------------
// Help & usage message
// --------------------

function usage(): string {
	const script = path.basename(__filename);
	return [
		`Usage: ${script} device=<DEVICE_NAME> [target=sim_tv_aarch64] [photos=<DIR>] [resize=false] [target-size=1920x1080] [launch=false]`,
		'',
		'Named arguments (key=value):',
		'  device      (required)   Target device name, e.g., "Simulator"',
		'  target      (optional)   Platform target; default: sim_tv_aarch64',
		'  photos      (optional)   Path to photos directory; when set, creates symlink assets/photos',
		'  launch      (optional)   true/false; when true — launches the app after install (default: false)',
    '  resize      (optional)   true/false: when true - resizes the images to given dimensions, or full HD if not specified (default: false)',
    '  target-size (optional)   Target resolution that images should be resized to, if resize was set to true (default: 1920x1080)',
		'',
		'Examples:',
		'  kepler-install.ts device=Simulator',
		'  kepler-install.ts device=Simulator target=sim_tv_aarch64 photos=~/Pictures launch=true',
	].join('\n');
}

// -------------------------------------
// Helper definitions - helper functions
// -------------------------------------

// Simple console styles (colors & prefixes)
const BLUE = '\u001b[1;34m';
const YELLOW = '\u001b[1;33m';
const RED = '\u001b[1;31m';
const RESET = '\u001b[0m';

// Different logging functions
function log(...args: unknown[]) {
	console.log(`${BLUE}==>${RESET}`, ...args);
}
function warn(...args: unknown[]) {
	console.warn(`${YELLOW}[WARN]${RESET}`, ...args);
}
function err(...args: unknown[]) {
	console.error(`${RED}[ERROR]${RESET}`, ...args);
}
function die(message: string, code = 1): never {
	err(message);
	process.exit(code);
}

// Resolve absolute paths
function abspath(p: string): string {
	return path.resolve(p);
}

// Shell-quote a string for safe interpolation in a command line
function shQuote(s: string): string {
	return `'${s.replace(/'/g, `\'`)}'`;
}

// Run a shell command (exec), returning stdout; throws on non-zero
async function run(cmd: string, opts: { cwd?: string; silent?: boolean } = {}): Promise<{ stdout: string; stderr: string }> {
	const { cwd, silent } = opts;
	if (!silent) {
		// keep a minimal command echo for visibility
		log(`$ ${cmd}${cwd ? `  (cwd: ${cwd})` : ''}`);
	}
	try {
		const { stdout, stderr } = await exec(cmd, { cwd, maxBuffer: 64 * 1024 * 1024 });
		if (!silent) {
			if (stdout?.trim()) process.stdout.write(stdout);
			if (stderr?.trim()) process.stderr.write(stderr);
		}
		return { stdout, stderr };
	} catch (e: any) {
		if (!silent) {
			if (e?.stdout) process.stdout.write(String(e.stdout));
			if (e?.stderr) process.stderr.write(String(e.stderr));
		}
		throw e;
	}
}

// Check the existance of a command
// - Useful to detect if a command line tool exists or is compatible with current shell
async function commandExists(cmd: string): Promise<boolean> {
	try {
		await run(`command -v ${cmd}`, { silent: true });
		return true;
	} catch {
		return false;
	}
}

// Map detailed target to generic arch (used in paths and artifact names)
// - Could be extended if needed
function mapTarget(target: string): string {
	switch (target) {
		case 'sim_tv_aarch64':
			return 'aarch64';
		case 'sim_tv_x86_64':
			return 'x86_64';
		case '4kmax_g1_vega':
			return 'armv7';
    case 'tv':
      return 'armv7';   // We treat armv7 as default for currently used sticks
		default:
			return target;
	}
}

// Helper function for reading .json files
function readJson(filePath: string): any {
	if (!fs.existsSync(filePath)) die(`${path.basename(filePath)} not found at: ${path.dirname(filePath)}`);
	try {
		const raw = fs.readFileSync(filePath, 'utf8');
		return JSON.parse(raw);
	} catch (e) {
		die(`Failed to read JSON from ${filePath}: ${String(e)}`);
	}
}

// Helper function - resizing an image
// - By default it resizes to Full HD resolution, but can be changed with an optional argument
// - Note that because our images can be either in vertical or horizontal mode, it resizes by comparing the diagonal ratio
async function resizeImage(filePath: string, outputPath: string, targetWidth: number = 1920, targetHeight: number = 1080) {
  const meta = await sharp(filePath).metadata();
  if (!meta.width || !meta.height) throw new Error(`Unable to read image ${filePath} metadata`);

  const originalDiagonal = Math.sqrt(meta.width * meta.width + meta.height * meta.height);
  const targetDiagonal = Math.sqrt(targetWidth * targetWidth + targetHeight * targetHeight);
  const scale = targetDiagonal / originalDiagonal;

  // Do not resize if target dimensions are higher than input dimensions
  if (scale >= 1.0)
    return;

  const newWidth = Math.round(meta.width * scale);
  const newHeight = Math.round(meta.height * scale);

  await sharp(filePath)
    .resize(newWidth, newHeight)
    .toFile(outputPath)
		.catch((e) => {
			err(`Error resizing ${filePath}: ${String(e)}`);
    })
}

// -----------------------------------------------
// Helper definitions - constants & default values
// -----------------------------------------------

// Project paths (as for now, project root is identical with the script directory)
const SCRIPT_DIR = __dirname;
const PROJECT_ROOT = path.resolve(SCRIPT_DIR);

const PHOTOS_DIR_MAPPING = 'photos';    // Used also as a symlink name in case of no copy behavior
const ASSETS_DIR = path.join(PROJECT_ROOT, 'assets');

// Defaults
let DEVICE_NAME = '';
let TARGET_ARCH = 'sim_tv_aarch64';
let PHOTOS_DIR = '';
let LAUNCH_ARG = 'false';
let RESIZE_ARG = false;
let TARGET_SIZE_ARG = '1920x1080';
let TARGET_SIZE_WIDTH = 1920;
let TARGET_SIZE_HEIGHT = 1080;

// -------------------
// 1. Argument parsing
// -------------------

function parseArgs(argv: string[]) {
	for (const arg of argv) {
		if (!arg.includes('=')) {
			console.log(usage());
			die(`Invalid argument format: '${arg}'. Use key=value.`);
		}
		const [key, ...rest] = arg.split('=');
		const value = rest.join('=');
			switch (key) {
				case 'device':
					DEVICE_NAME = value;
					break;
				case 'target':
					TARGET_ARCH = value;
					break;
				case 'photos':
				case 'photos_dir':
					PHOTOS_DIR = value;
					break;
				case 'launch':
					LAUNCH_ARG = value;
					break;
				case 'resize':
					RESIZE_ARG = value === 'true';
					break;
				case 'target-size':
					TARGET_SIZE_ARG = value;
          // Parse resolution values
					const match = value.match(/^(\d+)x(\d+)$/);
					if (match) {
						TARGET_SIZE_WIDTH = parseInt(match[1], 10);
						TARGET_SIZE_HEIGHT = parseInt(match[2], 10);
					} else {
						  warn(`Invalid target-size format: ${value}, using default 1920x1080`);
						TARGET_SIZE_WIDTH = 1920;
						TARGET_SIZE_HEIGHT = 1080;
					}
					break;
				default:
					die(`Unknown argument: ${key}`);
			}
	}
	if (!DEVICE_NAME) {
		console.log(usage());
		die('Missing required argument: device=<DEVICE_NAME>');
	}
}

// -----------
// Main script
// -----------

async function main() {
	parseArgs(process.argv.slice(2));

	const MAPPED_TARGET = mapTarget(TARGET_ARCH);
	log(`Device: ${DEVICE_NAME}`);
	log(`Target: ${TARGET_ARCH} (mapped as: ${MAPPED_TARGET})`);

  // ---------------------------
  // 2. Reading app visible name
  // ---------------------------

	const PACKAGE_JSON = path.join(PROJECT_ROOT, 'package.json');
	const pkg = readJson(PACKAGE_JSON);
	const APP_NAME: string = pkg?.name ?? '';

	if (!APP_NAME) 
    die("Failed to read 'name' from package.json");
	log(`App name (from package.json): ${APP_NAME}`);

	// --------------------------------------
	// 3. Reading app effective name (app id)
	// --------------------------------------

	const APP_JSON = path.join(PROJECT_ROOT, 'app.json');
	const app = readJson(APP_JSON);
	const APP_ID: string = app?.name ?? '';
	if (!APP_ID) die("Failed to read 'name' from app.json");
	log(`App ID (from app.json): ${APP_ID}`);

	// -----------------
	// 4. Copying photos
	// -----------------

  if (PHOTOS_DIR && (!fs.existsSync(PHOTOS_DIR) || !fs.statSync(PHOTOS_DIR).isDirectory())) {
    die(`Photos directory does not exist or is not a directory: ${PHOTOS_DIR}`);
  }

  if (PHOTOS_DIR && !fs.existsSync(ASSETS_DIR)) {
    log('Creating assets/ directory');
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  // If we do not need to downscale photos, then using a symlink is a fine and optimized approach
  if (PHOTOS_DIR && !RESIZE_ARG) {
    const SYMLINK_PATH = path.join(ASSETS_DIR, PHOTOS_DIR_MAPPING);
    let createdSymlink = false;

    log(`Configuring photos symlink: ${SYMLINK_PATH} -> ${PHOTOS_DIR}`);

    const PHOTOS_ABS = abspath(PHOTOS_DIR);
    try {
      if (fs.existsSync(SYMLINK_PATH)) {
        fs.rmSync(SYMLINK_PATH, { recursive: true, force: true });
      }
      fs.symlinkSync(PHOTOS_ABS, SYMLINK_PATH);
      createdSymlink = true;
    } catch (e) {
      die(`Failed to create symlink: ${String(e)}`);
    }

    // Add cleanup to automatically remove symlink after the script ends
    const cleanup = () => {
      try {
        if (PHOTOS_DIR && createdSymlink && fs.lstatSync(SYMLINK_PATH).isSymbolicLink()) {
          fs.rmSync(SYMLINK_PATH, { force: true });
        }
      } catch {
        // ignore
      }
    };

    // Additional cleanup function bindings
    process.on('exit', cleanup);
    process.on('SIGINT', () => {
      cleanup();
      process.exit(130);
    });
    process.on('SIGTERM', () => {
      cleanup();
      process.exit(143);
    });
  }
  // In other case, we need to copy the files
  else if (PHOTOS_DIR && RESIZE_ARG) {
			const outDir = path.join(ASSETS_DIR, PHOTOS_DIR_MAPPING);
			if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

			const entries = fs.readdirSync(PHOTOS_DIR, { withFileTypes: true });
			const imageRe = /\.(jpe?g|png|webp|tiff?|avif)$/i;
			const images = entries.filter(e => e.isFile() && imageRe.test(e.name)).map(e => e.name);

			if (images.length === 0) {
				warn(`No images found in ${PHOTOS_DIR}`);
			} else {
				log(`Resizing ${images.length} image(s) to ${TARGET_SIZE_WIDTH}x${TARGET_SIZE_HEIGHT} ...`);
			}

      // Progress bar setup
      const bar = new cliProgress.SingleBar({
        format: `${BLUE}==> Resizing images${RESET} |{bar}| {value}/{total} ({percentage}%)`,
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true
      });
      bar.start(images.length, 0);

      for (const file of images) {
        const src = path.join(PHOTOS_DIR, file);
        const dst = path.join(outDir, file);
        await resizeImage(src, dst, TARGET_SIZE_WIDTH, TARGET_SIZE_HEIGHT);
        bar.increment();
      }
      bar.stop();

			// Cleanup: remove outDir after script ends
			const cleanup = () => {
				try {
					if (fs.existsSync(outDir)) {
						fs.rmSync(outDir, { recursive: true, force: true });
					}
				} catch {
					// ignore
				}
			};

			process.on('exit', cleanup);
			process.on('SIGINT', () => {
				cleanup();
				process.exit(130);
			});
			process.on('SIGTERM', () => {
				cleanup();
				process.exit(143);
			});
  }
  // If no photos directory provided, we do nothing
  else {
    log("No photos directory provided - skipping...")
  }

	// -------------------
	// 5. Building the app
	// -------------------

	log(`Building app for target ${TARGET_ARCH}:`);
	const hasRN = await commandExists('react-native');
	try {
		if (hasRN) {
			await run(`react-native build-kepler --build-type Release --target ${shQuote(TARGET_ARCH)}`, { cwd: PROJECT_ROOT });
		} else {
			await run(`npx --yes react-native build-kepler --build-type Release --target ${shQuote(TARGET_ARCH)}`, { cwd: PROJECT_ROOT });
		}
	} catch {
		die('Build failed');
	}

	// ---------------------
	// 6. Installing the app
	// ---------------------

	if (!(await commandExists('kepler'))) {
		die("'kepler' CLI not found in PATH. Install/Configure Kepler CLI.");
	}

	try {
		await run(`kepler device installed-apps --device ${shQuote(DEVICE_NAME)}`, { silent: true });
	} catch {
		die(`Device not found or unreachable: ${DEVICE_NAME}`);
	}

	const ARTIFACT_PATH = path.join(PROJECT_ROOT, 'build', `${MAPPED_TARGET}-release`, `${APP_NAME}_${MAPPED_TARGET}.vpkg`);
	if (!fs.existsSync(ARTIFACT_PATH)) {
		die(`Artifact not found: ${ARTIFACT_PATH}`);
	}

	log(`Installing package: ${ARTIFACT_PATH}`);
	try {
		await run(`kepler device install-app -p ${shQuote(ARTIFACT_PATH)} --device ${shQuote(DEVICE_NAME)}`);
	} catch {
		die(`Install failed. Ensure the device exists and is reachable: ${DEVICE_NAME}`);
	}

	log('Installing the app finished.');

	// -------------------------------
	// 7. Launching the app (optional)
	// -------------------------------

	if (LAUNCH_ARG === 'true') {
		log(`Launching app on device: ${DEVICE_NAME}`);
		try {
			await run(`kepler device launch-app --device ${shQuote(DEVICE_NAME)} --appName ${shQuote(APP_ID)}`);
		} catch {
			die(`Failed to launch the app on device: ${DEVICE_NAME}`);
		}
	} else {
		log('Skipping app launch (launch=false).');
	}

	log('Done');
}

main().catch((e) => die(String(e?.message ?? e)));

