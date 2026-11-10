# Verification: add-identity-dependencies

## Scope and source

On 2026-11-10 the owner approved, in Bulgarian and paraphrased here, the package
list for AC-03 and asked for this change. Base revision:
`ec779f422ab734099c498569bef2c1b2da13445e`.

## Environment

Linux, Node.js 24.22.1, npm 12.2.1. Dependencies were installed with
`npm ci --ignore-scripts`.

## Author self-check before review

- Versions, declared licenses, and the presence of a license file were read from
  the npm registry and the installed packages on 2026-11-10.
- Transitive licenses are not part of the register's scope.
- No external link is used, so the evidence check has nothing to pin.

## Checks

- In a scratch project, `openapi-typescript` 7.13.0 generated types from
  `contracts/openapi.json` that compiled under strict TypeScript 5.9.3.
- In a scratch project, the 2020-12 build of `ajv` 8.20.0 with `ajv-formats` 3.0.1
  compiled all 51 contract schemas with `strict: false`.
- In a scratch project, `hono` 4.13.17 with `@hono/node-server` 2.1.6 served a
  server-sent events response with the content type `text/event-stream`.
- `npm audit --omit=dev` found 0 vulnerabilities. Full `npm audit` reports 37
  findings, 36 moderate and 1 high, the same counts as the base revision.
- A clean `npm ci --ignore-scripts` from the updated lockfile resolved every
  approved package to its exact version.
- `npm run verify:dependencies` passed: 15 direct dependencies.
- `make verify` passed, including strict OpenSpec validation and the archive dry
  run.

## Review

Independent review: not performed. The owner's documented exceptions cover runner
outcomes and `adopt-outcome-runner-queue`, and do not cover this change.

## Limitations and remaining gates

- No product code exercises the packages in this repository yet.
- Backpressure of the Hono stream for a slow client is unverified.
- The clone has no `pre-push` hook enabled, so `make verify` was run by hand
  before the push.
- Independent review or a documented owner exception.
- Owner acceptance and integration into `dev`, then archive.
