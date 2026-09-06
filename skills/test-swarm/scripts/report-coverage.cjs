#!/usr/bin/env node
/** Print folders and files furthest from the coverage floor. Coordinator picks the next slice from this list. */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const DIR = path.join(ROOT, '.test-swarm');
const SUMMARY =
  process.env.COVERAGE_SUMMARY ||
  path.join(ROOT, 'coverage', 'coverage-summary.json');
const GLOBS = path.join(DIR, 'untestable.globs');
const config = {};
if (fs.existsSync(path.join(DIR, 'config'))) {
  for (const line of fs.readFileSync(path.join(DIR, 'config'), 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i !== -1) config[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
}
const FLOOR = Number(config.FLOOR || 95);
const SRC = config.SRC || 'src';

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
  console.error('Run coverage first (json-summary).');
  process.exit(2);
}

const data = JSON.parse(fs.readFileSync(SUMMARY, 'utf8'));
const folders = new Map();
const files = [];
for (const [file, m] of Object.entries(data)) {
  if (file === 'total' || isUntestable(file) || !m.lines) continue;
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  const parts = rel.split('/');
  const srcIdx = parts.indexOf(SRC);
  const top = srcIdx >= 0 && parts[srcIdx + 1] ? parts[srcIdx + 1] : parts[0];
  const rec = folders.get(top) || { c: 0, t: 0, bc: 0, bt: 0 };
  rec.c += m.lines.covered;
  rec.t += m.lines.total;
  rec.bc += m.branches.covered;
  rec.bt += m.branches.total;
  folders.set(top, rec);
  files.push({
    rel,
    uncovered: m.lines.total - m.lines.covered,
    lp: m.lines.pct,
    bp: m.branches.pct,
  });
}

console.log('FOLDER\tLINE%\tLINES\tBRANCH%');
[...folders.entries()]
  .sort((a, b) => a[1].c / (a[1].t || 1) - b[1].c / (b[1].t || 1))
  .forEach(([top, r]) => {
    const lp = r.t ? (100 * r.c) / r.t : 100;
    const bp = r.bt ? (100 * r.bc) / r.bt : 100;
    if (lp + 1e-9 >= FLOOR && bp + 1e-9 >= FLOOR) return;
    console.log(`${top}\t${lp.toFixed(1)}\t${r.c}/${r.t}\t${bp.toFixed(1)}`);
  });

console.log('\nTOP UNCOVERED FILES');
files
  .filter((f) => f.uncovered > 0)
  .sort((a, b) => b.uncovered - a.uncovered)
  .slice(0, 40)
  .forEach((f) => console.log(`${f.uncovered}\tL${f.lp}\tB${f.bp}\t${f.rel}`));
