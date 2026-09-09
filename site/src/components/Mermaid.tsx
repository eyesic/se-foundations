import { useEffect } from 'react';

// `mermaid` fences stay static text in the markdown (and on GitHub, which
// renders them as diagrams itself). Here they are drawn client-side, after the
// page has loaded, so no diagram code runs during the build.
export default function Mermaid() {
  useEffect(() => {
    const blocks = Array.from(
      document.querySelectorAll<HTMLElement>('pre > code.language-mermaid, pre.language-mermaid'),
    );
    if (blocks.length === 0) return;

    let cancelled = false;
    void (async () => {
      const mermaid = (await import('mermaid')).default;
      mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });
      for (let index = 0; index < blocks.length; index += 1) {
        if (cancelled) return;
        const block = blocks[index];
        const pre = block.tagName === 'PRE' ? block : block.parentElement;
        if (!pre) continue;
        const source = block.textContent ?? '';
        try {
          const { svg } = await mermaid.render(`mermaid-${index}`, source);
          if (cancelled) return;
          const figure = document.createElement('figure');
          figure.className = 'mermaid';
          figure.innerHTML = svg;
          pre.replaceWith(figure);
        } catch {
          // A diagram that will not parse stays as its own source text, which
          // is what GitHub shows anyway.
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
