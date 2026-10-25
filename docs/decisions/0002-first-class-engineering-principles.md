# ADR 0002: First-class engineering principles

Date: 2026-10-25
Status: Decided by the owner on 2026-10-25 by adopting the Taskelith workflow
([ADR 0001](0001-adopt-the-taskelith-workflow.md)). Recorded; no product code
exists yet.

## Context

The workflow this project adopts requires that design and review be checked
against named principles, so that "good code" is not left to taste. Taskelith
declares nine; one of them, the microkernel, has no surface here.

## Decisions

Every design, code change, test, and review is checked against these eight
principles. A change that cannot meet one records the conflict and asks the
owner, rather than silently exempting itself.

1. **Clean Code.** Code and tests are written for local reasoning: precise names,
   small single-purpose functions, explicit mutation, isolated error handling,
   and comments only for rationale or contracts.
2. **SOLID.** Modules have one reason to change. Every adapter of a port passes
   that port's shared conformance suite, so adapters are substitutable. Ports
   stay small and specific to their clients. Application code depends on ports,
   never on adapters.
3. **Hexagonal architecture.** The domain core and application modules depend
   only on ports. Adapters, framework, persistence, transport, and vendor
   details stay outside them, and the composition roots wire them.
4. **Docker.** Every runnable component and its infrastructure ships as an OCI
   image pinned by digest. Docker Compose is the development and
   small-installation path. This principle starts with the first runnable
   component.
5. **Contract-first OpenAPI.** Every HTTP API is described by a versioned
   OpenAPI 3.1 document, written and reviewed before implementation. Types,
   runtime validation, and clients are generated from it. Messages follow the
   same rule with AsyncAPI documents.
6. **Makefile.** Every operation is run and managed through `make` targets:
   setup, test, checks, dependency register, OpenSpec validation, and container
   operations. CI calls the same targets.
7. **Mandatory OpenSpec.** Every task that develops this project goes through an
   OpenSpec change, without exception: features, fixes, documentation, tests,
   maintenance, dependencies, infrastructure, and emergencies.
8. **Code coverage of at least 75%.** Automated tests cover at least 75% of
   lines, branches, and functions. `make verify` enforces the thresholds over
   the compiled product code in `dist/` alone, so that well-tested repository
   scripts cannot mask low product coverage, and it fails when a module under
   `src/` is missing from the coverage report, because the built-in coverage
   counts only modules that tests load.

## Consequences

- Review uses these principles as criteria, not as a style preference.
- Two principles are not yet enforceable and are recorded as such: Docker needs
  a runnable component, and OpenAPI needs the first contract. The change that
  creates either adds its gate.
- Coverage thresholds apply from the first product module; the scaffold module
  and its test exist so that the gate is exercised rather than assumed.
