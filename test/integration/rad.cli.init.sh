#!/usr/bin/env sh
set -ex
deno install --unstable -f -A -n rad $PWD/src/bin.ts
mkdir -p /test-rad-project
cd /test-rad-project
export RAD_IMPORT_URL=/radness/src/mod.ts
rad -l info --init
rad greet
