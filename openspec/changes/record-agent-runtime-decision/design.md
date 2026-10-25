## Context

The research compared TypeScript-native agent frameworks, Python frameworks and
the cost of a sidecar, the thin-SDK path, and framework behavior under
determinism, audit, and revocation. The product's three hard requirements are a
400 ms schema-constrained routing call, an auditable vote record, and immediate
revocation at the service edge.

## Decisions

- **The port, not the framework, is the boundary.** `ModelPort` exposes one
  structured call with a timeout and a validated result. Everything above it —
  routing policy, consensus, audit, revocation — is application code and stays
  testable without a live model.
- **The AI SDK, not a raw HTTP client, for the first adapter.** It keeps
  `strictJsonSchema` explicit, ships a mock model for tests, and is a thin layer
  over the provider SDK. If a benchmark shows its overhead is material, the
  adapter drops to the `openai` client without touching the port.
- **PostgreSQL owns the state machine.** A unique constraint on
  `(deliberation_id, round, agent_id)` makes a duplicate vote a database error
  rather than a silent second vote, and the epoch column is what makes revocation
  effective on the next request.
- **Versions are recorded, not installed.** The research observed `ai` 7.0.153,
  `@ai-sdk/openai-compatible` 3.0.78, and `zod` on 2026-10-25. Installing them
  without a register entry would fail `make verify`, and installing them before
  the routing change would add dependencies with no consumer.
- **The research artifacts stay out of the repository.** The notes and the report
  are Bulgarian and owner-facing; repository content is English. ADR 0003
  repeats the load-bearing evidence links.

## Risks

- The evidence for framework behavior comes partly from Python documentation;
  parity of the TypeScript ports was not verified beyond the packages existing.
- No vendor publishes per-call overhead or p95 for schema-constrained routing, so
  the latency argument is arithmetic and structural, not measured.
- The AI SDK's abstraction could cost latency that only a benchmark reveals; the
  port limits the cost of being wrong to one adapter.
