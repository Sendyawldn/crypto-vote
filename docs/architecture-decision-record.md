# Architecture Decision Record

## Decision

Build CryptoVote as a Next.js 15 monolith using the App Router, TypeScript, Tailwind CSS v4, local shadcn/ui-style components, and Recharts. Keep domain logic in feature modules under `src/features/voting` and expose API routes only for public contract surfaces.

## Rationale

A monolith is the smallest clear shape for this stage. The app needs fast UI iteration, typed local domain logic, and a documented path toward secure server boundaries. A service split would add operational cost before there is evidence of separate ownership, scaling, or fault isolation needs.

Next.js 15 matches the user constraint and gives one deployable for pages, route handlers, and build output. Tailwind CSS v4 keeps styling close to the design tokens. shadcn/ui-style local components give accessible primitives without making the visual language depend on a component-kit default. Recharts handles chart rendering so the product logic can stay focused on voting state.

## Current Structure

- `src/app`: App Router pages, layout, styles, and API route handlers.
- `src/features/voting`: election data, domain calculations, UI composition, and tests.
- `src/components/ui`: local reusable UI primitives.
- `src/lib`: shared helpers.
- `docs`: project contracts and design direction.

## Security Boundary

The current app treats voter input as untrusted at the UI and API boundary, but it does not yet enforce production authentication or durable authorization. El Gamal math is implemented with native JavaScript BigInt for demo encryption and homomorphic aggregation. Production work must move key custody, tally proof generation, parameter review, and audit trails to reviewed server-side services or maintained cryptographic libraries.

The demo private exponent is fixed to make the local demo reproducible. It must not be copied into production. Production key material must come from a documented key ceremony with safe custody, access control, and audit records.

## Realtime Decision

Use client-side timed refresh for the first live result experience. It is enough for a single-page result panel and avoids WebSocket infrastructure until low-latency collaboration, high-frequency updates, or multi-operator monitoring requires it.

## Data Decision

Use in-memory fixture data for this slice. Do not add a database until the project chooses voter identity, election lifecycle, ballot retention, audit log, and cryptographic proof requirements.

## Docker Decision

Provide separate development and production Compose lanes. Docker official guidance recommends the Compose Specification and multi-stage builds for smaller final images. Sources: https://docs.docker.com/reference/compose-file/ and https://docs.docker.com/build/building/best-practices/, fetched 2026-05-13.

## Assumptions To Validate

- Production will need a database, append-only audit storage, and key ceremony workflows.
- Authentication will likely need institution-managed identity or one-time voter credentials.
- A future realtime transport can start with polling or server-sent events before WebSockets.

## Next Validation Action

Review the first UI and API contracts with election operators, then prioritize the first trusted backend module.
