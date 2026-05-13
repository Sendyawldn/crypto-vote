# Project Brief

## Confirmed Facts

CryptoVote is an e-voting web application. The user requested Next.js 15 as the main framework, Tailwind CSS v4 for styling, shadcn/ui components, and Recharts for live voting results.

The product context names El Gamal homomorphic encryption as the core security idea. The first delivery must make that flow visible without claiming certified production cryptography.

## Goals

1. Let a voter review candidates and submit one encrypted ballot.
2. Show a live result panel with totals, turnout, and charted candidate support.
3. Expose a small documented API surface for health and election results.
4. Keep the architecture ready for real authentication, persistence, key custody, and cryptographic verification.

## Non-Goals For This Slice

This slice does not provide production voter identity proofing, certified key ceremonies, permanent ballot storage, or a real El Gamal implementation. Those belong behind reviewed cryptographic libraries, audited protocols, and server-side trust boundaries.

## Runtime Evidence

- Next.js App Router uses file-system routing and React Server Components. Source: https://nextjs.org/docs/app, fetched 2026-05-13.
- Tailwind CSS v4 uses CSS-first setup with `@import "tailwindcss"` and the `@tailwindcss/postcss` plugin. Source: https://tailwindcss.com/blog/tailwindcss-v4, fetched 2026-05-13.
- shadcn/ui documents Tailwind v4 and React 19 support for new projects. Source: https://v3.shadcn.com/docs/tailwind-v4, fetched 2026-05-13.
- Recharts is a React charting library installed from npm and composed from chart primitives. Source: https://recharts.github.io/en-US/guide/, fetched 2026-05-13.

## Assumptions To Validate

- The first user group can use a browser-only prototype while the cryptographic backend is designed.
- One deployable app is enough until identity, audit storage, and election authority operations prove separate scaling or ownership needs.
- Docker is useful for repeatable local and production-style runs, but production hosting is not selected yet.

## Next Validation Action

Run the application with sample election data, then decide which backend trust boundary should be built first: identity, ballot storage, key management, or public audit verification.

