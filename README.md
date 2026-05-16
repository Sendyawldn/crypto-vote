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

Copy `.env.example` to `.env.local` for local secrets. Do not commit `.env.local`.

The app starts with empty election data. The admin must open `/admin`, log in, fill the election identity, add candidates, add the DPT voter list, and start the election before users can vote. Clicking `Mulai Pemilihan` saves the active session so the public page can load its candidates. The public voting page asks for Email, ID, or NIM, then the voter must press `Cek DPT` before the ballot opens.

When the election is closed, clicking `Simpan State` archives the completed session into history and resets the active form to an empty draft for the next election.

`ELECTION_PRIVATE_KEY` may contain a decimal BigInt private exponent. When it is empty, the app falls back to a demo key so local presentations still run. The browser fetches only the matching public key from `/api/election/public-key`; the private key stays server-side. Production keys must be generated and guarded through a formal key ceremony, not source code.

Optional MongoDB persistence:

```bash
MONGODB_URI="mongodb://localhost:27017" MONGODB_DB="cryptovote"
```

When `MONGODB_URI` is set and MongoDB is reachable, election state, history, and encrypted vote ledger entries are stored in MongoDB collections. If MongoDB is absent or offline during local development, the API falls back to gitignored JSON files under `.data/` so the demo stays usable.

## Documentation

- [Project Brief](docs/project-brief.md)
- [Architecture Decision Record](docs/architecture-decision-record.md)
- [Flow Overview](docs/flow-overview.md)
- [API Contract](docs/api-contract.md)
- [Database Schema](docs/database-schema.md)
- [Design Direction](docs/DESIGN.md)
- [Docker Runtime](docs/docker-runtime.md)
