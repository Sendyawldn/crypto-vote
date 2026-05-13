# Flow Overview

## Main Voter Flow

1. The voter opens the election workspace.
2. The voter enters a name only. No account or email is required.
3. The app shows election status, turnout, candidate options, and encryption readiness.
4. The voter selects one candidate while the election status is `open`.
5. The app encrypts a candidate vector with El Gamal and displays an encrypted receipt token.
6. The vote is counted locally and the receipt can be verified without revealing the selected candidate.

## Admin Flow

1. The admin opens `/admin`.
2. The admin logs in with the demo admin credential.
2. The admin manages election title, candidates, and authorized voters while the election is in draft.
3. The admin opens the election with `Mulai Pemilihan`.
4. The admin can monitor voter names, but not their candidate choices.
5. The admin closes the election with `Selesaikan Pemilihan`.
6. The admin decrypts the aggregate tally after the election is closed.

## Result Flow

1. The result route returns the current public election state.
2. The UI maps candidate totals into chart-ready rows.
3. Recharts renders a responsive bar chart and turnout trend.
4. The UI announces updates through visible state text and stable labels.

## Verification Flow

1. The interface shows a receipt token created from El Gamal ciphertexts.
2. The voter can paste the token into the verification panel.
3. The verifier checks that the token hash exists in the local tally ledger without revealing the selected candidate.
4. A production backend must move ledger storage, key custody, and public proofs to trusted server infrastructure.

## Key Ceremony Note

The demo uses fixed key material only for repeatable presentation. Vote encryption still uses random nonce values. Production must replace this with a formal key ceremony and protected private-key custody.

## Failure And Empty States

- No selected candidate: the cast button stays disabled.
- Vote already cast: the UI keeps the receipt visible and prevents duplicate local submit.
- API unavailable: future fetch-backed panels must preserve the last known safe result and show a retry state.

## Next Validation Action

Connect the result panel to the documented API route, then decide whether the next live behavior should be polling, server-sent events, or WebSockets.
