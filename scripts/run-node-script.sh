#!/usr/bin/env bash
# Runs a repository TypeScript script if Node.js can strip types (22.6+).
# Usage: run-node-script.sh <script.ts> [args...]
set -eu
: "${NODE_PIN:?NODE_PIN must be set; run this through make.}"

remedy="With nvm, run make setup to install Node.js $NODE_PIN; without nvm, install Node.js $NODE_PIN yourself."

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found. $remedy" >&2
  exit 1
fi

if ! node -e 'const [major, minor] = process.versions.node.split(".").map(Number); process.exit(major > 22 || (major === 22 && minor >= 6) ? 0 : 1)'; then
  echo "Node.js $(node -v) cannot run the repository scripts. $remedy" >&2
  exit 1
fi

exec node --experimental-strip-types "$@"
