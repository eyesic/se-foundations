import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineMdastPlugin, markdownToHtml } from 'satteri';

// Turns fenced code in a module README into runnable cells.
//
// Rules (the same ones the module markdown conventions document):
//   - a `sql` or `python` fence under `## Concepts` or `## Walkthrough`
//     becomes a runnable cell seeded with the fence text verbatim;
//   - `<!-- static -->` on the line before a fence leaves it static;
//   - `<!-- local: reason -->` leaves it static and adds a "Run this locally"
//     badge carrying the reason;
//   - `<!-- cells -->` anywhere in `## Exercises` gives that module's numbered
//     exercises empty cells, with reveal-solution text taken from
//     `solutions.md`;
//   - `<!-- local-exercises: 2,3 -->` gives those numbers a badge and no cell.
//
// Every marker is optional: a module with no markers still gets runnable
// Concepts/Walkthrough cells and simply gets no exercise cells.

const RUNNABLE_LANGS = new Set(['sql', 'python']);
const CELL_SECTIONS = new Set(['concepts', 'walkthrough']);

const STATIC_MARKER = /^<!--\s*static\s*-->$/;
const LOCAL_MARKER = /^<!--\s*local\s*:\s*([\s\S]*?)\s*-->$/;
const CELLS_MARKER = /^<!--\s*cells\s*-->$/;
const LOCAL_EXERCISES_MARKER = /^<!--\s*local-exercises\s*:\s*([\s\S]*?)\s*-->$/;

const solutionCache = new Map();

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Injected HTML is spliced back into the Markdown and re-parsed, and a blank
// line ends an HTML block. Encoding every newline as a character reference
// keeps each injection on one source line; the browser decodes it back, in an
// attribute and inside a <pre> alike.
function oneLine(html) {
  return html.replace(/\r?\n/g, '&#10;');
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Reads every numbered section of a module's solutions.md once. Section N is
// the first heading below the title whose text matches `^(Exercise )?N[.:]`,
// searched from `## Exercises` when the file has one, otherwise from the top.
// The `#` title is skipped: every solutions.md is titled `# NN. Solutions`,
// which would otherwise claim exercise NN and reveal the whole file.
function readSolutions(moduleDir) {
  if (solutionCache.has(moduleDir)) return solutionCache.get(moduleDir);

  const file = path.join(moduleDir, 'solutions.md');
  const sections = new Map();
  if (!existsSync(file)) {
    solutionCache.set(moduleDir, sections);
    return sections;
  }

  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  const headings = [];
  let inFence = false;
  let searchFrom = 0;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^\s*```/.test(line)) inFence = !inFence;
    if (inFence) continue;
    const match = /^(#{1,6})\s+(.*?)\s*$/.exec(line);
    if (!match) continue;
    headings.push({ line: i, depth: match[1].length, text: match[2] });
    if (match[1].length === 2 && /^exercises$/i.test(match[2])) searchFrom = i;
  }

  for (let h = 0; h < headings.length; h += 1) {
    const heading = headings[h];
    if (heading.line < searchFrom) continue;
    if (heading.depth === 1) continue;
    const number = /^(?:Exercise\s+)?(\d+)[.:]/.exec(heading.text);
    if (!number) continue;
    const key = Number(number[1]);
    if (sections.has(key)) continue;

    let end = lines.length;
    for (let k = h + 1; k < headings.length; k += 1) {
      if (headings[k].depth <= heading.depth) {
        end = headings[k].line;
        break;
      }
    }
    const body = lines.slice(heading.line + 1, end).join('\n').trim();
    const fence = /^\s*```([A-Za-z0-9_+-]*)/m.exec(body);
    sections.set(key, {
      title: heading.text,
      body,
      lang: fence ? fence[1].toLowerCase() : '',
    });
  }

  solutionCache.set(moduleDir, sections);
  return sections;
}

function cellOpenTag({ id, lang, code, exercise }) {
  const attrs = [
    'class="cell' + (exercise ? ' cell--exercise' : '') + '"',
    'data-cell',
    'data-cell-id="' + escapeHtml(id) + '"',
    'data-lang="' + escapeHtml(lang) + '"',
    'data-code="' + oneLine(escapeHtml(code)) + '"',
  ];
  if (exercise) attrs.push('data-exercise');
  return '<div ' + attrs.join(' ') + '><div class="cell__mount" data-cell-mount></div>';
}

