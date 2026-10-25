#!/usr/bin/env bash
# Runs a command with the .nvmrc Node.js for this run only; the calling
# shell keeps its own Node.js. Modes: install (setup), use (doctor, verify).
set -eu

usage="usage: with-pinned-node.sh <install|use> <command> [args...]"
if [ $# -lt 2 ]; then
  echo "$usage" >&2
  exit 2
fi
mode="$1"
shift
: "${NODE_PIN:?NODE_PIN must be set; run this through make.}"

INVOKING_NODE="$(node -v 2>/dev/null || true)"
export INVOKING_NODE

nvm_script="${NVM_DIR:-${HOME:-}/.nvm}/nvm.sh"

# nvm use updates its PATH entry where it stands, so a Node.js earlier in
# PATH would still win; the pinned bin directory goes first instead.
put_pinned_node_first() {
  pinned_node="$(nvm which "$NODE_PIN" 2>/dev/null)" || return 0
  PATH="$(dirname "$pinned_node"):$PATH"
  export PATH
}

# nvm install looks the version up online, so it runs only when missing; the
# default alias makes new shells start with the pinned version.
install_pinned_node() {
  set +eu
  . "$nvm_script" --no-use
  { nvm use --silent "$NODE_PIN" >/dev/null 2>&1 || nvm install "$NODE_PIN"; }
  install_status=$?
  if [ "$install_status" -eq 0 ]; then
    nvm alias default "$NODE_PIN"
    put_pinned_node_first
  fi
  # nvm alias can exit 0 after a failed write, so the alias is read back.
  default_version="$(nvm version default 2>/dev/null)"
  set -eu
  if [ "$install_status" -ne 0 ]; then
    echo "make setup: 'nvm install' failed for the version in .nvmrc." >&2
    exit 1
  fi
  if [ "$default_version" != "v$NODE_PIN" ]; then
    echo "make setup: 'nvm alias default $NODE_PIN' did not take effect (default: ${default_version:-none})." >&2
    exit 1
  fi
}

# With NVM_SYMLINK_CURRENT set, nvm use replaces $NVM_DIR/current, which
# make doctor must not change.
use_pinned_node() {
  unset NVM_SYMLINK_CURRENT
  set +eu
  . "$nvm_script" --no-use
  nvm use --silent "$NODE_PIN" >/dev/null 2>&1 && put_pinned_node_first
  set -eu
}

case "$mode" in
  install)
    if [ -s "$nvm_script" ]; then install_pinned_node; fi
    ;;
  use)
    # Without the pinned version, the shell's Node.js stays and checks fail.
    if [ -s "$nvm_script" ]; then use_pinned_node; fi
    ;;
  *)
    echo "$usage" >&2
    exit 2
    ;;
esac

exec "$@"
