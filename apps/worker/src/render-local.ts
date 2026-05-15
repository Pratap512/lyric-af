import { resolve } from "node:path";
import { renderLocal } from "./render.js";

const lyrics = [
  { text: "Hello", startMs: 0, endMs: 800 },
  { text: "from", startMs: 800, endMs: 1400 },
  { text: "the", startMs: 1400, endMs: 1800 },
  { text: "other", startMs: 1800, endMs: 2400 },
  { text: "side", startMs: 2400, endMs: 3200 },
];

const compositionId = process.argv[2] ?? "KaraokeHighlight";
const audioPath = process.argv[3] ?? resolve(process.cwd(), "../../storage/sample-audio.mp3");
const outputPath = process.argv[4] ?? resolve(process.cwd(), "../../storage/output-local.mp4");

console.log(`Rendering ${compositionId} -> ${outputPath}`);

renderLocal({ compositionId, lyrics, audioPath, outputPath })
  .then(() => {
    console.log("Done");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
