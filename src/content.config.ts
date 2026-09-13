import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// The apps live in /apps at the repo root, not under src/ — they are the content
// source of truth and are meant to be editable without opening the site code.
// The schema below is the whole contract — adding an app means adding one file
// that satisfies it, and nothing in src/ ever names an app.
const apps = defineCollection({
  loader: glob({ pattern: ['*.md', '!README.md'], base: './apps' }),
  schema: z.object({
    slug: z.string(),
    name: z.string(),
    nativeName: z.string().optional(),
    tagline: z.string().max(90, 'Taglines over 90 characters wrap badly on a phone.'),
    // What KIND of work this is — how the homepage groups it. Distinct from `category`,
    // which is the subject matter. A novel and an app are both work; only one is an app.
    type: z.enum(['app', 'tool', 'writing', 'novel', 'bot', 'other']).default('app'),
    category: z.enum(['Work', 'Study', 'Health', 'Productivity', 'Tools']),
    status: z.enum(['live', 'beta']),
    platforms: z.array(z.enum(['android', 'ios', 'web', 'macos', 'windows'])).nonempty(),
    price: z.literal('free'),
    privacy: z.enum(['on-device', 'account-required']),
    languages: z.array(z.string()).optional(),
    icon: z.string(),
    // A real screenshot of the app, captured from the running build — never an
    // illustration. Falls back to the icon when absent.
    card: z.string().optional(),
    screenshots: z
      .array(z.object({ src: z.string(), alt: z.string() }))
      .default([]),
    order: z.number(),
    sourceUrl: z.string().optional(),
    downloads: z
      .array(
        z.object({
          label: z.string(),
          href: z.string(),
          note: z.string().optional(),
        }),
      )
      .nonempty('An app with no way to get it does not belong on the site.'),
  }),
});

// Guides are optional and keyed to an app by slug. An app without one simply has no
// guide link — nothing else changes.
const stepSchema = z.object({
  image: z.string(),
  alt: z.string(),
  kicker: z.string(),
  title: z.string(),
  body: z.string(),
  note: z.string().optional(),
});

const guides = defineCollection({
  loader: glob({ pattern: ['*.md', '!README.md'], base: './guides' }),
  schema: z.object({
    app: z.string(),
    title: z.string(),
    lead: z.string(),
    before: z.object({
      heading: z.string(),
      body: z.string(),
      items: z.array(z.string()).nonempty(),
    }),
    steps: z.array(stepSchema).nonempty(),
    after: z.array(stepSchema).default([]),
  }),
});

export const collections = { apps, guides };
