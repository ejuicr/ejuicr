#!/usr/bin/env bash
# Fixed app/identity; private runtime credentials never enter CI.
set -euo pipefail

[[ "$DEPLOY_IMAGE" =~ ^ghcr\.io/ejuicr/ejuicr@sha256:[0-9a-f]{64}$ ]]
[[ "$GITHUB_SHA" =~ ^[0-9a-f]{40}$ ]]
[[ "$DEPLOY_HOST" =~ ^[a-zA-Z0-9][a-zA-Z0-9.-]+$ ]]
[[ -n "$DEPLOY_SSH_KEY" && -n "$DEPLOY_KNOWN_HOSTS" ]]

directory=$(mktemp -d)
trap 'rm -f "$directory/key" "$directory/known_hosts"; rmdir "$directory"' EXIT
umask 077
printf '%s\n' "$DEPLOY_SSH_KEY" > "$directory/key"
printf '%s\n' "$DEPLOY_KNOWN_HOSTS" > "$directory/known_hosts"

ssh -F /dev/null -T -i "$directory/key" \
  -o BatchMode=yes -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes \
  -o "UserKnownHostsFile=$directory/known_hosts" -o GlobalKnownHostsFile=/dev/null \
  -o ConnectTimeout=15 -o ServerAliveInterval=15 -o ServerAliveCountMax=4 \
  "ejuicr-deploy@$DEPLOY_HOST" "deploy $GITHUB_SHA $DEPLOY_IMAGE"