function localBadge(reason) {
  const text = reason ? 'Run this locally — ' + reason : 'Run this locally';
  return '<p class="badge badge--local" data-local-badge>' + escapeHtml(text) + '</p>';
}

export function cellsPlugin() {
  return defineMdastPlugin({
    name: 'se-foundations-cells',
    before(root, ctx) {
      const filePath = ctx.fileURL ? fileURLToPath(ctx.fileURL) : '';
      // Cells only ever come from a module README; solutions.md and every
      // other markdown file renders untouched.
      if (path.basename(filePath).toLowerCase() !== 'readme.md') return;
      const moduleDir = path.dirname(filePath);
      if (path.basename(path.dirname(moduleDir)) !== 'modules') return;

      const children = root.children ?? [];
      let section = '';
      let sectionCells = 0;
      let marker = null;
      let exerciseCellsRequested = false;
      let localExercises = new Set();
      const exerciseNumbers = [];
      let exerciseAnchor = null;

      for (const node of children) {
        if (node.type === 'heading' && node.depth === 2) {
          section = slugify(ctx.textContent(node));
          sectionCells = 0;
          marker = null;
          continue;
        }

        if (node.type === 'html') {
          const value = node.value.trim();
          if (STATIC_MARKER.test(value)) {
            marker = { kind: 'static' };
            continue;
          }
          const local = LOCAL_MARKER.exec(value);
          if (local) {
            marker = { kind: 'local', reason: local[1] };
            continue;
          }
          if (section === 'exercises' && CELLS_MARKER.test(value)) {
            exerciseCellsRequested = true;
            continue;
          }
          const localExercise = LOCAL_EXERCISES_MARKER.exec(value);
          if (section === 'exercises' && localExercise) {
            localExercises = new Set(
              localExercise[1]
                .split(',')
                .map((part) => Number(part.trim()))
                .filter((n) => Number.isInteger(n)),
            );
            continue;
          }
          continue;
        }

        if (node.type === 'code') {
          const lang = (node.lang ?? '').toLowerCase();
          const active = marker;
          marker = null;

          if (active && active.kind === 'local') {
            ctx.insertBefore(node, { raw: localBadge(active.reason), mdxExpressions: false });
            continue;
          }
          if (active && active.kind === 'static') continue;
          if (!CELL_SECTIONS.has(section) || !RUNNABLE_LANGS.has(lang)) continue;

          sectionCells += 1;
          const id = section + '-' + sectionCells;
          ctx.replaceNode(node, [
            {
              raw: cellOpenTag({ id, lang, code: node.value, exercise: false }),
              mdxExpressions: false,
            },
            node,
            { raw: '</div>', mdxExpressions: false },
          ]);
          continue;
        }

        if (section === 'exercises' && node.type === 'list' && node.ordered) {
          const start = Number.isInteger(node.start) ? node.start : 1;
          const count = (node.children ?? []).length;
          for (let i = 0; i < count; i += 1) exerciseNumbers.push(start + i);
          exerciseAnchor = node;
          marker = null;
          continue;
        }

        marker = null;
      }

      if (!exerciseCellsRequested || !exerciseAnchor || exerciseNumbers.length === 0) return;

      const solutions = readSolutions(moduleDir);
      const blocks = [];
      for (const number of exerciseNumbers) {
        const solution = solutions.get(number);
        if (localExercises.has(number)) {
          blocks.push(
            '<section class="exercise-cell"><h3 class="exercise-cell__title">Exercise ' +
              number +
              '</h3>' +
              localBadge('this exercise runs on your own machine') +
              '</section>',
          );
          continue;
        }
        if (!solution || !RUNNABLE_LANGS.has(solution.lang)) continue;

        const rendered = markdownToHtml(solution.body);
        const solutionHtml = typeof rendered === 'string' ? rendered : rendered.html;
        blocks.push(
          '<section class="exercise-cell"><h3 class="exercise-cell__title">Exercise ' +
            number +
            '</h3>' +
            cellOpenTag({ id: 'exercise-' + number, lang: solution.lang, code: '', exercise: true }) +
            '<div class="cell__solution" data-solution hidden>' +
            solutionHtml +
            '</div></div></section>',
        );
      }

      if (blocks.length === 0) return;
      ctx.insertAfter(exerciseAnchor, {
        raw: oneLine('<div class="exercise-cells">' + blocks.join('') + '</div>'),
        mdxExpressions: false,
      });
    },
  });
}

export default cellsPlugin;
