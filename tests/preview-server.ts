import { execFileSync } from 'node:child_process';

// `astro preview` in Astro 7 always daemonises: the command starts a background
// server and returns. Playwright's `webServer` treats that as a server that
// exited early, so the preview is started and stopped here instead. Doing it
// this way also means a run can never bind to a preview left over from an
// earlier build, which is the whole point of testing the shipped `dist/`.

export const PREVIEW_URL = 'http://localhost:4321/se-foundations/';

function astro(...args: string[]): string {
  return execFileSync('npx', ['astro', ...args], {
    encoding: 'utf8',
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

/** Stops the background preview server. Quiet when there is nothing to stop. */
export function stopPreview(): void {
  try {
    astro('preview', 'stop');
  } catch {
    // No server registered, which is the state we wanted anyway.
  }
}

/** Starts a preview over the current `dist/` and waits for it to answer. */
export async function startPreview(): Promise<void> {
  stopPreview();
  astro('preview');

  const deadline = Date.now() + 60_000;
  for (;;) {
    try {
      const response = await fetch(PREVIEW_URL);
      if (response.ok) return;
    } catch {
      // Not listening yet.
    }
    if (Date.now() > deadline) {
      stopPreview();
      throw new Error(`preview server did not answer at ${PREVIEW_URL} within 60s`);
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}
