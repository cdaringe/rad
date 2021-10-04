#!/usr/bin/env sh
set -exo pipefail
curl -fsSL https://deno.land/x/install/install.sh | sh
export __RAD_VERSION__=6.7.0
deno install -A rad https://deno.land/x/rad@v$__RAD_VERSION__/src/bin.ts
