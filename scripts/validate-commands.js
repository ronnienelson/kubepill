#!/usr/bin/env node
/**
 * Validates src/commands.json.
 *
 * Run locally with:  node scripts/validate-commands.js
 * CI runs this on every push and PR.
 */

const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "..", "src", "commands.json");
const HEX = /^#[0-9a-fA-F]{6}$/;

const errors = [];
const warnings = [];

function fail(msg) {
  errors.push(msg);
}

let data;
try {
  data = JSON.parse(fs.readFileSync(FILE, "utf8"));
} catch (err) {
  console.error(`✗ commands.json is not valid JSON:\n  ${err.message}`);
  process.exit(1);
}

if (!Array.isArray(data) || data.length === 0) {
  console.error("✗ commands.json must be a non-empty array of categories");
  process.exit(1);
}

const seenCats = new Set();
const seenCmds = new Set();
let commandCount = 0;

data.forEach((cat, ci) => {
  const where = `category[${ci}]`;

  if (typeof cat.name !== "string" || !cat.name.trim()) {
    fail(`${where}: missing "name"`);
  } else {
    if (seenCats.has(cat.name)) fail(`${where}: duplicate category name "${cat.name}"`);
    seenCats.add(cat.name);
    if (cat.name !== cat.name.toLowerCase())
      warnings.push(`${where} ("${cat.name}"): category names are lowercase by convention`);
  }

  if (!HEX.test(cat.color || "")) {
    fail(`${where} ("${cat.name}"): "color" must be a hex value like "#b8bb26"`);
  }

  if (!Array.isArray(cat.commands) || cat.commands.length === 0) {
    fail(`${where} ("${cat.name}"): needs a non-empty "commands" array`);
    return;
  }

  cat.commands.forEach((cm, mi) => {
    const cwhere = `${cat.name}.commands[${mi}]`;
    commandCount++;

    for (const field of ["cmd", "short", "desc"]) {
      if (typeof cm[field] !== "string" || !cm[field].trim()) {
        fail(`${cwhere}: missing "${field}"`);
      }
    }

    if (cm.cmd) {
      if (seenCmds.has(cm.cmd)) fail(`${cwhere}: duplicate command "${cm.cmd}"`);
      seenCmds.add(cm.cmd);
    }

    if (!Array.isArray(cm.examples) || cm.examples.length === 0) {
      fail(`${cwhere} ("${cm.cmd}"): needs at least one example`);
      return;
    }

    cm.examples.forEach((ex, ei) => {
      const ewhere = `${cwhere} ("${cm.cmd}").examples[${ei}]`;
      if (typeof ex.command !== "string" || !ex.command.trim())
        fail(`${ewhere}: missing "command"`);
      if (typeof ex.note !== "string" || !ex.note.trim())
        fail(`${ewhere}: missing "note" — every example needs to say what it does`);
    });

    if (cm.examples.length > 6) {
      warnings.push(
        `${cwhere} ("${cm.cmd}"): ${cm.examples.length} examples — consider trimming to the most useful 2–5`
      );
    }
  });
});

for (const w of warnings) console.warn(`  ! ${w}`);

if (errors.length) {
  console.error(`\n✗ ${errors.length} problem(s) in commands.json:\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `✓ commands.json is valid — ${data.length} categories, ${commandCount} commands` +
    (warnings.length ? ` (${warnings.length} warning(s))` : "")
);
