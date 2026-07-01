#!/usr/bin/env bash
# Redeploy script for the Gardening Helper app on the VPS.
#
# Pulls latest code, builds the backend, reloads it in pm2 via
# ecosystem.config.cjs, builds the frontend, and syncs the frontend
# build output to the static serving directory (e.g. nginx docroot).
#
# Usage: ./infra/deploy/deploy.sh
# Override the frontend target dir if needed:
#   FRONTEND_DEPLOY_DIR=/var/www/gardening-helper ./infra/deploy/deploy.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKEND_DIR="$REPO_ROOT/backend"
FRONTEND_DIR="$REPO_ROOT/frontend"
ECOSYSTEM_FILE="$SCRIPT_DIR/ecosystem.config.cjs"

FRONTEND_DEPLOY_DIR="${FRONTEND_DEPLOY_DIR:-/var/www/gardening-helper-frontend}"
FRONTEND_BUILD_DIR="$FRONTEND_DIR/dist/frontend/browser"

echo "==> Pulling latest changes"
git -C "$REPO_ROOT" pull --ff-only

echo "==> Building backend"
cd "$BACKEND_DIR"
npm ci
npm run build

echo "==> Reloading backend in pm2"
pm2 startOrReload "$ECOSYSTEM_FILE" --update-env
pm2 save

echo "==> Building frontend"
cd "$FRONTEND_DIR"
npm ci
npm run build

echo "==> Syncing frontend build to $FRONTEND_DEPLOY_DIR"
mkdir -p "$FRONTEND_DEPLOY_DIR"
rsync -a --delete "$FRONTEND_BUILD_DIR/" "$FRONTEND_DEPLOY_DIR/"

echo "==> Deploy complete"
