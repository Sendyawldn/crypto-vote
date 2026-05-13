# CryptoVote

CryptoVote is a web-based electronic voting application for elections that need a clear voter flow, visible tally state, and a security model based on El Gamal homomorphic encryption.

This first implementation is a Next.js 15 single-deployable application. It includes the voter workspace, native BigInt El Gamal encryption, homomorphic ciphertext aggregation, receipt verification, live result visualization, public API contracts, and Docker lanes for local development and production-style runs. It is still a demo system, not a certified election platform.

## Audience

CryptoVote is for student election committees, civic technology teams, and engineering teams that need to prototype verifiable e-voting workflows before connecting production identity, key management, and audit infrastructure.

## Stack

- Next.js 15 App Router with TypeScript
- Tailwind CSS v4 for CSS-first styling
- shadcn/ui-style local components for buttons, cards, badges, progress, and accessible primitives
- Recharts for live result charts
- Docker Compose for development and production lanes

## Setup

Install dependencies:

```bash
npm install
```

Run the local app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Validation

```bash
npm run lint
npm run test
npm run build
```

Run all checks:

```bash
npm run validate
```

## Docker

Development with hot reload:

```bash
docker compose up --build
```

Production-style container:

```bash
docker compose -f compose.prod.yaml up --build
```

Both commands expose the app on `http://localhost:3000`.

## Configuration

The current slice does not require secrets. Future production work must add environment-backed values for election keys, session signing, database credentials, and audit storage.

## Documentation

- [Project Brief](docs/project-brief.md)
- [Architecture Decision Record](docs/architecture-decision-record.md)
- [Flow Overview](docs/flow-overview.md)
- [API Contract](docs/api-contract.md)
- [Database Schema](docs/database-schema.md)
- [Design Direction](docs/DESIGN.md)
- [Docker Runtime](docs/docker-runtime.md)
