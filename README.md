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

User voting page:

```text
/
```

Admin page:

```text
/admin
```

Demo admin login:

```text
Email: admin@kampus.test
Password: admin123
```

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

The app starts with empty election data. The admin must open `/admin`, log in, fill the election identity, add candidates, and start the election before users can vote. The public voting page only asks for a voter name. It does not require a user account or email.

The demo keeps a fixed private exponent so presentation runs are reproducible, while each vote encryption still uses a fresh random nonce. Production keys must be generated and guarded through a formal key ceremony, not source code.

Optional MongoDB persistence:

```bash
MONGODB_URI="mongodb://localhost:27017" MONGODB_DB="cryptovote"
```

When `MONGODB_URI` is absent, the admin API uses in-memory state for local demo use.

## Documentation

- [Project Brief](docs/project-brief.md)
- [Architecture Decision Record](docs/architecture-decision-record.md)
- [Flow Overview](docs/flow-overview.md)
- [API Contract](docs/api-contract.md)
- [Database Schema](docs/database-schema.md)
- [Design Direction](docs/DESIGN.md)
- [Docker Runtime](docs/docker-runtime.md)
