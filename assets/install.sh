#!/usr/bin/env sh
set -exo pipefail
curl -fsSL https://deno.land/x/install/install.sh | sh
export __RAD_VERSION__=main
deno install -A rad__test https://deno.land/x/rad@v$__RAD_VERSION__/src/bin.ts
