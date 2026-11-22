#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

echo "==> Waiting for Docker..."
for attempt in $(seq 1 45); do
  if docker info >/dev/null 2>&1; then
    break
  fi
  if [ "$attempt" -eq 45 ]; then
    echo "Docker did not become ready." >&2
    exit 1
  fi
  sleep 2
done

echo "==> Building the installable Meta Grey Label block theme..."
node scripts/package-wordpress.mjs --write

echo "==> Starting isolated WordPress + database..."
npx --yes @wordpress/env start

wp_env() {
  npx --yes @wordpress/env run cli wp "$@"
}

echo "==> Activating theme and configuring WordPress..."
wp_env theme activate meta-grey-label
wp_env option update blogname "Meta Grey Label"
wp_env option update permalink_structure "/%postname%/"
wp_env rewrite flush

echo "==> Importing native Gutenberg/FSE pages..."
wp_env mgl import-pages --apply --set-homepage

if [ -n "${CODESPACE_NAME:-}" ] && [ -n "${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-}" ]; then
  WORDPRESS_URL="https://${CODESPACE_NAME}-8888.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
  echo "==> Configuring the Codespaces forwarded URL: ${WORDPRESS_URL}"
  wp_env option update home "${WORDPRESS_URL}"
  wp_env option update siteurl "${WORDPRESS_URL}"
else
  WORDPRESS_URL="http://localhost:8888"
fi

echo
echo "Meta Grey Label WordPress is ready."
echo "Site:     ${WORDPRESS_URL}/"
echo "WP Admin: ${WORDPRESS_URL}/wp-admin/"
echo "Login:    admin / password"
echo
echo "For Codespaces, keep forwarded port 8888 Private unless you intentionally want to share it."
