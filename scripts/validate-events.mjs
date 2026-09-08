import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadAndValidateEventsCsv, printWarnings } from "./event-csv-utils.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const csvFilePath = path.join(root, "src", "data", "events.csv");

const { rows, warnings } = loadAndValidateEventsCsv(csvFilePath);
printWarnings(warnings);

console.log(`Validation passed for ${rows.length} event rows.`);
