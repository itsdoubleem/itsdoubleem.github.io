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
    // Real captures of the shipping build, shown as a strip on the detail page. `alt`
    // describes what is on the screen for someone who cannot see it; `caption` says why
    // the screen is worth looking at. Where a capture shows amounts, say in the caption
    // that the figures are invented — a stranger cannot tell sample data from a real
    // payslip, and letting them assume is the same sin as inventing a number outright.
    // `shape` says what the capture is OF, so the page can stop treating a sheet of paper
    // like a phone screen: 'phone' sits in the strip at 390/844, 'page' spans the full
    // width and is cropped to its head. Getting this wrong is what made the 근무내역서
    // capture a two-metre column on the first attempt.
    screenshots: z
      .array(
        z.object({
          src: z.string(),
          alt: z.string(),
          caption: z.string().optional(),
          shape: z.enum(['phone', 'page']).default('phone'),
        }),
      )
      .default([]),
    // What is different about this app on each platform it runs on. Optional: a piece of
    // work with nothing platform-specific to say simply has no such section, the same way
    // an empty kind never gets a heading on the homepage.
    platformNotes: z
      .array(
        z.object({
          platform: z.enum(['android', 'ios', 'web', 'macos', 'windows']),
          note: z.string(),
        }),
      )
      .default([]),
    // A claim this page makes, paired with how a stranger can confirm it for themselves.
    // This is the site's answer to the install counters and star ratings it refuses to
    // carry: proof someone can check beats a number they have to take on faith. Every
    // entry must have been checked on the shipping build by whoever wrote it.
    verify: z
      .array(z.object({ claim: z.string(), how: z.string() }))
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
