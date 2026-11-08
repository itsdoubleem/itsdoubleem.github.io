#!/usr/bin/env bash
# Puts one Dependabot commit's change on top of the main that is checked out, staged, and
# prints the tree that makes. deps.yml runs it three times on the same main (to pick, to test,
# to merge), and merges only if all three print the same tree, so what lands is what was tested.
#
#   tools/apply-dep.sh <commit sha>
#
# Git only: nothing from the pull request runs. It refuses a commit that touches anything but
# package.json and package-lock.json, and fails without changing the tree if the change no
# longer applies (main moved under it; Dependabot rebases it and a later run tries again).
set -euo pipefail
sha=${1:-}
[[ $sha =~ ^[0-9a-f]{40}$ ]] || { echo "apply-dep: not a commit sha: '$sha'" >&2; exit 2; }
remote=${APPLY_DEP_REMOTE:-origin}
git fetch -q --no-tags --depth=2 "$remote" "$sha"
while IFS= read -r f; do
  case $f in
    package.json | package-lock.json) ;;
    *) echo "apply-dep: $sha changes $f" >&2; exit 1 ;;
  esac
done < <(git diff --name-only "$sha^" "$sha")
git diff --binary "$sha^" "$sha" -- package.json package-lock.json | git apply --index
git write-tree
