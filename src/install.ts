/* How to install an app, in the languages the app itself speaks.
 *
 * The app page is in English, and it is the page a person reads BEFORE they have the
 * app — so an app that speaks eight languages was being handed out in one. The step
 * people get stuck on is Android's warning about installing a file from outside the
 * store, and that is exactly the step a stranger reading English is least able to judge.
 *
 * The English steps sit in the same file as the reference the others are translated from.
 * This translates one block, not the site. BRIEF.md put a translated site off until four
 * apps; the owner approved this narrower piece on 2026-09-26.
 *
 * A translation of an install warning that is wrong is worse than none, so every
 * language says whether a native speaker has checked it. `checked: false` must carry
 * `unchecked` — a line, in that language, saying so and asking to be told. `checked: true`
 * must not, so marking a language checked is also the moment the warning comes off.
 *
 * Only the pure rules live here, so `npm test` can reach them without Astro.
 */
import { unknownTokens } from './release.ts';

export type InstallSection = { heading: string; steps: string[] };
export type InstallLanguage = {
  checked: boolean;
  unchecked?: string;
  title: string;
  sections: InstallSection[];
};

/** Every problem with an install file, as messages. Empty means it is fine.
 *  `appLanguages` is the app's own `languages:` list; `known` is the tokens this app can
 *  fill (see release.ts). */
export function installProblems(
  langs: Record<string, InstallLanguage>,
  appLanguages: string[] | undefined,
  known: string[],
): string[] {
  const out: string[] = [];
  // "Every translation says what en says, no more" (install/README.md). The meaning cannot
  // be checked here, but the shape can: a dropped or merged step is how a translation
  // usually drifts, and the update step it would drop is the one that keeps the records.
  const source = langs.en;
  if (!Object.keys(langs).length) out.push('languages: is empty — add en, or delete the file');
  else if (!source) out.push('en: missing — it is the source every other language translates');
  for (const [code, l] of Object.entries(langs)) {
    if (source && code !== 'en') {
      if (l.sections.length !== source.sections.length) {
        out.push(`${code}: has ${l.sections.length} section(s), en has ${source.sections.length} — every language says what en says`);
      } else {
        l.sections.forEach((s, i) => {
          const want = source.sections[i].steps.length;
          if (s.steps.length !== want) {
            out.push(`${code}: section ${i + 1} has ${s.steps.length} step(s), en has ${want} — every language says what en says`);
          }
        });
      }
    }
    // English is the version the others are translated from, and the one the owner can
    // read to know what every other language is meant to say. Its author wrote it.
    if (code === 'en' && !l.checked) out.push('en: the English is the source — it is checked: true');
    if (!appLanguages?.includes(code)) {
      out.push(`${code}: the app does not list ${code} in languages:, so the page cannot offer it`);
    }
    if (!l.checked && !l.unchecked?.trim()) {
      out.push(`${code}: checked is false, so it needs an unchecked: line saying so, in ${code}`);
    }
    if (l.checked && l.unchecked) {
      out.push(`${code}: checked is true — delete the unchecked: line, it is no longer true`);
    }
    const prose = [l.title, l.unchecked ?? '', ...l.sections.flatMap((s) => [s.heading, ...s.steps])];
    for (const text of prose) {
      for (const t of unknownTokens(text, known)) out.push(`${code}: {${t}} cannot be filled for this app`);
    }
  }
  return out;
}

/** Problems with the set of install files: each is named after its app, as apps/<slug>.md
 *  is, and no app has two. Otherwise the first file found wins and the other is never
 *  checked or shown, and an error names an install/<slug>.md that does not exist. */
export function installFileProblems(files: { file: string; app: string }[]): string[] {
  const out: string[] = [];
  const seen = new Map<string, string>();
  for (const { file, app } of files) {
    // The name on disk, not the content loader's id: that is a slug of it, so Logger.md
    // would pass as "logger" and an error could name a file that does not exist.
    const name = file.split('/').pop()!.replace(/\.md$/, '');
    if (name !== app) out.push(`${file} says app: ${app} — name it install/${app}.md`);
    const first = seen.get(app);
    if (first) out.push(`${first} and ${file} are both for ${app} — keep one`);
    else seen.set(app, file);
  }
  return out;
}

/** The languages to show, in the order the app lists them — the same order as the
 *  Languages fact on the page, so the two read as one list. */
export function installOrder(langs: Record<string, InstallLanguage>, appLanguages: string[] = []) {
  return appLanguages.filter((c) => c in langs).map((code) => ({ code, ...langs[code] }));
}
