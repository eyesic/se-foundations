// AC1.1 / AC1.2: the site must render the module Markdown without altering it.
// For every page, the multiset of fenced-code texts in the source file must
// equal the multiset of <pre> texts in the built HTML, and every runnable
// cell's seed must be its fence, character for character.
//
// Usage: node scripts/verify-content.mjs   (run after `npm run build`)
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, 'dist');
const modulesDir = path.join(root, 'modules');

if (!existsSync(distDir)) {
  console.error('verify-content: dist/ is missing. Run `npm run build` first.');
  process.exit(1);
}

// ------------------------------------------------------------------- parsing

/** Every fenced block in a Markdown file, dedented the way the parser dedents it. */
function sourceFences(markdown) {
  const fences = [];
  const lines = markdown.split(/\r?\n/);
  let open = null;
  for (let i = 0; i < lines.length; i += 1) {
    const match = /^(\s*)```([A-Za-z0-9_+-]*)\s*$/.exec(lines[i]);
    if (!match) continue;
    if (!open) {
      open = { indent: match[1].length, start: i };
    } else if (match[2] === '') {
      fences.push(
        lines
          .slice(open.start + 1, i)
          .map((line) => line.slice(open.indent))
          .join('\n')
          .trimEnd(),
      );
      open = null;
    }
  }
  return fences;
}

function decodeEntities(html) {
  return html
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

/** Drops every reveal-solution panel: its text comes from solutions.md, not this page. */
function stripSolutionPanels(html) {
  let out = html;
  for (;;) {
    const start = out.indexOf('<div class="cell__solution"');
    if (start === -1) return out;
    let depth = 0;
    let index = start;
    let end = -1;
    const tag = /<\/?div\b/g;
    tag.lastIndex = start;
    let match;
    while ((match = tag.exec(out)) !== null) {
      depth += match[0] === '</div' ? -1 : 1;
      index = match.index;
      if (depth === 0) {
        end = out.indexOf('>', index) + 1;
        break;
      }
    }
    if (end === -1) return out.slice(0, start);
    out = out.slice(0, start) + out.slice(end);
  }
}

function builtPreTexts(html) {
  const texts = [];
  const pre = /<pre\b[^>]*>([\s\S]*?)<\/pre>/g;
  let match;
  while ((match = pre.exec(html)) !== null) {
    texts.push(decodeEntities(match[1].replace(/<[^>]+>/g, '')).trimEnd());
  }
  return texts;
}

function cellSeeds(html) {
  const seeds = [];
  const cell = /<div class="cell[^"]*"[^>]*data-cell-id="([^"]*)"[^>]*data-code="([^"]*)"/g;
  let match;
  while ((match = cell.exec(html)) !== null) {
    seeds.push({ id: match[1], code: decodeEntities(match[2]) });
  }
  return seeds;
}

function diffMultisets(expected, actual) {
  const counts = new Map();
  for (const value of expected) counts.set(value, (counts.get(value) ?? 0) + 1);
  for (const value of actual) counts.set(value, (counts.get(value) ?? 0) - 1);
  const missing = [];
  const extra = [];
  for (const [value, count] of counts) {
    for (let i = 0; i < count; i += 1) missing.push(value);
    for (let i = 0; i < -count; i += 1) extra.push(value);
  }
  return { missing, extra };
}

// -------------------------------------------------------------------- checks

const failures = [];
let pagesChecked = 0;
let fencesChecked = 0;
let seedsChecked = 0;

const pages = [];
for (const moduleName of readdirSync(modulesDir).sort()) {
  pages.push({
    source: path.join(modulesDir, moduleName, 'README.md'),
    built: path.join(distDir, moduleName, 'index.html'),
    label: `${moduleName}/README.md`,
  });
  pages.push({
    source: path.join(modulesDir, moduleName, 'solutions.md'),
    built: path.join(distDir, moduleName, 'solutions', 'index.html'),
    label: `${moduleName}/solutions.md`,
  });
}

for (const page of pages) {
  if (!existsSync(page.source)) continue;
  if (!existsSync(page.built)) {
    failures.push(`${page.label}: no built page at ${path.relative(root, page.built)}`);
    continue;
  }
  pagesChecked += 1;

  const markdown = readFileSync(page.source, 'utf8');
  const html = stripSolutionPanels(readFileSync(page.built, 'utf8'));

  const expected = sourceFences(markdown);
  const actual = builtPreTexts(html);
  fencesChecked += expected.length;

  const { missing, extra } = diffMultisets(expected, actual);
  if (missing.length > 0 || extra.length > 0) {
    failures.push(
      `${page.label}: ${missing.length} fence(s) missing from the page, ` +
        `${extra.length} block(s) on the page that are not in the source`,
    );
    for (const value of missing.slice(0, 2)) {
      failures.push(`  missing: ${JSON.stringify(value.slice(0, 120))}`);
    }
    for (const value of extra.slice(0, 2)) {
      failures.push(`  extra:   ${JSON.stringify(value.slice(0, 120))}`);
    }
  }

  // Every runnable cell is seeded with the fence text verbatim (AC2.1).
  for (const seed of cellSeeds(html)) {
    if (seed.id.startsWith('exercise-')) {
      seedsChecked += 1;
      if (seed.code !== '') {
        failures.push(`${page.label}: exercise cell ${seed.id} is pre-filled, it must be empty`);
      }
      continue;
    }
    seedsChecked += 1;
    if (!expected.includes(seed.code.trimEnd())) {
      failures.push(`${page.label}: cell ${seed.id} is not seeded with a fence from the source`);
    }
  }
}

for (const failure of failures) console.error(failure);
console.log(
  `verify-content: ${pagesChecked} pages, ${fencesChecked} source fences, ${seedsChecked} cell seeds checked`,
);
if (failures.length > 0) process.exit(1);
