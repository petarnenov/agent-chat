## 1. Contracts

- [x] 1.1 Write `contracts/openapi.json` (OpenAPI 3.1.0) for identity, sessions, rooms, memberships, deliberation, messages, stream, audit, and revocation.
- [x] 1.2 Write `contracts/asyncapi.json` (AsyncAPI 3.0.0) for the server-sent event stream, durable cursor, and catch-up.
- [x] 1.3 Encode the D2 revocation bound scoped to the revoked room or the whole chat, worded exactly as in `design.md`, the accepted-message rule of invariant 4, and the authorization epoch.
- [x] 1.4 Describe the D2 to D7 and D9 assumptions, each marked as an assumption.
- [x] 1.5 Encode the D8 consensus protocol, including that a round invalidated by a revocation consumes a round and that no deliberation holds more than three voting rounds.

## 2. Domain model

- [x] 2.1 Write `docs/domain/model.md` with the six modules, their state transitions, and the nine invariants.
- [x] 2.2 Link the contracts and the domain model from `docs/architecture.md`.

## 3. Contract check

- [x] 3.1 Add `scripts/check-contracts.ts` using Node built-ins only.
- [x] 3.2 Add the `verify:contracts` script to `package.json` without dependency changes.
- [x] 3.3 Run `npm run verify:contracts` from `make verify`.

## 4. Verification

- [x] 4.1 Run the frozen project checks, including `make verify`.
- [x] 4.2 Write `verification.md` with the exact commands and results, claiming no independent review, CI run, or deployment validation.
