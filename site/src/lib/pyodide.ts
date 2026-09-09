import { CSV_FILES } from './duckdb';

// Pyodide is served from this site's own origin. No micropip, no package
// downloads: the standard library is all these modules need. Fences that call
// an API or write a file are marked local instead.

export interface PythonResult {
  stdout: string;
  error: string;
}

interface PyodideRuntime {
  runPython: (code: string) => unknown;
  setStdout: (options: { batched: (text: string) => void }) => void;
  setStderr: (options: { batched: (text: string) => void }) => void;
  FS: {
    writeFile: (path: string, data: Uint8Array | string) => void;
    mkdir: (path: string) => void;
    chdir: (path: string) => void;
  };
}

function baseUrl(): string {
  const base = import.meta.env.BASE_URL || '/';
  return base.endsWith('/') ? base : base + '/';
}

// A cell has no file of its own, but module 07's solutions locate the CSVs with
// `Path(__file__).parents[2] / "datasets"`, the way a script inside a clone of
// this repo does. Standing in for that script at this path makes parents[2] the
// emulated filesystem root, which is where `datasets/` lives here.
const CELL_FILE = '/modules/07-python-for-ses/cell.py';

// Emptying the buffers is not the same as swapping the handlers. `flush()`
// pushes Python's own buffer down to the stream, and `os.fsync` makes Pyodide
// emit a line that has no trailing newline yet; without both, a partial write
// is either dropped or handed to whichever cell runs next.
const FLUSH = `
import sys as _cell_sys, os as _cell_os
for _cell_stream in (_cell_sys.stdout, _cell_sys.stderr):
    try:
        _cell_stream.flush()
        _cell_os.fsync(_cell_stream.fileno())
    except Exception:
        pass
del _cell_sys, _cell_os, _cell_stream
`;

let runtimePromise: Promise<PyodideRuntime> | undefined;

async function boot(): Promise<PyodideRuntime> {
  const base = baseUrl();
  const indexURL = new URL(base + 'pyodide/', window.location.origin).href;
  const module = (await import(/* @vite-ignore */ indexURL + 'pyodide.mjs')) as {
    loadPyodide: (options: { indexURL: string }) => Promise<PyodideRuntime>;
  };
  const pyodide = await module.loadPyodide({ indexURL });

  // The seven CSVs land at both `/datasets/x.csv` and `/x.csv`.
  try {
    pyodide.FS.mkdir('/datasets');
  } catch {
    // Already present.
  }
  await Promise.all(
    CSV_FILES.map(async (name) => {
      const response = await fetch(base + 'datasets/' + name);
      const text = await response.text();
      pyodide.FS.writeFile('/datasets/' + name, text);
      pyodide.FS.writeFile('/' + name, text);
    }),
  );
  // Pyodide starts in /home/pyodide, so without this every relative
  // `open("customers.csv")` and `open("datasets/x.csv")` in the curriculum
  // raises FileNotFoundError. Standing in the root is what makes both forms
  // resolve to the files written above.
  pyodide.FS.chdir('/');

  return pyodide;
}

/** One interpreter per tab, created on the first Run and reused after that. */
export function getPyodide(): Promise<PyodideRuntime> {
  if (!runtimePromise) {
    runtimePromise = boot().catch((error) => {
      runtimePromise = undefined;
      throw error;
    });
  }
  return runtimePromise;
}

/**
 * Runs code and keeps the two streams apart: stdout is what print() wrote,
 * error is stderr plus the traceback. Both are flushed before the handlers are
 * swapped, so nothing from one cell shows up under another.
 */
export async function runPython(code: string): Promise<PythonResult> {
  const pyodide = await getPyodide();
  pyodide.runPython('__file__ = ' + JSON.stringify(CELL_FILE));

  const out: string[] = [];
  const err: string[] = [];
  pyodide.setStdout({ batched: (text: string) => out.push(text) });
  pyodide.setStderr({ batched: (text: string) => err.push(text) });

  let traceback = '';
  try {
    pyodide.runPython(code);
  } catch (error) {
    traceback = error instanceof Error ? error.message : String(error);
  } finally {
    try {
      pyodide.runPython(FLUSH);
    } catch {
      // A flush that fails must not replace the cell's own error.
    }
    pyodide.setStdout({ batched: () => {} });
    pyodide.setStderr({ batched: () => {} });
  }

  return {
    stdout: out.join('\n'),
    error: [err.join('\n'), traceback].filter((part) => part !== '').join('\n'),
  };
}
