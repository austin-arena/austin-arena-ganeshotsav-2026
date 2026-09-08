import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadAndValidateEventsCsv, printWarnings, writeJsonOutput } from "./event-csv-utils.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const csvFilePath = path.join(root, "src", "data", "events.csv");
const outputFilePath = path.join(root, "src", "data", "events.fallback.json");

const { rows, warnings } = loadAndValidateEventsCsv(csvFilePath);
printWarnings(warnings);
writeJsonOutput(rows, outputFilePath);

console.log(`Wrote ${rows.length} fallback event rows -> src/data/events.fallback.json`);
