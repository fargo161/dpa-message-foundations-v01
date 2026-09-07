/** Reproduce supplied allowlisted bytes, never generate or retouch artwork.
 * Usage: node src/conversation/face/import-assets.mjs /absolute/path/to/assembler.html
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { FACE_CATALOG } from "./catalog.mjs";

export function importFaceAssets(sourcePath) {
  const source = readFileSync(sourcePath);
  const digest = createHash("sha256").update(source).digest("hex");
  if (digest !== "54cc31dd3ee5f6a710bb22ca4a49ce29462b1ffaae7c4cd626e39014eb929089") throw new Error("Supplied assembler receipt mismatch.");
  const match = source.toString("utf8").match(/const DATA = (.*);/);
  if (!match) throw new Error("Assembler DATA was not found.");
  const data = JSON.parse(match[1]);
  const output = new URL("../../../public/encounter/assets/marcus/", import.meta.url);
  mkdirSync(output, { recursive: true });
  writeFileSync(new URL("base.webp", output), Buffer.from(data.base.img, "base64"));
  for (const asset of FACE_CATALOG.assets) {
    const supplied = data.assets.find(candidate => candidate.id === asset.assetId && candidate.slot === asset.slot);
    if (!supplied) throw new Error("Missing supplied face asset.");
    writeFileSync(new URL(`${asset.assetId}.webp`, output), Buffer.from(supplied.img, "base64"));
  }
  return { sourceSha256: digest, assets: FACE_CATALOG.assets.length, base: 1 };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) throw new Error("Supply the original assembler path.");
  console.log(JSON.stringify(importFaceAssets(process.argv[2])));
}
