import * as https from "node:https";
import * as fs from "node:fs";
import { URL } from "node:url";
import { resolve } from "node:path";
import * as unzipper from "unzipper";
import { SingleBar, Presets } from "cli-progress";

// -------------
// Configuration
// -------------

const FILE_ID = "1dQO0QdrQ8xG4BdhErNgGZqOwqqGMK_ee";
const FILE_URL = `https://drive.google.com/uc?export=download&id=${FILE_ID}`;
const OUTPUT_DIR = resolve(__dirname, "../assets/photos/dataset/extended");


// -------------------------------
// Helper functions - HTML parsing
// -------------------------------

// The first response we get when fetching a file from Google Drive is an HTML page
// that contains the proper resource ID. Only the next request returns the file itself.
function isHtml(headers: Record<string, string>) {
  const ct = headers['content-type'] || "";
  return String(ct).includes("text/html");
}

function parseForm(html: string): { action?: string; params: Record<string,string> } {
  const out: Record<string,string> = {};
  const actionMatch = html.match(/<form[^>]*action=(?:'([^']*)'|"([^"]*)"|([^>\s]+))/i);
  const action = actionMatch ? (actionMatch[1] || actionMatch[2] || actionMatch[3]) : undefined;
  const inputRe = /<input[^>]*name=(?:'([^']*)'|"([^"]*)"|([^>\s]+))[^>]*value=(?:'([^']*)'|"([^"]*)"|([^>\s]+))/gi;

  let m;
  while ((m = inputRe.exec(html))) {
    const name = m[1] || m[2] || m[3];
    const value = m[4] || m[5] || m[6] || "";
    out[name] = value;
  }

  return { action, params: out };
}


// ---------------------------------------
// Helper functions - byte stream handling
// ---------------------------------------

function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", c => chunks.push(Buffer.from(c)));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    stream.on("error", reject);
  });
}


// ------------------------
// Helper functions - other
// ------------------------

function httpGetRaw(urlStr: string, headers?: Record<string,string>): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.get(urlStr, { headers }, (res) => resolve(res));
    req.on("error", reject);
  });
}

function joinCookies(setCookie?: string[] | string): string | undefined {
  if (!setCookie) return undefined;
  if (Array.isArray(setCookie)) return setCookie.map(c => c.split(";")[0]).join("; ");
  return setCookie.split(";")[0];
}


// ------------------
// Download procedure
// ------------------

async function downloadAndExtract(url: string, outDir: string): Promise<void> {
  await fs.promises.mkdir(outDir, { recursive: true });

  const res = await httpGetRaw(url);

  // follow simple redirects
  if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
    const next = new URL(res.headers.location, url).toString();
    return downloadAndExtract(next, outDir);
  }

  if (res.statusCode !== 200) throw new Error("HTTP " + res.statusCode);

  // If HTML (Drive "virus scan" confirm) -> parse and follow form action
  if (isHtml(res.headers)) {
    const body = await streamToString(res);
    const cookies = joinCookies(res.headers['set-cookie']);
    const { action, params } = parseForm(body);
    if (!action || !params['id']) throw new Error("Download form not found in HTML.");

    const actionUrl = new URL(action, url);
    Object.entries(params).forEach(([k,v]) => actionUrl.searchParams.set(k, v));
    const headers: Record<string,string> = {};
    if (cookies) headers['Cookie'] = cookies;

    const res2 = await httpGetRaw(actionUrl.toString(), headers);

    if (res2.statusCode && res2.statusCode >= 300 && res2.statusCode < 400 && res2.headers.location) {
      const next = new URL(res2.headers.location, actionUrl.toString()).toString();
      return downloadAndExtract(next, outDir);
    }
    if (res2.statusCode !== 200) throw new Error("HTTP " + res2.statusCode);

    // pipe binary stream to unzipper with progress
    await pipeStreamToUnzipWithProgress(res2 as any, outDir, "Downloading");
    return;
  }

  // Direct binary -> pipe to unzipper with progress
  await pipeStreamToUnzipWithProgress(res as any, outDir, "Downloading");
}


/**
 * Pipe an HTTP IncomingMessage (response) to unzipper and display a download progress bar.
 * - stream: the response object (has .headers and emits 'data')
 * - outDir: destination path for unzipper
 * - label: progress label
 */
function pipeStreamToUnzipWithProgress(stream: any, outDir: string, label: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const headers = stream.headers || {};
    const contentLength = Number(headers['content-length'] || headers['Content-Length'] || 0);

    const knownTotal = contentLength > 0;
    const bar = new SingleBar(
      knownTotal
        ? { format: `${label} |{bar}| {percentage}% || {value}/{total} bytes`, hideCursor: true }
        : { format: `${label} {bytes} bytes downloaded`, hideCursor: true },
      Presets.shades_classic
    );

    if (knownTotal) {
      bar.start(contentLength, 0);
    } else {
      bar.start(1, 0, { bytes: "0" });  // use tokens to show bytes when total is unknown
    }

    let downloaded = 0;
    stream.on("data", (chunk: Buffer) => {
      downloaded += chunk.length;
      if (knownTotal) {
        bar.update(Math.min(downloaded, contentLength));
      } else {
        bar.update(0, { bytes: String(downloaded) });
      }
    });

    const extract = unzipper.Extract({ path: outDir });
    stream.pipe(extract);

    extract.on("close", () => {
      if (knownTotal) bar.update(contentLength);
      bar.stop();
      resolve();
    });
    extract.on("error", (err: Error) => {
      bar.stop();
      reject(err);
    });
    stream.on("error", (err: Error) => {
      bar.stop();
      reject(err);
    });
  });
}


async function main(): Promise<void> {
  try {
    await downloadAndExtract(FILE_URL, OUTPUT_DIR);
    console.log("Extracted to:", OUTPUT_DIR);
  } catch (e) {
    console.error("Error:", (e as Error).message);
    process.exitCode = 1;
  }
}

main();
