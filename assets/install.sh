#!/usr/bin/env sh
set -exo pipefail
curl -fsSL https://deno.land/x/install/install.sh | sh
export __RAD_VERSION__=8.0.3
deno install --global --unstable -f -A -n rad https://deno.land/x/rad@v$__RAD_VERSION__/src/bin.ts
