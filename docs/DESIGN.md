# Design Direction

## Design Intent And Product Personality

CryptoVote should feel like a controlled counting room: calm, exact, and inspectable. The interface must help voters trust each step without turning cryptography into theatrical decoration.

## Audience And Use-Context Signals

Voters need one clear action. Election operators need fast status reading. Auditors need visible proof and receipt language that does not overclaim the current implementation.

## Visual Direction And Distinctive Moves

The conceptual anchor is a tamper-evident ballot envelope under a counting-room lamp. The signature move is a seal-to-tally transition: selected ballots tighten into a compact encrypted receipt, then the result bars rebalance with a short measured motion.

## Color, Typography, Spacing, And Density Decisions

Use off-white ballot surfaces, ink text, copper accents for cryptographic material, verification green for proven states, and red only for blocking risk. Typography uses strong display text for election identity, plain body copy for instructions, tabular numerals for counts, and compact metadata for audit records.

## Token Architecture And Alias Strategy

Primitive values live in `globals.css`. Semantic aliases map to background, foreground, primary, secondary, verified, warning, muted, border, and chart roles. Components consume semantic tokens instead of hardcoded one-off colors.

## Responsive Strategy And Cross-Viewport Adaptation Matrix

Mobile shows voting first, then receipt, then results. Tablet pairs voting and proof state. Desktop exposes voting, encrypted receipt, and live result surfaces together. This is recomposition, not simple shrinking.

## Motion And Interaction Rules

Use 160-280ms transitions with steady easing. Motion must communicate selection, sealing, tally update, and verification. Respect `prefers-reduced-motion` by removing transform motion and preserving color, text, and progress feedback.

## Component Language And Morphology

Cards are squared ballot sheets with 8px radius or less. Buttons are direct commands. Badges mark status and proof state. Progress bars show turnout and verification progress. Charts use restrained axes and product-specific colors.

## Context Hygiene And Source Boundaries

Use the active brief, current docs, and official library documentation. Do not import unrelated design memory or famous product references.

## Accessibility Non-Negotiables

Meet WCAG 2.2 AA contrast, keep keyboard access, show focus rings, avoid color-only meaning, keep targets at least 44px where practical, and use text labels for dynamic voting state.

## Anti-Patterns To Avoid

Avoid generic admin dashboard chrome, decorative grid backgrounds, fake blockchain visuals, cyber terminal styling, lorem copy, and claims that the prototype provides certified cryptographic security.

## Implementation Notes For Future UI Tasks

Keep chart labels readable on mobile. Preserve the vote-first order. Add richer audit and proof views only when the backend can provide real verification artifacts.

