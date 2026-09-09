// Browser-only convenience storage. There is no account and no server: this is
// localStorage in one browser on one machine, and it does not replace ticking
// and committing progress.md.

export interface CellState {
  code: string;
  revealed: boolean;
}

export interface ModuleState {
  cells: Record<string, CellState>;
  updatedAt: string;
}

const PREFIX = 'se-foundations:v1:';

function key(moduleSlug: string): string {
  return PREFIX + moduleSlug;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/** Absent or unparseable storage falls back to an empty state, never an error. */
export function readModuleState(moduleSlug: string): ModuleState {
  const empty: ModuleState = { cells: {}, updatedAt: '' };
  if (!isBrowser()) return empty;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key(moduleSlug));
  } catch {
    return empty;
  }
  if (!raw) return empty;
  try {
    const parsed = JSON.parse(raw) as Partial<ModuleState>;
    if (!parsed || typeof parsed !== 'object' || typeof parsed.cells !== 'object' || !parsed.cells) {
      return empty;
    }
    const cells: Record<string, CellState> = {};
    for (const [id, value] of Object.entries(parsed.cells)) {
      if (!value || typeof value !== 'object') continue;
      const cell = value as Partial<CellState>;
      cells[id] = {
        code: typeof cell.code === 'string' ? cell.code : '',
        revealed: cell.revealed === true,
      };
    }
    return { cells, updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '' };
  } catch {
    return empty;
  }
}

/** Stale ids from an edited module stay in storage but are simply never read. */
export function writeCellState(moduleSlug: string, cellId: string, state: CellState): void {
  if (!isBrowser()) return;
  const current = readModuleState(moduleSlug);
  current.cells[cellId] = state;
  current.updatedAt = new Date().toISOString();
  try {
    window.localStorage.setItem(key(moduleSlug), JSON.stringify(current));
  } catch {
    // Storage full or blocked. The page keeps working; nothing is persisted.
  }
}

export function readCellState(moduleSlug: string, cellId: string): CellState | undefined {
  return readModuleState(moduleSlug).cells[cellId];
}
