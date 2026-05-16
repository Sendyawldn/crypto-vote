# Flow Overview

## Main Voter Flow

1. The voter opens the election workspace.
2. The voter enters Email, ID, or NIM.
3. The voter presses `Cek DPT`.
4. The ballot opens only when the identifier exists in the admin DPT and has not voted.
5. The app shows election status, turnout, candidate options, and encryption readiness after admin configuration exists.
6. The voter selects one candidate while the election status is `open`.
7. The app fetches the public El Gamal key, encrypts a candidate vector, and displays an encrypted receipt token.
8. The vote endpoint stores the encrypted receipt in the ledger and marks the DPT entry as already voted.
9. The voter can copy the token or download a TXT receipt for later verification.
10. Another voter can use the same device by replacing the identifier and pressing `Cek DPT` again.

## Admin Flow

1. The admin opens `/admin`.
2. The admin logs in with the demo admin credential.
3. The admin fills election title, description, region, and candidate list from an empty initial state.
4. The admin adds Email, ID, or NIM entries to the DPT while the election is in draft.
5. The admin opens the election with `Mulai Pemilihan`.
6. Opening the election saves it as the active session read by the public voter page.
7. After opening, candidates and DPT entries are locked.
8. The admin can monitor which DPT entries have voted, but not their candidate choices.
9. The admin closes the election with `Tutup Pemilihan`.
10. The admin decrypts the aggregate tally only after the election is closed.
11. The admin panel shows aggregation log text while the server reads ledger entries, multiplies ciphertexts, and decrypts the aggregate result.
12. The admin saves the closed state, which archives the session into history and resets the active election to an empty draft.

## Result Flow

1. The result route returns the current public election state.
2. The UI maps candidate totals into chart-ready rows.
3. Recharts renders a responsive bar chart and turnout trend.
4. The UI announces updates through visible state text and stable labels.

## Verification Flow

1. The interface shows a receipt token created from El Gamal ciphertexts.
2. The voter can paste the token into the verification panel.
3. The verifier checks that the token hash exists in the server-backed ledger without revealing the selected candidate.
4. A production backend must add stronger public proofs, real authentication, and audited key custody before certification.

## Key Ceremony Note

The demo uses `ELECTION_PRIVATE_KEY` when configured and falls back to fixed key material only for repeatable local presentation. Vote encryption still uses random nonce values. Production must replace demo fallback behavior with a formal key ceremony and protected private-key custody.

## Failure And Empty States

- No selected candidate: the cast button stays disabled.
- Vote already cast: DPT check reports that the identifier has already voted.
- Election still open: admin aggregation and decryption stay disabled.
- API unavailable: panels preserve visible status text and show the safe rejection message returned by the route.

## Next Validation Action

Add authenticated admin sessions and a transaction or recovery plan for MongoDB election-state plus ledger writes.
