import * as duckdb from '@duckdb/duckdb-wasm';

// The seven load statements, copied verbatim from datasets/README.md:223-229.
// Same engine, same read_csv_auto type inference that produced the outputs in
// every solutions.md, so a browser cell and the local DuckDB CLI agree.
export const LOAD_STATEMENTS = [
  "CREATE TABLE plans            AS SELECT * FROM read_csv_auto('datasets/plans.csv');",
  "CREATE TABLE customers        AS SELECT * FROM read_csv_auto('datasets/customers.csv');",
  "CREATE TABLE subscriptions    AS SELECT * FROM read_csv_auto('datasets/subscriptions.csv');",
  "CREATE TABLE users            AS SELECT * FROM read_csv_auto('datasets/users.csv');",
  "CREATE TABLE usage_events     AS SELECT * FROM read_csv_auto('datasets/usage_events.csv');",
  "CREATE TABLE support_tickets  AS SELECT * FROM read_csv_auto('datasets/support_tickets.csv');",
  "CREATE TABLE invoices         AS SELECT * FROM read_csv_auto('datasets/invoices.csv');",
];

export const CSV_FILES = [
  'plans.csv',
  'customers.csv',
  'subscriptions.csv',
  'users.csv',
  'usage_events.csv',
  'support_tickets.csv',
  'invoices.csv',
];

export interface QueryResult {
  columns: string[];
  rows: string[][];
  rowCount: number;
}

function baseUrl(): string {
  const base = import.meta.env.BASE_URL || '/';
  return base.endsWith('/') ? base : base + '/';
}

let connectionPromise: Promise<duckdb.AsyncDuckDBConnection> | undefined;

async function connect(): Promise<duckdb.AsyncDuckDBConnection> {
  const base = baseUrl();
  // Non-threaded bundles only: the threaded build needs COOP/COEP headers that
  // GitHub Pages cannot set. Both are served from this site's own origin.
  const bundles: duckdb.DuckDBBundles = {
    mvp: {
      mainModule: base + 'duckdb/duckdb-mvp.wasm',
      mainWorker: base + 'duckdb/duckdb-browser-mvp.worker.js',
    },
    eh: {
      mainModule: base + 'duckdb/duckdb-eh.wasm',
      mainWorker: base + 'duckdb/duckdb-browser-eh.worker.js',
    },
  };

  const bundle = await duckdb.selectBundle(bundles);
  const worker = new Worker(bundle.mainWorker!);
  const db = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING), worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

  // Register each CSV under the exact path the load statements name, so those
  // statements can be run without a single character of rewriting.
  for (const name of CSV_FILES) {
    await db.registerFileURL(
      'datasets/' + name,
      base + 'datasets/' + name,
      duckdb.DuckDBDataProtocol.HTTP,
      false,
    );
  }

  const connection = await db.connect();
  for (const statement of LOAD_STATEMENTS) {
    await connection.query(statement);
  }
  return connection;
}

/** One engine per tab, created on the first Run and reused after that. */
export function getConnection(): Promise<duckdb.AsyncDuckDBConnection> {
  if (!connectionPromise) {
    connectionPromise = connect().catch((error) => {
      connectionPromise = undefined;
      throw error;
    });
  }
  return connectionPromise;
}

export function formatValue(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'object') return String(value);
  return String(value);
}

/**
 * Arrow hands DATE and TIMESTAMP columns back as epoch milliseconds. Render
 * them the way DuckDB's own CLI does, which is the way every solutions.md
 * output block shows them.
 */
export function formatterFor(type: unknown): (value: unknown) => string {
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

export const MAX_ROWS = 100;

/**
 * DuckDB-WASM runs one statement per call, but a walkthrough cell often holds
 * several (two CREATE TABLEs, then a SELECT). Split on semicolons that are not
 * inside a string or a comment, the way a REPL does.
 */
export function splitStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let quote: "'" | '"' | null = null;
  let comment: 'line' | 'block' | null = null;

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

export async function runQuery(sql: string): Promise<QueryResult> {
  const connection = await getConnection();
  const statements = splitStatements(sql);
  let table = await connection.query(statements[0] ?? sql);
  for (const statement of statements.slice(1)) {
    table = await connection.query(statement);
  }
  const columns = table.schema.fields.map((field) => field.name);
  const formatters = table.schema.fields.map((field) => formatterFor(field.type));
  const all = table.toArray();
  const rows = all.slice(0, MAX_ROWS).map((row: unknown) => {
    const record = row as { toJSON: () => Record<string, unknown> };
    const json = record.toJSON();
    return columns.map((column, index) => formatters[index](json[column]));
  });
  return { columns, rows, rowCount: all.length };
}
