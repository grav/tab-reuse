#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
extension_dir="$HOME/.local/share/chromium-extensions/tab-reuse"
runtime_files=(manifest.json background.js content.js routing.js)

# Check all sources before changing the installed copy.
for file in "${runtime_files[@]}"; do
  test -f "$repo_dir/$file"
done

# Remove only the symlink, leaving its target untouched.
if [ -L "$extension_dir" ]; then
  unlink "$extension_dir"
fi
mkdir -p "$extension_dir"

for file in "${runtime_files[@]}"; do
  cp -- "$repo_dir/$file" "$extension_dir/$file"
done

printf 'Copied extension to %s\nReload it in chrome://extensions, then refresh the affected pages.\n' "$extension_dir"
