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
  };
}

function baseUrl(): string {
  const base = import.meta.env.BASE_URL || '/';
  return base.endsWith('/') ? base : base + '/';
}

let runtimePromise: Promise<PyodideRuntime> | undefined;

async function boot(): Promise<PyodideRuntime> {
  const base = baseUrl();
  const indexURL = new URL(base + 'pyodide/', window.location.origin).href;
  const module = (await import(/* @vite-ignore */ indexURL + 'pyodide.mjs')) as {
    loadPyodide: (options: { indexURL: string }) => Promise<PyodideRuntime>;
  };
  const pyodide = await module.loadPyodide({ indexURL });

  // The seven CSVs land at both `datasets/x.csv` and `x.csv` so the exercises
  // that open either path run exactly as written.
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
 * Runs code and keeps stdout and the traceback apart: stdout is what print()
 * wrote, error is the traceback and nothing else.
 */
export async function runPython(code: string): Promise<PythonResult> {
  const pyodide = await getPyodide();
  const out: string[] = [];
  pyodide.setStdout({ batched: (text: string) => out.push(text) });
  pyodide.setStderr({ batched: (text: string) => out.push(text) });
  try {
    pyodide.runPython(code);
    return { stdout: out.join('\n'), error: '' };
  } catch (error) {
    return { stdout: out.join('\n'), error: error instanceof Error ? error.message : String(error) };
  } finally {
    pyodide.setStdout({ batched: () => {} });
    pyodide.setStderr({ batched: () => {} });
  }
}
