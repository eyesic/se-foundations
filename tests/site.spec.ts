import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const root = path.resolve(process.cwd());
const moduleSlugs = readdirSync(path.join(root, 'modules')).sort();

const SQL_MODULE = '03-sql-foundations';
const PYTHON_MODULE = '07-python-for-ses';

/** Fence languages that must never become a runnable cell (AC2.5). */
const STATIC_LANGS = ['bash', 'powershell', 'json', 'text', 'mermaid', 'markdown'];

/**
 * What each module's markers must produce. Counted from the built pages; the
 * point of writing them down is that a marker-parsing regression, which would
 * turn static fences into cells or drop the local badges, fails here instead
 * of shipping.
 */
const EXPECTED_CELLS: Record<string, { cells: number; badges: number }> = {
  '00-start-here': { cells: 0, badges: 0 },
  '01-how-software-works': { cells: 0, badges: 0 },
  '02-terminal-and-git': { cells: 0, badges: 0 },
  '03-sql-foundations': { cells: 34, badges: 2 },
  '04-sql-intermediate': { cells: 33, badges: 0 },
  '05-data-modeling': { cells: 7, badges: 0 },
  '06-apis-and-http': { cells: 0, badges: 0 },
  '07-python-for-ses': { cells: 11, badges: 8 },
  '08-integrations-and-architecture': { cells: 0, badges: 0 },
  '09-capstone-pipeline': { cells: 0, badges: 6 },
  '10-the-se-craft': { cells: 0, badges: 0 },
  '11-job-search-kit': { cells: 0, badges: 0 },
};

/** The output module 07's solutions.md states for the exercises that run here. */
const SOLUTION_OUTPUT: Array<{ exercise: number; output: RegExp }> = [
  { exercise: 4, output: /medium\s+641/ },
  { exercise: 5, output: /open: 229 of 1615 = 14\.2%/ },
  { exercise: 7, output: /avg 3\.84 over 988 scored, 627 excluded/ },
];

async function firstCellByLang(page: Page, lang: 'sql' | 'python') {
  const cell = page.locator(`[data-cell][data-lang="${lang}"]`).first();
  await expect(cell.locator('textarea[data-cell-editor]')).toBeVisible();
  return cell;
}

test('AC1.3 every page lists all 12 modules in folder order with one current', async ({ page }) => {
  expect(moduleSlugs).toHaveLength(12);

  for (const slug of moduleSlugs) {
    await page.goto(`${slug}/`);
    const links = page.locator('.nav__list a');
    await expect(links).toHaveCount(12);

    const hrefs = await links.evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLAnchorElement).getAttribute('href') ?? ''),
    );
    expect(hrefs).toEqual(moduleSlugs.map((name) => `/se-foundations/${name}/`));

    const current = page.locator('.nav__list a[aria-current="page"]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveAttribute('href', `/se-foundations/${slug}/`);
  }
});

test('AC1.5 a 375px viewport clips nothing and keeps Run reachable', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto(`${SQL_MODULE}/`);
  await expect(page.locator('[data-cell] textarea[data-cell-editor]').first()).toBeVisible();

  // Nothing may push the page itself sideways. Code blocks and result tables
  // are allowed to scroll inside their own box, which is why the check is on
  // the document rather than on every descendant.
  const overflow = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
  expect(overflow.documentScrollWidth).toBeLessThanOrEqual(overflow.width + 1);
  expect(overflow.bodyScrollWidth).toBeLessThanOrEqual(overflow.width + 1);

  const run = page.locator('button.cell__run').first();
  await expect(run).toBeVisible();
  const box = await run.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(376);
});

test('AC2.1 and AC2.5 only sql and python fences become runnable cells', async ({ page }) => {
  let totalCells = 0;
  for (const slug of moduleSlugs) {
    await page.goto(`${slug}/`);
    await expect(page.locator('.nav__list a')).toHaveCount(12);
    const cells = page.locator('[data-cell]');
    const count = await cells.count();
    totalCells += count;

    for (let index = 0; index < count; index += 1) {
      const cell = cells.nth(index);
      const lang = await cell.getAttribute('data-lang');
      expect(['sql', 'python']).toContain(lang);
      await expect(cell.locator('button.cell__run')).toHaveCount(1);
    }

    for (const lang of STATIC_LANGS) {
      const insideACell = page.locator(`[data-cell] pre[data-language="${lang}"]`);
      await expect(insideACell).toHaveCount(0);
    }
  }
  expect(totalCells).toBeGreaterThan(0);
});

test('AC2.1 a sql cell is seeded with its fence verbatim', async ({ page }) => {
  await page.goto(`${SQL_MODULE}/`);
  const source = readFileSync(path.join(root, 'modules', SQL_MODULE, 'README.md'), 'utf8');
  const cell = await firstCellByLang(page, 'sql');
  const seeded = await cell.locator('textarea[data-cell-editor]').inputValue();
  expect(seeded.length).toBeGreaterThan(0);
  expect(source).toContain(seeded);
});

