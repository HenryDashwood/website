#!/usr/bin/env bun

/**
 * Sets `lastUpdated` to today on every research note that is staged for commit.
 * Runs from the pre-commit hook in .githooks (enabled by `bun install` via the prepare script).
 *
 * Usage:
 *   bun run scripts/stamp-research.ts            # stamp staged notes and re-stage them
 *   bun run scripts/stamp-research.ts <file>...  # stamp specific files (not staged)
 */

import { spawnSync } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";

const NOTE_PATTERN = /^src\/app\/research\/.+\/content\.mdx$/;
const LAST_UPDATED = /(lastUpdated:\s*)(["'])[^"']*\2/;

function git(...args: string[]) {
  const result = spawnSync("git", args, { encoding: "utf-8" });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
  }
  return result.stdout;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Today's date in local time, YYYY-MM-DD */
function today() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function stamp(file: string, date: string): boolean {
  const source = readFileSync(file, "utf-8");
  const match = source.match(LAST_UPDATED);
  if (!match) {
    console.warn(`stamp-research: no lastUpdated field in ${file}, skipping`);
    return false;
  }
  const updated = source.replace(LAST_UPDATED, `$1$2${date}$2`);
  if (updated === source) return false;
  writeFileSync(file, updated);
  return true;
}

const explicitFiles = process.argv.slice(2);
const files =
  explicitFiles.length > 0
    ? explicitFiles
    : git("diff", "--cached", "--name-only", "--diff-filter=AM")
        .split("\n")
        .filter((file) => NOTE_PATTERN.test(file));

const date = today();
for (const file of files) {
  if (!existsSync(file)) continue;
  if (stamp(file, date)) {
    console.log(`stamp-research: ${file} lastUpdated -> ${date}`);
    if (explicitFiles.length === 0) git("add", file);
  }
}
