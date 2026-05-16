# Database Schema

## Current State

CryptoVote starts from an empty typed seed state. Admins configure election identity and candidates before voting opens. The app can persist admin election state, session history, and encrypted vote ledger entries through the official MongoDB Node.js driver when `MONGODB_URI` is configured. If MongoDB is not configured, `/api/admin/election` and vote ledger writes fall back to local gitignored JSON files under `.data/` so the presentation demo still works offline and survives browser refreshes or route recompilation. MongoDB driver docs describe `insertOne()` for inserting documents and `find()` for retrieving documents with filters and cursor methods; sources fetched 2026-05-16: https://www.mongodb.com/docs/drivers/node/v6.15/usage-examples/insertOne/ and https://www.mongodb.com/docs/drivers/node/current/crud/query/retrieve/.

## Current Collections

- `elections`: one active election document keyed by the seed election id.
- `election_history`: archived sessions after admin saves state.
- `vote_ledger`: encrypted receipt documents keyed by `{electionId}:{receiptHash}`. Each record stores the receipt hash, token, ciphertext vector, voter identifier used for duplicate prevention, and timestamps. It does not need plaintext candidate choice for aggregation.

## Future Data Model

The production schema is expected to include:

- `elections`: election configuration, lifecycle status, opening and closing times.
- `candidates`: candidate records scoped to one election.
- `voters`: eligible voter references, email or ID, and `hasVoted` status.
- `admins`: demo admin account list for route and panel authorization.
- `ballots` or `vote_ledger`: encrypted ballot payloads and duplicate-submit guards.
- `tally_proofs`: homomorphic tally proof artifacts and verification state.
- `audit_events`: append-only operational and election events.

## Security Requirements

Production storage must separate voter eligibility from ballot content. Ballot records must not store plaintext votes. Audit logs must avoid secrets and private keys. The private El Gamal key must stay unavailable to normal voter flows and only be used by the authorized admin/key ceremony process at election close.

## Next Validation Action

Replace demo header authorization with real sessions, add transaction or compensating recovery around election and ledger writes, and define retention rules for voter, ballot, and audit collections.
