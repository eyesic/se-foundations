import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

// modules/ is the canonical source. Both collections read it in place; nothing
// is copied or rewritten on disk.
const modules = defineCollection({
  loader: glob({ pattern: '*/README.md', base: './modules' }),
});

const solutions = defineCollection({
  loader: glob({ pattern: '*/solutions.md', base: './modules' }),
});

export const collections = { modules, solutions };
