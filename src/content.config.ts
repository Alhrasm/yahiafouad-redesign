import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      slug: z.string(),
      wpId: z.number(),
      date: z.coerce.date(),
      modified: z.coerce.date(),
      excerpt: z.string(),
      category: z.enum(['parenting', 'relationships', 'self']),
      image: image().optional(),
      imageAlt: z.string(),
      tldr: z.string().optional(),
      readingMinutes: z.number(),
      faq: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
    }),
});

export const collections = { articles };
