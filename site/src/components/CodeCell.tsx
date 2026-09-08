import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MAX_ROWS, runQuery, type QueryResult } from '../lib/duckdb';
import { runPython } from '../lib/pyodide';
import { readCellState, writeCellState } from '../lib/storage';

// One component for every cell on the page. The markdown pipeline emits a
// static placeholder (`<div data-cell>` wrapping the original highlighted
// fence); this hydrates each placeholder in place, so a page with JavaScript
// off still shows every fence exactly as GitHub does.

type Lang = 'sql' | 'python';

interface Placeholder {
  root: HTMLElement;
  mount: HTMLElement;
  id: string;
  lang: Lang;
  code: string;
  exercise: boolean;
}

let sqlEngineReady = false;
let pythonReady = false;

function statusForFirstRun(lang: Lang): string {
  if (lang === 'sql') return sqlEngineReady ? 'Running…' : 'Loading the SQL engine…';
  return pythonReady ? 'Running…' : 'Loading Python…';
}

function ResultTable({ result }: { result: QueryResult }) {
  if (result.rowCount === 0) {
    return <p className="cell__empty">0 rows</p>;
  }
  return (
    <>
      <div className="cell__tablewrap">
        <table className="cell__table">
          <thead>
            <tr>
              {result.columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((value, cellIndex) => (
                  <td key={cellIndex}>{value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {result.rowCount > MAX_ROWS ? (
        <p className="cell__footer">
          showing {MAX_ROWS} of {result.rowCount} rows
        </p>
      ) : (
        <p className="cell__footer">
          {result.rowCount} {result.rowCount === 1 ? 'row' : 'rows'}
        </p>
      )}
    </>
  );
}

function CodeCell({ cell, moduleSlug }: { cell: Placeholder; moduleSlug: string }) {
  const stored = useMemo(() => readCellState(moduleSlug, cell.id), [moduleSlug, cell.id]);
  const [code, setCode] = useState(stored?.code ?? cell.code);
  const [status, setStatus] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [stdout, setStdout] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [revealed, setRevealed] = useState(stored?.revealed === true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // A debounced write can land after a reveal, so it must not carry the
  // reveal flag it captured 500ms ago.
  const revealedRef = useRef(revealed);

  useEffect(() => {
    revealedRef.current = revealed;
    const panel = cell.root.querySelector<HTMLElement>('[data-solution]');
    if (panel) panel.hidden = !revealed;
  }, [cell.root, revealed]);

  useEffect(() => () => clearTimeout(saveTimer.current), []);

  const onChange = useCallback(
    (value: string) => {
      setCode(value);
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        writeCellState(moduleSlug, cell.id, { code: value, revealed: revealedRef.current });
      }, 500);
    },
    [cell.id, moduleSlug],
  );

  const run = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setError('');
    setResult(null);
    setStdout(null);
    setStatus(statusForFirstRun(cell.lang));
    try {
      if (cell.lang === 'sql') {
        const queryResult = await runQuery(code);
        sqlEngineReady = true;
        setResult(queryResult);
      } else {
        const pythonResult = await runPython(code);
        pythonReady = true;
        setStdout(pythonResult.stdout);
        if (pythonResult.error) setError(pythonResult.error);
      }
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : String(thrown));
    } finally {
      setRunning(false);
      setStatus('');
    }
  }, [cell.lang, code, running]);

  const reset = useCallback(() => {
    const seeded = cell.exercise ? '' : cell.code;
    setCode(seeded);
    setResult(null);
    setStdout(null);
    setError('');
    clearTimeout(saveTimer.current);
    writeCellState(moduleSlug, cell.id, { code: seeded, revealed });
  }, [cell.code, cell.exercise, cell.id, moduleSlug, revealed]);

  const reveal = useCallback(() => {
    const next = !revealed;
    setRevealed(next);
    writeCellState(moduleSlug, cell.id, { code, revealed: next });
  }, [cell.id, code, moduleSlug, revealed]);

  const label = cell.lang === 'sql' ? 'SQL' : 'Python';

  return (
    <div className="cell__ui">
      <textarea
        className="cell__editor"
        aria-label={`${label} code cell ${cell.id}`}
        data-cell-editor
        spellCheck={false}
        rows={Math.max(3, code.split('\n').length + 1)}
        value={code}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            void run();
          }
        }}
      />
      <div className="cell__controls">
        <button type="button" className="cell__run" onClick={() => void run()} disabled={running}>
          Run
        </button>
        <button type="button" onClick={reset} disabled={running}>
          Reset
        </button>
        {cell.exercise ? (
          <button type="button" onClick={reveal} disabled={running} data-reveal>
            {revealed ? 'Hide solution' : 'Show solution'}
          </button>
        ) : null}
        <span className="cell__lang">{label}</span>
        {status ? (
          <span className="cell__status" role="status" data-cell-status>
            {status}
          </span>
        ) : null}
      </div>
      {result ? (
        <div className="cell__output" data-cell-output>
          <ResultTable result={result} />
        </div>
      ) : null}
      {stdout !== null ? (
        <div className="cell__output" data-cell-output>
          {stdout.trim() === '' ? (
            <p className="cell__empty">No output. Use print() to show a value.</p>
          ) : (
            <pre className="cell__stdout">{stdout}</pre>
          )}
        </div>
      ) : null}
      {error ? (
        <div className="cell__error" role="alert" data-cell-error>
          <pre>{error}</pre>
        </div>
      ) : null}
    </div>
  );
}

function readPlaceholders(): Placeholder[] {
  const found: Placeholder[] = [];
  for (const root of Array.from(document.querySelectorAll<HTMLElement>('[data-cell]'))) {
    const mount = root.querySelector<HTMLElement>('[data-cell-mount]');
    const lang = root.dataset.lang;
    const id = root.dataset.cellId;
    if (!mount || !id || (lang !== 'sql' && lang !== 'python')) continue;
    found.push({
      root,
      mount,
      id,
      lang,
      code: root.dataset.code ?? '',
      exercise: root.hasAttribute('data-exercise'),
    });
  }
  return found;
}

/** Hydrates every cell placeholder on the page. Rendered once per module page. */
export default function CodeCells({ moduleSlug }: { moduleSlug: string }) {
  const [cells, setCells] = useState<Placeholder[]>([]);

  useEffect(() => {
    const found = readPlaceholders();
    for (const cell of found) cell.root.classList.add('is-hydrated');
    setCells(found);
  }, []);

  return (
    <>
      {cells.map((cell) =>
        createPortal(<CodeCell cell={cell} moduleSlug={moduleSlug} />, cell.mount, cell.id),
      )}
    </>
  );
}
