## Context

AC-03 implements the identity module with PostgreSQL and HTTP adapters and
generates types and validation from `contracts/openapi.json` (ADR 0002). The
owner decides dependency questions.

## Goals and non-goals

Goals: pin the approved packages and keep the register accurate.

Non-goals: using the packages, adding the model packages of ADR 0003, which enter
with the JEV change, and choosing a console technology.

## Decisions

| Need | Package | Reason | Rejected |
| --- | --- | --- | --- |
| PostgreSQL driver | `pg` 8.23.1 | Established; transitive licenses are MIT and ISC. | `postgres` 4.1.0: five days old at review, Unlicense, no license file. |
| HTTP | `hono` 4.13.17 and `@hono/node-server` 2.1.6 | Only routing is needed, because validation comes from the contract; three packages in total. | `express` 5.3.0: 65 packages and no bundled types. `fastify` 5.12.8: 48 packages, and its default validator targets an older JSON Schema draft than OpenAPI 3.1. |
| Runtime validation | `ajv` 8.20.0 with `ajv-formats` 3.0.1 | Its 2020-12 build matches OpenAPI 3.1, and the contract uses the formats `uuid` and `date-time`. | None evaluated. |
| Generated types | `openapi-typescript` 7.13.0 | Supports the pinned TypeScript 5. | None evaluated. |

Database migrations and API key hashing add no package: a small runner over SQL
files in `db/` uses `pg`, and hashing uses `node:crypto`. PostgreSQL tests use the
`postgres` image through Docker Compose, because AC-03 ships that image anyway.
`node-pg-migrate` 9.0.0 had three audit findings, and
`@testcontainers/postgresql` 12.2.1 brought 174 packages, seven audit findings,
and install scripts.

## Risks and trade-offs

- `hono` and `@hono/node-server` were three and eight days old at review. The
  repository has no minimum package age.
- Backpressure of the Hono server-sent events stream for a slow client is
  unverified. It matters for the realtime change, not for AC-03.
