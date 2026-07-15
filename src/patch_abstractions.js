#!/usr/bin/env node
// Patch abstraction buckets in existing hand JSON files.
//
// Older output carries Flop/Turn/River = 16384 (with 16384-specific ids).
// This rewrites streets 1/2/3 to the correct buckets + ids so HRC imports
// Flop 1024, Turn 256, River 256 directly from the JSON — no UI entry needed.
// Street 0 (Preflop, 169) is left untouched.
//
// Usage:
//   node src/patch_abstractions.js [--dry-run] [--root <dir>] [<file> ...]
//   (default root: output_hands)

const fs = require("fs");
const path = require("path");

// Correct abstractions (must match src/hrc_generator.js engine.configuration.abstractions)
const TARGET = {
  1: { buckets: 1024, id: "22804b04d3732210b3f28dbaee3a59fbe7ab7a573b679ee68c876760aba76b94" },
  2: { buckets: 256, id: "661d702e82b930222bdd1e7cea3eef35f9306baaad628cec48713091b7e2e398" },
  3: { buckets: 256, id: "41e796828302d1cb95d18663fc2e1eee65f2831c90b26339a814d285003785a1" },
};

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && entry.name.endsWith(".json")) out.push(full);
  }
  return out;
}

function patchFile(file, dryRun) {
  const raw = fs.readFileSync(file, "utf8");
  let doc;
  try {
    doc = JSON.parse(raw);
  } catch (e) {
    return { file, status: "skip", reason: "invalid JSON" };
  }

  const abs = doc.engine?.configuration?.abstractions;
  if (!Array.isArray(abs)) return { file, status: "skip", reason: "no abstractions" };

  let changed = false;
  for (const a of abs) {
    const t = TARGET[a.street];
    if (!t) continue; // leave street 0 (and anything unexpected) alone
    if (a.buckets !== t.buckets || a.id !== t.id) {
      a.buckets = t.buckets;
      a.id = t.id;
      changed = true;
    }
  }

  if (!changed) return { file, status: "ok", reason: "already correct" };
  if (!dryRun) fs.writeFileSync(file, JSON.stringify(doc, null, 2) + "\n");
  return { file, status: dryRun ? "would-patch" : "patched" };
}

function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  let root = "output_hands";
  const explicitFiles = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dry-run") continue;
    if (argv[i] === "--root") { root = argv[++i]; continue; }
    explicitFiles.push(argv[i]);
  }

  const files = explicitFiles.length
    ? explicitFiles
    : walk(path.resolve(root), []);

  const counts = { patched: 0, "would-patch": 0, ok: 0, skip: 0 };
  for (const f of files) {
    const r = patchFile(f, dryRun);
    counts[r.status] = (counts[r.status] || 0) + 1;
    if (r.status === "skip") console.warn(`  SKIP ${r.file} — ${r.reason}`);
  }

  console.log(
    `\n${dryRun ? "[dry-run] " : ""}Files: ${files.length}  |  ` +
    `patched: ${counts.patched + counts["would-patch"]}  |  ` +
    `already-correct: ${counts.ok}  |  skipped: ${counts.skip}`
  );
}

main();
