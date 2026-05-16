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

Ballot submission requires a DPT identifier, candidate id, and encrypted receipt token. Duplicate-submit protection is currently enforced by the DPT `hasVoted` flag and receipt hash uniqueness in the ledger. Production should add authenticated voter sessions and a server-side idempotency key.

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
  "candidateId": "candidate-a",
  "receipt": {
    "receiptHash": "7c14bfc028fdbdd9",
    "token": "EGV1...",
    "createdAt": "2026-05-16T06:00:00.000Z",
    "encryptedChoices": [
      {
        "candidateId": "candidate-a",
        "ciphertext": {
          "c1": "5f...",
          "c2": "a1..."
        }
      }
    ]
  }
}
```

### Response `200`

```json
{
  "election": {
    "id": "campus-2026",
    "ballotsCast": 1
  },
  "persistence": "local-file",
  "ledgerSize": 1
}
```

### Response `409`

```json
{
  "type": "https://cryptovote.local/problems/vote-rejected",
  "title": "Voter has already voted",
  "status": 409,
  "code": "VOTE_REJECTED"
}
```

## `POST /api/elections/{electionId}/verify`

Checks a receipt token against the stored encrypted ledger without revealing the selected candidate.

### Request

```json
{
  "token": "EGV1..."
}
```

### Response `200`

```json
{
  "status": "verified",
  "receiptHash": "7c14bfc028fdbdd9",
  "message": "Token valid dan ciphertext-nya sudah masuk agregasi. Pilihan tetap tidak dibuka.",
  "ledgerSize": 1
}
```

## `GET /api/admin/tally`

Runs homomorphic aggregation and decrypts the aggregate result. This endpoint requires the election to be closed.

### Headers

- `x-cryptovote-admin: true`

### Response `200`

```json
{
  "tally": {
    "candidate-a": 12,
    "candidate-b": 8
  },
  "ledgerSize": 20,
  "logs": [
    "Mengambil 20 suara terenkripsi dari ledger.",
    "Mengalikan ciphertext per kandidat dengan operasi homomorphic.",
    "Mendekripsi hasil agregat memakai private key di sisi server.",
    "Selesai. Hasil akhir siap dibaca admin."
  ]
}
```

### Response `409`

```json
{
  "type": "https://cryptovote.local/problems/election-open",
  "title": "Election must be closed before aggregation",
  "status": 409,
  "code": "ELECTION_NOT_CLOSED"
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
## `GET /api/election/public-key`

Returns the public El Gamal key used by the browser to encrypt vote vectors. The private exponent is never returned.

### Response `200`

```json
{
  "publicKey": {
    "p": "7fffffffffffffffffffffffffffffff",
    "g": "3",
    "y": "38f7af1fac5e7c24d5a1ee8f8f014006"
  }
}
```
