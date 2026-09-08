import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const root = path.resolve(process.cwd());
const moduleSlugs = readdirSync(path.join(root, 'modules')).sort();

const SQL_MODULE = '03-sql-foundations';
const PYTHON_MODULE = '07-python-for-ses';

/** Fence languages that must never become a runnable cell (AC2.5). */
const STATIC_LANGS = ['bash', 'powershell', 'json', 'text', 'mermaid', 'markdown'];

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
