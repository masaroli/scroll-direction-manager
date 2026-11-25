const fs = require("fs");
const path = require("path");

const distDir = path.resolve(__dirname, "..", "dist");
const cjsDir = path.join(distDir, "cjs");
const esmDir = path.join(distDir, "esm");

fs.writeFileSync(
  path.join(cjsDir, "package.json"),
  JSON.stringify({ type: "commonjs" }, null, 2) + "\n"
);

fs.writeFileSync(
  path.join(esmDir, "package.json"),
  JSON.stringify({ type: "module" }, null, 2) + "\n"
);

const relativeImportRegex = /(from\s+["'])(\.{1,2}\/[^"']+?)(["'])/g;

for (const entry of fs.readdirSync(esmDir)) {
  if (!entry.endsWith(".js") && !entry.endsWith(".d.ts")) continue;

  const filePath = path.join(esmDir, entry);
  const content = fs.readFileSync(filePath, "utf8");
  const updated = content.replace(
    relativeImportRegex,
    (match, prefix, specifier, suffix) => {
      if (specifier.endsWith(".js")) return match;
      return `${prefix}${specifier}.js${suffix}`;
    }
  );

  if (updated !== content) {
    fs.writeFileSync(filePath, updated, "utf8");
  }
}
