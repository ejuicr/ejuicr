#!/usr/bin/env bash
# Signed-out image smoke test; no real database or credentials are supplied.
set -euo pipefail

image="${1:?usage: scripts/test-container.sh IMAGE}"
container=""
cleanup() {
  if [[ -n "$container" ]]; then
    docker rm -f "$container" >/dev/null
  fi
}
trap cleanup EXIT

container=$(docker run -d --read-only --cap-drop ALL \
  --security-opt no-new-privileges:true \
  --tmpfs /tmp --tmpfs /app/.next/cache:uid=1000,gid=1000 \
  -e JWT_SECRET=container-smoke-test-only "$image")

docker exec -i "$container" node --input-type=module - <<'JS'
import assert from 'node:assert/strict';
import { setTimeout } from 'node:timers/promises';
const origin = 'http://127.0.0.1:3000';
let home;
for (let attempt = 0; attempt < 30; attempt++) {
  try {
    home = await fetch(origin, { signal: AbortSignal.timeout(2000) });
    break;
  } catch {
    await setTimeout(1000);
  }
}
assert.equal(home?.status, 200, 'homepage must load');
const html = await home.text();
const asset = html.match(/(?:src|href)="([^" ]*\/_next\/static\/[^" ]+)"/)?.[1];
assert.ok(asset, 'homepage must reference a static asset');
assert.equal((await fetch(new URL(asset, origin))).status, 200, 'static asset must load');
assert.equal((await fetch(`${origin}/api/user/me`)).status, 401, 'signed-out API must deny access');
console.log('container smoke test passed');
JS
