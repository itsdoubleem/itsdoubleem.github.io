/* One GitHub Issue per problem, found again by a marker in its body rather than by title.
 * A failed run emails someone and is gone from view by the next one; an open Issue stays
 * until the problem does, and this closes it when the problem has gone. Used by
 * check-live.mjs and sync-apps.mjs, on the GITHUB_TOKEN of the job that calls them. */
const marker = (key) => `<!-- doubleem:${key} -->`;
const author = 'github-actions[bot]';

export function issues({ repo, token, fetchImpl = fetch }) {
  const headers = { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'User-Agent': 'doubleem-site' };
  const api = async (path, init = {}) => {
    const res = await fetchImpl(`https://api.github.com/repos/${repo}${path}`, {
      ...init,
      headers: { ...headers, ...(init.body ? { 'Content-Type': 'application/json' } : {}) },
    });
    if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
    return res.json();
  };
  const find = async (key) => {
    const open = await api('/issues?state=open&per_page=100');
    // This job's own Issues only, with the marker as the last line. The repo is public, and a
    // stranger's Issue or quoted text must not be able to stand in for the alarm or close it.
    return open.find((i) => !i.pull_request && i.user?.login === author && i.body?.trimEnd().endsWith(marker(key)));
  };
  return {
    /** Opens the Issue, or brings the open one up to date. An unchanged one is not touched,
     *  so a check repeating itself every few hours sends one notification, not many. */
    async raise(key, title, text) {
      // 65536 is GitHub's limit on an Issue body.
      const body = `${text}\n\n${marker(key)}`.slice(-65000);
      const found = await find(key);
      if (!found) return api('/issues', { method: 'POST', body: JSON.stringify({ title, body }) });
      if (found.body.trim() === body.trim() && found.title === title) return found;
      return api(`/issues/${found.number}`, { method: 'PATCH', body: JSON.stringify({ title, body }) });
    },
    async clear(key, note = 'This has cleared by itself.') {
      const found = await find(key);
      if (!found) return null;
      await api(`/issues/${found.number}/comments`, { method: 'POST', body: JSON.stringify({ body: note }) });
      return api(`/issues/${found.number}`, { method: 'PATCH', body: JSON.stringify({ state: 'closed' }) });
    },
  };
}
