DO NOT CHECK IN YOUR PRIVATE CA CERTIFICATE

Place your corporate / proxy root CA PEM file here as `corp.crt` before building the backend image.

Example (on your machine):

  cp /path/to/your/corp.crt backend/go_service/certs/corp.crt

Then rebuild:

  docker-compose build backend
  docker-compose up -d

The `Dockerfile` will copy `certs/corp.crt` into the image and run `update-ca-certificates` so
the container trusts certificates issued by your proxy/internal CA.

This README is intentionally added so CI or other contributors don't accidentally commit a
private root certificate into the repository. Keep the actual PEM private.
