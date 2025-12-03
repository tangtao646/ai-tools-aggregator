#!/bin/sh
# entrypoint.sh
# Copies any .crt files from the mounted /app/certs directory into the system
# trust store and runs update-ca-certificates, then execs the server binary.

set -e

CERT_SRC_DIR="/app/certs"
CERT_DST_DIR="/usr/local/share/ca-certificates"

echo "entrypoint: checking for mounted certs in ${CERT_SRC_DIR}..."
if [ -d "${CERT_SRC_DIR}" ]; then
  found=0
  for f in "${CERT_SRC_DIR}"/*.crt; do
    if [ -f "$f" ]; then
      echo "entrypoint: installing cert $f"
      cp "$f" "${CERT_DST_DIR}/"
      found=1
    fi
  done
  if [ "$found" -eq 1 ]; then
    echo "entrypoint: updating CA certificates"
    update-ca-certificates || true
  else
    echo "entrypoint: no certs found in ${CERT_SRC_DIR}"
  fi
else
  echo "entrypoint: certs dir ${CERT_SRC_DIR} does not exist"
fi

echo "entrypoint: starting server"
exec /server
#!/bin/sh
set -e

# If a corporate CA has been mounted into /etc/ssl/certs_extra, copy it
# into the system CA directory and update the CA bundle so Go and other
# processes can verify TLS endpoints.
if [ -d "/etc/ssl/certs_extra" ]; then
  if [ -f "/etc/ssl/certs_extra/corp.crt" ]; then
    echo "Found corp.crt in /etc/ssl/certs_extra — installing to system trust store"
    cp /etc/ssl/certs_extra/corp.crt /usr/local/share/ca-certificates/corp.crt
    update-ca-certificates || true
  else
    echo "No corp.crt found in /etc/ssl/certs_extra"
  fi
fi

# Exec the server binary
exec /server
