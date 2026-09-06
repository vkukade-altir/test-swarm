#!/usr/bin/env node
/**
 * Pass/fail 95% lines and 95% branches on testable source, using coverage-summary.json.
 * Project coverageThreshold stays 0. This program is the gate.
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const DIR = path.join(ROOT, '.test-swarm');
const config = readConfig(path.join(DIR, 'config'));
const FLOOR = Number(config.FLOOR || 95);
const SUMMARY =
  process.env.COVERAGE_SUMMARY ||
  path.join(ROOT, 'coverage', 'coverage-summary.json');
const GLOBS = path.join(DIR, 'untestable.globs');

function readConfig(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

function matchesGlob(relPosix, glob) {
  const g = glob.replace(/\\/g, '/');
  const rel = relPosix.replace(/\\/g, '/');
  if (g.startsWith('**/') && g.endsWith('/**')) {
    const mid = g.slice(3, -3);
    return rel === mid || rel.startsWith(`${mid}/`) || rel.includes(`/${mid}/`);
  }
  if (g.startsWith('**/')) {
    const rest = g.slice(3);
    if (rest.startsWith('*.')) return rel.endsWith(rest.slice(1));
    return rel === rest || rel.endsWith(`/${rest}`);
  }
  if (g.endsWith('/**')) {
    const prefix = g.slice(0, -2);
    return rel === prefix.replace(/\/$/, '') || rel.startsWith(prefix);
  }
  return rel === g;
}

function isUntestable(absFile) {
  if (!fs.existsSync(GLOBS)) return false;
  const rel = path.relative(ROOT, absFile).split(path.sep).join('/');
  const globLines = fs
    .readFileSync(GLOBS, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
  return globLines.some((g) => matchesGlob(rel, g));
}

if (!fs.existsSync(SUMMARY)) {
  console.error('No coverage-summary.json. Run the coverage command first.');
  process.exit(2);
}

const data = JSON.parse(fs.readFileSync(SUMMARY, 'utf8'));
let lineCovered = 0;
let lineTotal = 0;
let branchCovered = 0;
let branchTotal = 0;
let fileCount = 0;
let skippedFiles = 0;

for (const [file, metrics] of Object.entries(data)) {
  if (file === 'total') continue;
  if (isUntestable(file)) {
    skippedFiles += 1;
    continue;
  }
  if (!metrics.lines || !metrics.branches) continue;
  lineCovered += metrics.lines.covered;
  lineTotal += metrics.lines.total;
  branchCovered += metrics.branches.covered;
  branchTotal += metrics.branches.total;
  fileCount += 1;
}

const linePct = lineTotal ? (100 * lineCovered) / lineTotal : 100;
const branchPct = branchTotal ? (100 * branchCovered) / branchTotal : 100;
const lineOk = linePct + 1e-9 >= FLOOR;
const branchOk = branchPct + 1e-9 >= FLOOR;
const fmt = (n, d, p) => `${n}/${d} (${p.toFixed(2)}%)`;

console.log('test-swarm testable coverage (untestable.globs excluded)');
console.log(`  files: ${fileCount}  denylist skipped: ${skippedFiles}`);
console.log(`  lines:    ${fmt(lineCovered, lineTotal, linePct)}  floor ${FLOOR}%`);
console.log(`  branches: ${fmt(branchCovered, branchTotal, branchPct)}  floor ${FLOOR}%`);
console.log(
  `  remaining: ${Math.max(0, Math.ceil((FLOOR / 100) * lineTotal - lineCovered))} lines, ${Math.max(
    0,
    Math.ceil((FLOOR / 100) * branchTotal - branchCovered),
  )} branches`,
);

if (!lineOk || !branchOk) {
  console.error('GATE FAIL: keep iterating slices. Do not lower the floors.');
  process.exit(1);
}
console.log(`GATE PASS: ${FLOOR}%+ lines and branches on testable source.`);
process.exit(0);
