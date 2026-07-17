#!/usr/bin/env bash
# One-time helper: initialise git and push kubePill to GitHub.
#
#   ./scripts/init-repo.sh YOUR_GITHUB_USERNAME
#
# Create the empty repo on github.com first (no README, no license — this
# repo already has them).
set -euo pipefail

USER="${1:-}"
if [ -z "$USER" ]; then
  echo "usage: $0 YOUR_GITHUB_USERNAME"
  exit 1
fi

git init
git add .
git commit -m "kubePill: a floating kubectl cheat sheet"
git branch -M main
git remote add origin "https://github.com/$USER/kubepill.git"
git push -u origin main

echo
echo "Pushed. To publish binaries, cut a release:"
echo "  git tag v1.0.0"
echo "  git push origin v1.0.0"
echo
echo "GitHub Actions will build Windows/macOS/Linux and attach them to the release."
