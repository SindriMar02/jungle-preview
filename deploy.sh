#!/bin/bash
# Publish the PUBLIC files to gh-pages from an isolated worktree.
# Never checkout gh-pages inside the main tree: its files live at the repo
# root, so clearing the root there would delete the real source.
# OUTREACH.md and the local server are deliberately NOT published — a client
# preview must never expose internal notes.
set -e
REPO="$(cd "$(dirname "$0")" && pwd)"
WT="$(mktemp -d)/jungle-pages"

git -C "$REPO" worktree add --detach -q "$WT"
cd "$WT"
git branch -D gh-pages >/dev/null 2>&1 || true
git checkout -q --orphan gh-pages
git rm -rq --cached . >/dev/null 2>&1 || true
find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +

cp -R "$REPO/assets" .
cp "$REPO/index.html" "$REPO/styles.css" "$REPO/app.js" "$REPO/robots.txt" .
touch .nojekyll

git add -A
git -c user.email=sindri@klubbr.is -c user.name="Sindri Már" \
    commit -q -m "Deploy $(git -C "$REPO" rev-parse --short HEAD) (noindex preview)"
git push -q -f origin gh-pages
cd "$REPO"
git worktree remove --force "$WT"
echo "published:"; git -C "$REPO" ls-tree --name-only origin/gh-pages
