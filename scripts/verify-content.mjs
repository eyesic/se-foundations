// AC1.1 / AC1.2: the site must render the module Markdown without altering it.
// For every page, the multiset of fenced-code texts, headings and table rows in
// the source file must equal the multiset the built HTML shows, and every
// runnable cell's seed must be its fence, character for character.
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

/**
 * The renderer applies smart typography, so an apostrophe on the page is not
 * the apostrophe in the file. Both sides are put back into ASCII before they
 * are compared; the words, not the glyphs, are what must match.
 */
function typography(text) {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/\u2014/g, '---')
    .replace(/\u2013/g, '--');
}

/**
 * Markdown inline markup the renderer consumes, removed so a source heading or
 * table cell can be compared with the text the page shows. Only the two forms
 * the curriculum uses in headings and tables: code spans and bold. Underscores
 * are left alone; `customer_id` is a word, not emphasis, and an odd backtick
 * never opened a code span, so it stays on the page as itself.
 */
function inlineText(markdown) {
  const text = markdown.replace(/\\([|\\`*_])/g, '$1');
  const paired = (text.match(/`/g) ?? []).length % 2 === 0;
  return typography(
    (paired ? text.replace(/`+/g, '') : text).replace(/\*\*/g, '').replace(/\s+/g, ' '),
  ).trim();
}

/** Every ATX heading outside a fence, as `h<depth>: text`. */
function sourceHeadings(markdown) {
  const headings = [];
  let inFence = false;
  for (const line of markdown.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = /^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
    if (match) headings.push(`h${match[1].length}: ${inlineText(match[2])}`);
  }
  return headings;
}

/** Splits a table row on the pipes that are not escaped. */
function tableCells(line) {
  const cells = [];
  let current = '';
  for (let i = 0; i < line.length; i += 1) {
    if (line[i] === '\\' && line[i + 1] === '|') {
      current += '\\|';
      i += 1;
      continue;
    }
    if (line[i] === '|') {
      cells.push(current);
      current = '';
      continue;
    }
    current += line[i];
  }
  cells.push(current);
  if (cells.length > 0 && cells[0].trim() === '') cells.shift();
  if (cells.length > 0 && cells[cells.length - 1].trim() === '') cells.pop();
  return cells.map(inlineText);
}

/**
 * Every table row outside a fence, minus the `|---|` alignment rows. A row is
 * cut or padded to the width of its header, which is what GitHub-flavoured
 * Markdown does with a row that has too many or too few cells.
 */
function sourceTableRows(markdown) {
  const rows = [];
  let inFence = false;
  let width = 0;
  for (const line of markdown.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (!/^ {0,3}\|/.test(line)) {
      width = 0;
      continue;
    }
    const cells = tableCells(line.trim());
    if (width === 0) {
      width = cells.length;
    } else if (cells.every((cell) => /^:?-+:?$/.test(cell))) {
      continue;
    }
    while (cells.length < width) cells.push('');
    rows.push(cells.slice(0, width).join(' | '));
  }
  return rows;
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

/** The rendered Markdown only: the nav, the footer and the page links are not it. */
function articleHtml(html) {
  const start = html.indexOf('<article class="prose">');
  const end = html.lastIndexOf('</article>');
  if (start === -1 || end === -1) return '';
  return html.slice(start, end);
}

function stripTags(html) {
  return typography(decodeEntities(html.replace(/<[^>]+>/g, '')))
    .replace(/\s+/g, ' ')
    .trim();
}

function builtHeadings(html) {
  const headings = [];
  const tag = /<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1>/g;
  let match;
  while ((match = tag.exec(html)) !== null) {
    // The exercise cells inject their own "Exercise N" title. That is site
    // furniture, not module Markdown.
    if (match[2].includes('exercise-cell__title')) continue;
    headings.push(`h${match[1]}: ${stripTags(match[3])}`);
  }
  return headings;
}

function builtTableRows(html) {
  const rows = [];
  const row = /<tr\b[^>]*>([\s\S]*?)<\/tr>/g;
  let match;
  while ((match = row.exec(html)) !== null) {
    const cells = [];
    const cell = /<t([hd])\b[^>]*>([\s\S]*?)<\/t\1>/g;
    let inner;
    while ((inner = cell.exec(match[1])) !== null) cells.push(stripTags(inner[2]));
    rows.push(cells.join(' | '));
  }
  return rows;
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
let headingsChecked = 0;
let rowsChecked = 0;

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

  // Headings and table rows: the other two things AC1.2 says are unaltered.
  const article = articleHtml(html);
  if (article === '') {
    failures.push(`${page.label}: the built page has no <article class="prose"> to compare`);
    continue;
  }

  const parts = [
    { what: 'heading', expected: sourceHeadings(markdown), actual: builtHeadings(article) },
    { what: 'table row', expected: sourceTableRows(markdown), actual: builtTableRows(article) },
  ];
  headingsChecked += parts[0].expected.length;
  rowsChecked += parts[1].expected.length;
  for (const part of parts) {
    const diff = diffMultisets(part.expected, part.actual);
    if (diff.missing.length === 0 && diff.extra.length === 0) continue;
    failures.push(
      `${page.label}: ${diff.missing.length} ${part.what}(s) missing from the page, ` +
        `${diff.extra.length} on the page that are not in the source`,
    );
    for (const value of diff.missing.slice(0, 2)) {
      failures.push(`  missing: ${JSON.stringify(value.slice(0, 120))}`);
    }
    for (const value of diff.extra.slice(0, 2)) {
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
  `verify-content: ${pagesChecked} pages, ${fencesChecked} source fences, ` +
    `${headingsChecked} headings, ${rowsChecked} table rows, ${seedsChecked} cell seeds checked`,
);
if (failures.length > 0) process.exit(1);
