# API Contract

## Overview

CryptoVote exposes a small API surface for health checks and public election results. All responses are JSON. The current implementation uses fixture data and does not accept ballot mutations over HTTP.

## `GET /api/health`

Returns service health.

### Response `200`

```json
{
  "status": "ok",
  "service": "cryptovote",
  "timestamp": "2026-05-13T00:00:00.000Z"
}
```

## `GET /api/elections/{electionId}/results`

Returns public result data for one election.

### Path Parameters

- `electionId`: stable election identifier. The first fixture supports `campus-2026`.

### Response `200`

```json
{
  "electionId": "campus-2026",
  "title": "Campus Senate Election 2026",
  "totalVoters": 1280,
  "ballotsCast": 874,
  "verificationStatus": "modeled-proof",
  "candidates": [
    {
      "id": "naya",
      "name": "Naya Putri",
      "party": "Civic Ledger",
      "votes": 342
    }
  ]
}
```

### Response `404`

```json
{
  "type": "https://cryptovote.local/problems/not-found",
  "title": "Election not found",
  "status": 404,
  "code": "ELECTION_NOT_FOUND"
}
```

## Mutation Safety

Ballot submission is not exposed as an API route in this slice. A future ballot endpoint must require authentication, request validation, duplicate-submit protection, and a server-side idempotency key.

## Next Validation Action

Add an OpenAPI 3.1 document when ballot mutation routes are introduced.

