# Database Schema

## Current State

CryptoVote does not use persistent storage in this first slice. Election data lives in typed fixtures so the UI, charting, and API contract can be validated before choosing durable storage.

## Future Data Model

The production schema is expected to include:

- `elections`: election configuration, lifecycle status, opening and closing times.
- `candidates`: candidate records scoped to one election.
- `voters`: eligible voter references, never raw private identity details unless legally required.
- `ballots`: encrypted ballot payloads and duplicate-submit guards.
- `tally_proofs`: homomorphic tally proof artifacts and verification state.
- `audit_events`: append-only operational and election events.

## Security Requirements

Production storage must separate voter eligibility from ballot content. Ballot records must not store plaintext votes. Audit logs must avoid secrets and private keys.

## Next Validation Action

Select the persistence strategy after authentication, key management, and audit retention requirements are confirmed.

