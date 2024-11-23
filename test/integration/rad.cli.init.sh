#!/usr/bin/env sh
set -ex
printf "\n\n📣 The following script is an integration test, testing users install rad. It is intended to be run within a docker container!\n\n";

deno install --global -f -A -n rad $PWD/src/bin.ts
mkdir -p /test-rad-project
cd /test-rad-project
export RAD_IMPORT_URL=/radness/src/mod.ts
rad -l info --init

# update rad file during integration test to full from local install, vs http
echo [debug]: integration test radfile:
cat rad.ts
echo [debug] Replacing 'import type { Task, Tasks } from SOME_HTTP_URL' with local import
rad_import_from_local='import type { Task, Tasks } from "/radness/src/mod.ts";'
sed -i "1s|.*|$rad_import_from_local|" rad.ts

# run integration task task
rad greet