test('AC2.2 a sql cell returns the rows the Markdown claims', async ({ page }) => {
  await page.goto(`${SQL_MODULE}/`);
  const cell = await firstCellByLang(page, 'sql');
  await cell
    .locator('textarea[data-cell-editor]')
    .fill("SELECT count(*) AS n FROM customers WHERE industry = 'Education';");
  await cell.locator('button.cell__run').click();

  const output = cell.locator('[data-cell-output]');
  await expect(output).toBeVisible({ timeout: 120_000 });
  // solutions.md exercise 1 states 31 Education customers.
  await expect(output.locator('td')).toHaveText(['31']);
  await expect(cell.locator('[data-cell-error]')).toHaveCount(0);
});

test('AC2.3 and AC2.4 stdout and tracebacks land in separate regions', async ({ page }) => {
  await page.goto(`${PYTHON_MODULE}/`);
  const cell = await firstCellByLang(page, 'python');
  const editor = cell.locator('textarea[data-cell-editor]');

  await editor.fill('print("hello from the browser")');
  await cell.locator('button.cell__run').click();
  const output = cell.locator('[data-cell-output]');
  await expect(output).toContainText('hello from the browser', { timeout: 120_000 });
  await expect(cell.locator('[data-cell-error]')).toHaveCount(0);

  await editor.fill('print("before the error")\nraise ValueError("boom")');
  await cell.locator('button.cell__run').click();
  const error = cell.locator('[data-cell-error]');
  await expect(error).toContainText('ValueError', { timeout: 120_000 });
  await expect(output).toContainText('before the error');
  await expect(output).not.toContainText('ValueError');

  // Distinct elements, not one merged region.
  const sameElement = await page.evaluate(() => {
    const out = document.querySelector('[data-cell-output]');
    const err = document.querySelector('[data-cell-error]');
    return out === err || out?.contains(err ?? null) || err?.contains(out ?? null);
  });
  expect(sameElement).toBeFalsy();
});

test('AC3.1 and AC3.2 exercise cells start empty and reveal their solution', async ({ page }) => {
  await page.goto(`${SQL_MODULE}/`);
  const cell = page.locator('[data-cell][data-cell-id="exercise-1"]');
  const editor = cell.locator('textarea[data-cell-editor]');
  await expect(editor).toBeVisible();
  await expect(editor).toHaveValue('');

  const solution = cell.locator('[data-solution]');
  await expect(solution).toBeHidden();
  await cell.locator('button[data-reveal]').click();
  await expect(solution).toBeVisible();

  const solutionsMd = readFileSync(path.join(root, 'modules', SQL_MODULE, 'solutions.md'), 'utf8');
  const revealed = (await solution.locator('pre').first().innerText()).trim();
  expect(revealed.length).toBeGreaterThan(0);
  expect(solutionsMd).toContain(revealed);
});

test('AC3.3 typed code and a revealed solution survive a reload', async ({ page }) => {
  await page.goto(`${SQL_MODULE}/`);
  const cell = page.locator('[data-cell][data-cell-id="exercise-1"]');
  const editor = cell.locator('textarea[data-cell-editor]');
  await expect(editor).toBeVisible();

  await editor.fill('SELECT 1 AS my_own_attempt;');
  await cell.locator('button[data-reveal]').click();
  await expect(cell.locator('[data-solution]')).toBeVisible();
  // The editor write is debounced by 500ms.
  await page.waitForTimeout(900);

  await page.reload();
  const reloaded = page.locator('[data-cell][data-cell-id="exercise-1"]');
  await expect(reloaded.locator('textarea[data-cell-editor]')).toHaveValue(
    'SELECT 1 AS my_own_attempt;',
  );
  await expect(reloaded.locator('[data-solution]')).toBeVisible();
});

test('AC3.4 and AC3.5 the page says browser state is not the tracker', async ({ page }) => {
  await page.goto(`${SQL_MODULE}/`);
  const footer = page.locator('.footer');
  await expect(footer).toContainText('this browser only');
  await expect(footer).toContainText('progress.md');
});

test('AC2.1 and AC2.5 every module renders exactly the cells and badges its markers ask for', async ({
  page,
}) => {
  expect(moduleSlugs).toEqual(Object.keys(EXPECTED_CELLS));

  for (const slug of moduleSlugs) {
    const expected = EXPECTED_CELLS[slug];
    await page.goto(`${slug}/`);
    await expect(page.locator('[data-cell]'), `${slug}: runnable cells`).toHaveCount(expected.cells);
    await expect(page.locator('[data-local-badge]'), `${slug}: run-locally badges`).toHaveCount(
      expected.badges,
    );
    // A revealed solution is one numbered section of solutions.md. Its own `##`
    // headings would mean the whole file was pulled in.
    await expect(page.locator('[data-solution] h2'), `${slug}: solution panels`).toHaveCount(0);
  }
});

