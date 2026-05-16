# Database Schema

## Current State

CryptoVote starts from an empty typed seed state. Admins configure election identity and candidates before voting opens. The app can persist admin election state through the official MongoDB Node.js driver when `MONGODB_URI` is configured. If MongoDB is not configured, `/api/admin/election` falls back to in-memory state so the presentation demo still works offline. MongoDB driver setup source: https://www.mongodb.com/docs/drivers/node/current/, fetched 2026-05-13.

## Future Data Model

The production schema is expected to include:

- `elections`: election configuration, lifecycle status, opening and closing times.
- `candidates`: candidate records scoped to one election.
- `voters`: eligible voter references, email or ID, and `hasVoted` status.
- `admins`: demo admin account list for route and panel authorization.
- `ballots`: encrypted ballot payloads and duplicate-submit guards.
- `tally_proofs`: homomorphic tally proof artifacts and verification state.
- `audit_events`: append-only operational and election events.

## Security Requirements

Production storage must separate voter eligibility from ballot content. Ballot records must not store plaintext votes. Audit logs must avoid secrets and private keys. The private El Gamal key must stay unavailable to normal voter flows and only be used by the authorized admin/key ceremony process at election close.

## Next Validation Action

Configure `MONGODB_URI`, replace demo header authorization with real sessions, and define retention rules for voter, ballot, and audit collections.
