# Docker Runtime

## Sources

- Docker Compose Specification reference: https://docs.docker.com/reference/compose-file/, fetched 2026-05-13.
- Docker build best practices: https://docs.docker.com/build/building/best-practices/, fetched 2026-05-13.
- Docker Next.js development guide: https://docs.docker.com/guides/nextjs/develop/, fetched 2026-05-13.

## Development Lane

Use `compose.yaml` for local work. It bind-mounts the source tree, keeps `node_modules` in a named volume, and runs `npm run dev`.

```bash
docker compose up --build
```

The app listens on `http://localhost:3000`.

## Production Lane

Use `compose.prod.yaml` for a production-style build. The Dockerfile uses multi-stage builds and the Next.js standalone output.

```bash
docker compose -f compose.prod.yaml up --build
```

## Health Check

Both lanes call `/api/health`. A healthy response returns `{"status":"ok"}` with a timestamp.

## Security Notes

Do not pass secrets as Docker build arguments. Production election keys, session secrets, database credentials, and audit storage credentials must come from runtime secret injection or the deployment platform.

