import { readFile } from "node:fs/promises";
import { parseBuffer } from "music-metadata";

/**
 * MP3/WAV/etc. duration from disk — works in Node.
 * `@remotion/media-utils` `getAudioDurationInSeconds` only runs in the browser.
 */
export async function getLocalAudioDurationSeconds(
  filePath: string
): Promise<number | null> {
  try {
    const buf = await readFile(filePath);
    const meta = await parseBuffer(
      new Uint8Array(buf),
      { path: filePath, size: buf.length },
      { duration: true }
    );
    const d = meta.format.duration;
    if (typeof d === "number" && Number.isFinite(d) && d > 0) {
      return d;
    }
  } catch {
    /* ignore */
  }
  return null;
}
