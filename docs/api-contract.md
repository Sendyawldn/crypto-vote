# API Contract

## Overview

CryptoVote exposes a small API surface for health checks, public election results, and admin election configuration. All responses are JSON. The `/admin` page uses a demo client-side login for presentation, while admin API mutations require the demo `x-cryptovote-admin: true` header until real authentication is added.

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
  "verificationStatus": "demo-elgamal",
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

## `GET /api/admin/election`

Returns the current admin election state and the active persistence adapter.

### Response `200`

```json
{
  "persistence": "mongodb",
  "election": {
    "id": "campus-2026",
    "status": "draft",
    "authorizedVoters": [
      {
        "id": "VTR-001",
        "email": "andi@kampus.test",
        "hasVoted": false
      }
    ],
    "admins": [
      {
        "id": "ADM-001",
        "email": "admin@kampus.test",
        "role": "admin"
      }
    ]
  }
}
```

## `PUT /api/admin/election`

Saves election title, candidate list, authorized voter list, admin list, and election status. Uses MongoDB when `MONGODB_URI` is configured and local `.data/election-state.json` fallback otherwise.

### Headers

- `x-cryptovote-admin: true`

The current UI route for these controls is `/admin`. Demo credential: `admin@kampus.test` / `admin123`.

## `POST /api/admin/election`

Archives the provided closed or active election into session history, then resets the active election to the empty draft seed.

### Headers

- `x-cryptovote-admin: true`

## `POST /api/elections/{electionId}/results`

Records one vote for an authorized DPT entry. The route rejects votes when the election is not open, the identifier is not in DPT, the identifier has already voted, or the candidate does not exist.

### Request

```json
{
  "voterIdentifier": "A11.2024.00123",
  "candidateId": "candidate-a"
}
```

### Response `200`

```json
{
  "election": {
    "id": "campus-2026",
    "ballotsCast": 1
  },
  "persistence": "local-file"
}
```

### Response `403`

```json
{
  "type": "https://cryptovote.local/problems/forbidden",
  "title": "Admin authorization required",
  "status": 403,
  "code": "ADMIN_REQUIRED"
}
```

## Next Validation Action

Replace the demo admin header with real authenticated sessions and publish an OpenAPI 3.1 document when ballot mutation routes are introduced.
