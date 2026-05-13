# Flow Overview

## Main Voter Flow

1. The voter opens the election workspace.
2. The app shows election status, turnout, candidate options, and encryption readiness.
3. The voter selects one candidate.
4. The app encrypts a candidate vector with El Gamal and displays an encrypted receipt token.
5. The result panel updates the live tally view.

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
