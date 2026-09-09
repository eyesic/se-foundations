// AC2.2: a SQL cell in the browser must produce the output the Markdown
// already claims. This runs every `sql` fence that has an adjacent `text`
// output block through the same DuckDB-WASM build the site ships, loaded with
// the same seven statements, and checks every numeric token the Markdown
// claims against what the engine actually returned.
//
// Usage: node scripts/verify-sql.mjs
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const duckdb = require('@duckdb/duckdb-wasm/dist/duckdb-node-blocking.cjs');

// ---------------------------------------------------------------- load rules

/** The seven statements, read from the one file that owns them. */
function loadStatementsFromDatasetsReadme() {
  const source = readFileSync(path.join(root, 'datasets', 'README.md'), 'utf8');
  const statements = source.match(/^CREATE TABLE .*read_csv_auto\(.*\);$/gm) ?? [];
  if (statements.length !== 7) {
    throw new Error(`Expected 7 load statements in datasets/README.md, found ${statements.length}`);
  }
  return statements;
}

/** The site's loader must carry those statements character for character. */
function assertLoaderIsVerbatim(statements) {
  const loader = readFileSync(path.join(root, 'site', 'src', 'lib', 'duckdb.ts'), 'utf8');
  const missing = statements.filter((statement) => !loader.includes(statement));
  if (missing.length > 0) {
    throw new Error(
      'site/src/lib/duckdb.ts does not carry these statements verbatim:\n' + missing.join('\n'),
    );
  }
}

// ------------------------------------------------------------------- parsing