test('AC2.3 the concepts fence that opens customers.csv runs as the module says', async ({
  page,
}) => {
  await page.goto(`${PYTHON_MODULE}/`);
  const cells = page.locator('[data-cell][data-lang="python"]');
  const codes = await cells.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('data-code') ?? ''),
  );
  const index = codes.findIndex((code) => code.includes('open("customers.csv"'));
  expect(index, 'module 07 promises this fence runs in the browser').toBeGreaterThanOrEqual(0);

  const cell = cells.nth(index);
  await cell.locator('button.cell__run').click();
  const output = cell.locator('[data-cell-output]');
  await expect(output).toContainText('Redwood Analytics', { timeout: 120_000 });
  await expect(cell.locator('[data-cell-error]')).toHaveCount(0);
});

test('AC2.3 a python cell reads the CSVs by both of the paths the curriculum uses', async ({
  page,
}) => {
  await page.goto(`${PYTHON_MODULE}/`);
  const cell = await firstCellByLang(page, 'python');
  await cell.locator('textarea[data-cell-editor]').fill(
    [
      'import csv',
      'with open("customers.csv", newline="", encoding="utf-8") as handle:',
      '    customers = list(csv.DictReader(handle))',
      'with open("datasets/support_tickets.csv", newline="", encoding="utf-8") as handle:',
      '    tickets = list(csv.DictReader(handle))',
      'print(len(customers), len(tickets))',
    ].join('\n'),
  );
  await cell.locator('button.cell__run').click();

  // datasets/README.md: 200 customers, 1615 support tickets.
  await expect(cell.locator('[data-cell-output]')).toContainText('200 1615', { timeout: 120_000 });
  await expect(cell.locator('[data-cell-error]')).toHaveCount(0);
});

test('AC2.4 stderr lands in the error region and never in the next run', async ({ page }) => {
  await page.goto(`${PYTHON_MODULE}/`);
  const cell = await firstCellByLang(page, 'python');
  const editor = cell.locator('textarea[data-cell-editor]');
  const output = cell.locator('[data-cell-output]');
  const error = cell.locator('[data-cell-error]');

  // The marker has no trailing newline, and nothing else in this run writes to
  // stderr: this is exactly the write that used to stay in Pyodide's buffer and
  // surface under the following cell.
  await editor.fill(
    [
      'import sys',
      'sys.stderr.write("STDERR_MARKER_NO_NEWLINE")',
      'print("stdout stays here")',
    ].join('\n'),
  );
  await cell.locator('button.cell__run').click();
  await expect(error).toContainText('STDERR_MARKER_NO_NEWLINE', { timeout: 120_000 });
  await expect(output).toContainText('stdout stays here');
  await expect(output).not.toContainText('STDERR_MARKER_NO_NEWLINE');

  await editor.fill('print("the run after that")');
  await cell.locator('button.cell__run').click();
  await expect(output).toContainText('the run after that');
  await expect(output).not.toContainText('STDERR_MARKER_NO_NEWLINE');
  await expect(error).toHaveCount(0);

  // A warning is not stdout either.
  await editor.fill(['import warnings', 'warnings.warn("careful")', 'print("done")'].join('\n'));
  await cell.locator('button.cell__run').click();
  await expect(error).toContainText('UserWarning');
  await expect(output).toContainText('done');
  await expect(output).not.toContainText('UserWarning');
});

test('AC3.2 module 07 exercises 4, 5 and 7 run the solution they reveal', async ({ page }) => {
  await page.goto(`${PYTHON_MODULE}/`);
  const solutionsMd = readFileSync(path.join(root, 'modules', PYTHON_MODULE, 'solutions.md'), 'utf8');

  // In order: 5 and 7 reuse the `tickets` list 4 defines, the way one tab's
  // interpreter carries state from one cell to the next.
  for (const { exercise, output } of SOLUTION_OUTPUT) {
    const cell = page.locator(`[data-cell][data-cell-id="exercise-${exercise}"]`);
    await cell.locator('button[data-reveal]').click();
    const solution = cell.locator('[data-solution]');
    await expect(solution).toBeVisible();

    const revealed = (await solution.locator('pre').first().innerText()).trim();
    expect(revealed.length, `exercise ${exercise}: revealed code`).toBeGreaterThan(0);
    expect(solutionsMd).toContain(revealed);

    await cell.locator('textarea[data-cell-editor]').fill(revealed);
    await cell.locator('button.cell__run').click();
    await expect(cell.locator('[data-cell-output]')).toContainText(output, { timeout: 120_000 });
    await expect(cell.locator('[data-cell-error]')).toHaveCount(0);
  }
});
