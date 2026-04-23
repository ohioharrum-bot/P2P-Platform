import fs from "fs";
import path from "path";

const filePath = path.resolve("./data/fragrances.js");
let file = fs.readFileSync(filePath, "utf-8");

// Safely evaluate your existing export (strip export default, etc.)
const data = eval(file.replace("export default fragrances;", "").replace("const fragrances =", "").trim());

// Helper to determine concentration type
function getType(entry) {
  const n = entry.name.toLowerCase();
  const c = entry.collection?.toLowerCase() || "";

  if (n.includes("cologne")) return "Cologne";
  if (c.includes("aqua originale")) return "Eau de Toilette";
  if (c.includes("les royales")) return "Extrait de Parfum";
  if (c.includes("heritage")) return "Eau de Parfum";
  if (n.includes("absolu") || n.includes("anniversary")) return "Extrait de Parfum";
  return "Millésime (Eau de Parfum)";
}

// Add the new field
for (const f of data) {
  f.type = getType(f);
}

// Rebuild file content
const output =
  "const fragrances = " +
  JSON.stringify(data, null, 2) +
  ";\n\nexport default fragrances;\n";

// Write it back
fs.writeFileSync(filePath, output, "utf-8");
console.log("✅ Added 'type' field to all fragrances!");