function fencesOf(markdown) {
  const fences = [];
  const lines = markdown.split(/\r?\n/);
  let open = null;
  for (let i = 0; i < lines.length; i += 1) {
    const match = /^(\s*)```([A-Za-z0-9_+-]*)\s*$/.exec(lines[i]);
    if (!match) continue;
    if (!open) {
      open = { indent: match[1].length, lang: match[2].toLowerCase(), start: i, line: i + 1 };
    } else if (match[2] === '') {
      const body = lines
        .slice(open.start + 1, i)
        .map((line) => line.slice(open.indent))
        .join('\n');
      fences.push({ lang: open.lang, body, line: open.line });
      open = null;
    }
  }
  return fences;
}

/**
 * Every `sql` fence in document order. A fence whose next fence is a `text`
 * block claims an output and is checked; the rest still run, because a
 * walkthrough's later steps depend on the tables its earlier steps create,
 * exactly as they do in a browser tab sharing one connection.
 */
function sqlFencesOf(markdown) {
  const fences = fencesOf(markdown);
  const statements = [];
  for (let i = 0; i < fences.length; i += 1) {
    if (fences[i].lang !== 'sql') continue;
    const next = fences[i + 1];
    statements.push({
      sql: fences[i].body,
      claimed: next && next.lang === 'text' ? next.body : null,
      line: fences[i].line,
    });
  }
  return statements;
}

// Mirrors splitStatements() in site/src/lib/duckdb.ts: DuckDB-WASM runs one
// statement per call, and a walkthrough cell often holds several.
function splitStatements(sql) {
  const statements = [];
  let current = '';
  let quote = null;
  let comment = null;

  for (let i = 0; i < sql.length; i += 1) {
    const char = sql[i];
    const next = sql[i + 1];
    current += char;

    if (comment === 'line') {
      if (char === '\n') comment = null;
      continue;
    }
    if (comment === 'block') {
      if (char === '*' && next === '/') {
        current += next;
        i += 1;
        comment = null;
      }
      continue;
    }
    if (quote) {
      if (char === quote) quote = null;
      continue;
    }
    if (char === "'" || char === '"') {
      quote = char;
      continue;
    }
    if (char === '-' && next === '-') {
      comment = 'line';
      continue;
    }
    if (char === '/' && next === '*') {
      comment = 'block';
      continue;
    }
    if (char === ';') {
      statements.push(current);
      current = '';
    }
  }

  if (current.trim() !== '') statements.push(current);
  return statements.filter((statement) => statement.trim() !== '');
}

/**
 * A setup fence is best effort: a module can show the same CREATE TABLE twice
 * (once as a concept, once as a walkthrough step), and the second attempt
 * failing must not stop the rest of that fence from running.
 */
function runAll(sql, bestEffort) {
  const statements = splitStatements(sql);
  let table = null;
  for (const statement of statements.length > 0 ? statements : [sql]) {
    try {
      table = connection.query(statement);
    } catch (error) {
      if (!bestEffort) throw error;
    }
  }
  return table;
}

/** DuckDB names its errors; a `text` block claiming one is claiming a failure. */
const ERROR_KIND = /\b(Constraint|Catalog|Binder|Conversion|Parser|Invalid Input|Not implemented) Error\b/;

function numericTokens(text) {
  const tokens = (text.match(/-?\d+(?:\.\d+)?/g) ?? [])
    .map((token) => Number(token))
    .filter((value) => Number.isFinite(value))
    .map((value) => String(value));
  const counts = new Map();
  for (const token of tokens) counts.set(token, (counts.get(token) ?? 0) + 1);
  return counts;
}

function formatValue(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

// Mirrors formatterFor() in site/src/lib/duckdb.ts: Arrow returns DATE and
// TIMESTAMP columns as epoch milliseconds, and the Markdown shows them the way
// the DuckDB CLI prints them.
function formatterFor(type) {
  const name = String(type);
  if (name.startsWith('Date')) {
    return (value) =>
      value === null || value === undefined
        ? 'NULL'
        : new Date(Number(value)).toISOString().slice(0, 10);
  }
  if (name.startsWith('Timestamp')) {
    return (value) =>
      value === null || value === undefined
        ? 'NULL'
        : new Date(Number(value)).toISOString().replace('T', ' ').slice(0, 19);
  }
  return formatValue;
}

// --------------------------------------------------------------------- setup

const statements = loadStatementsFromDatasetsReadme();
assertLoaderIsVerbatim(statements);

const dist = path.join(root, 'node_modules', '@duckdb', 'duckdb-wasm', 'dist');
const db = await duckdb.createDuckDB(
  {
    mvp: { mainModule: path.join(dist, 'duckdb-mvp.wasm'), mainWorker: null },
    eh: { mainModule: path.join(dist, 'duckdb-eh.wasm'), mainWorker: null },
  },
  new duckdb.VoidLogger(),
  duckdb.NODE_RUNTIME,
);
await db.instantiate(() => {});
const connection = db.connect();
for (const statement of statements) connection.query(statement);

// ----------------------------------------------------------------- the check

const modulesDir = path.join(root, 'modules');
const moduleNames = readdirSync(modulesDir).sort();

const SEED_TABLES = new Set([
  'plans',
  'customers',
  'subscriptions',
  'users',
  'usage_events',
  'support_tickets',
  'invoices',
]);

/** A module's walkthrough may create tables; the next module starts clean. */
function dropTablesCreatedByThisFile() {
  const names = connection
    .query("SELECT table_name FROM duckdb_tables() WHERE schema_name = 'main'")
    .toArray()
    .map((row) => row.toJSON().table_name);
  for (const name of names) {
    if (SEED_TABLES.has(name)) continue;
    connection.query(`DROP TABLE IF EXISTS "${name}" CASCADE;`);
  }
}

let checked = 0;
const failures = [];

for (const moduleName of moduleNames) {
  for (const fileName of ['README.md', 'solutions.md']) {
    const filePath = path.join(modulesDir, moduleName, fileName);
    let markdown;
    try {
      markdown = readFileSync(filePath, 'utf8');
    } catch {
      continue;
    }

    for (const pair of sqlFencesOf(markdown)) {
      const where = `${moduleName}/${fileName}:${pair.line}`;

      let table;
      try {
        table = runAll(pair.sql, pair.claimed === null);
      } catch (error) {
        // A fence with no claimed output is here only to set up the ones that
        // follow. It is allowed to fail (a fragment, a deliberate mistake).
        if (pair.claimed === null) continue;
        checked += 1;
        // Some blocks claim an error on purpose: "try to break it".
        const claimedKind = ERROR_KIND.exec(pair.claimed);
        if (claimedKind && error.message.includes(claimedKind[1])) continue;
        failures.push({ where, reason: `query failed: ${error.message}`, sql: pair.sql });
        continue;
      }

      if (pair.claimed === null) continue;
      checked += 1;
      if (ERROR_KIND.test(pair.claimed)) {
        failures.push({
          where,
          reason: 'the Markdown claims an error, but the query succeeded',
          sql: pair.sql,
        });
        continue;
      }

      const columns = table.schema.fields.map((field) => field.name);
      const formatters = table.schema.fields.map((field) => formatterFor(field.type));
      const rows = table.toArray();
      // The claimed block shows DuckDB's header row too, so column names are
      // part of what it claims (`pct_within_24h` claims a "24").
      const actualText = [columns.join(' ')]
        .concat(
          rows.map((row) => {
            const json = row.toJSON();
            return columns.map((column, index) => formatters[index](json[column])).join(' ');
          }),
        )
        .join('\n');
      const actual = numericTokens(actualText);
      // The claimed block often shows a slice ("the first six"), so the row
      // count itself is part of what the Markdown may be claiming.
      actual.set(String(rows.length), (actual.get(String(rows.length)) ?? 0) + 1);

      const claimed = numericTokens(pair.claimed);
      const missing = [];
      for (const [token, count] of claimed) {
        if ((actual.get(token) ?? 0) < count) missing.push(token);
      }
      if (missing.length > 0) {
        failures.push({
          where,
          reason: `claimed numbers not in the result: ${missing.join(', ')}`,
          sql: pair.sql,
        });
      }
    }

    dropTablesCreatedByThisFile();
  }
}

connection.close();

for (const failure of failures) {
  console.error(`FAIL ${failure.where}: ${failure.reason}`);
  console.error(failure.sql.split('\n').map((line) => '    ' + line).join('\n'));
}

const passed = checked - failures.length;
console.log(`verify-sql: ${passed}/${checked} SQL blocks match their stated output`);
if (failures.length > 0) process.exit(1);
