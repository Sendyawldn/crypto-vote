# Flow Overview

## Main Voter Flow

1. The voter opens the election workspace.
2. The app shows election status, turnout, candidate options, and encryption readiness.
3. The voter selects one candidate.
4. The app records a ballot intent and displays an encrypted ballot receipt model.
5. The result panel updates the live tally view.

## Result Flow

1. The result route returns the current public election state.
2. The UI maps candidate totals into chart-ready rows.
3. Recharts renders a responsive bar chart and turnout trend.
4. The UI announces updates through visible state text and stable labels.

## Verification Flow

1. The interface shows a proof status for the homomorphic tally.
2. The current slice marks the proof as a modeled state.
3. A production backend must replace this with cryptographic proofs generated from encrypted ballots.

## Failure And Empty States

- No selected candidate: the cast button stays disabled.
- Vote already cast: the UI keeps the receipt visible and prevents duplicate local submit.
- API unavailable: future fetch-backed panels must preserve the last known safe result and show a retry state.

## Next Validation Action

Connect the result panel to the documented API route, then decide whether the next live behavior should be polling, server-sent events, or WebSockets.

