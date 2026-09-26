/* How to install an app, in the languages the app itself speaks.
 *
 * The app page is in English, and it is the page a person reads BEFORE they have the
 * app — so an app that speaks eight languages was being handed out in one. The step
 * people get stuck on is Android's warning about installing a file from outside the
 * store, and that is exactly the step a stranger reading English is least able to judge.
 *
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
  for (const [code, l] of Object.entries(langs)) {
    if (code === 'en') {
      out.push('en: the page itself is the English version — do not translate it into English');
      continue;
    }
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

/** The languages to show, in the order the app lists them — the same order as the
 *  Languages fact on the page, so the two read as one list. */
export function installOrder(langs: Record<string, InstallLanguage>, appLanguages: string[] = []) {
  return appLanguages.filter((c) => c !== 'en' && c in langs).map((code) => ({ code, ...langs[code] }));
}
