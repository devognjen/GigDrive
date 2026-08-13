#!/bin/sh
# nginx re-resolves upstreams through the container runtime's embedded DNS,
# whose address differs between Docker (127.0.0.11) and Podman (aardvark-dns).
# Discover it from resolv.conf and let the stock nginx entrypoint envsubst it
# into /etc/nginx/templates/*.template.
set -e

NGINX_RESOLVER=$(awk '/^nameserver/ { print $2; exit }' /etc/resolv.conf)
export NGINX_RESOLVER

exec /docker-entrypoint.sh "$@"
