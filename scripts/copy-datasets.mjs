// Copies everything the browser needs to serve itself from its own origin:
// the seven CSVs, the non-threaded DuckDB-WASM bundle, and Pyodide's core.
// Runs as `prebuild`, so `dist/` never depends on a third-party CDN.
import { cpSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'site', 'public');

const DUCKDB_FILES = [
  // Non-threaded bundles only. The threaded (coi) bundle needs COOP/COEP
  // headers, which GitHub Pages cannot set.
  'duckdb-mvp.wasm',
  'duckdb-browser-mvp.worker.js',
  'duckdb-eh.wasm',
  'duckdb-browser-eh.worker.js',
];

const PYODIDE_FILES = [
  'pyodide.mjs',
  'pyodide.asm.js',
  'pyodide.asm.mjs',
  'pyodide.asm.wasm',
  'python_stdlib.zip',
  'pyodide-lock.json',
];

function copyInto(targetDir, sourceDir, names) {
  rmSync(targetDir, { recursive: true, force: true });
  mkdirSync(targetDir, { recursive: true });
  let copied = 0;
  for (const name of names) {
    const from = path.join(sourceDir, name);
    try {
      statSync(from);
    } catch {
      continue;
    }
    cpSync(from, path.join(targetDir, name));
    copied += 1;
  }
  return copied;
}

const datasetsSource = path.join(root, 'datasets');
const csvNames = readdirSync(datasetsSource).filter((name) => name.endsWith('.csv'));
const csvCount = copyInto(path.join(publicDir, 'datasets'), datasetsSource, csvNames);

const duckdbSource = path.join(root, 'node_modules', '@duckdb', 'duckdb-wasm', 'dist');
const duckdbCount = copyInto(path.join(publicDir, 'duckdb'), duckdbSource, DUCKDB_FILES);

const pyodideSource = path.join(root, 'node_modules', 'pyodide');
const pyodideCount = copyInto(path.join(publicDir, 'pyodide'), pyodideSource, PYODIDE_FILES);

if (csvCount !== 7) {
  throw new Error(`Expected 7 CSVs in datasets/, copied ${csvCount}`);
}
if (duckdbCount !== DUCKDB_FILES.length) {
  throw new Error(`Missing DuckDB-WASM assets: copied ${duckdbCount}/${DUCKDB_FILES.length}`);
}
if (pyodideCount < 5) {
  throw new Error(`Missing Pyodide assets: copied ${pyodideCount}`);
}

console.log(
  `copy-datasets: ${csvCount} CSVs, ${duckdbCount} DuckDB files, ${pyodideCount} Pyodide files -> site/public/`,
);
