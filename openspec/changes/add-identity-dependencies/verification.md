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

The three scratch checks ran on 2026-11-10 in an empty project outside the
repository, set up with `npm i --ignore-scripts --save-exact typescript@5.9.3
openapi-typescript@7.13.0 ajv@8.20.0 ajv-formats@3.0.1
@apidevtools/swagger-parser@13.1.0 hono@4.13.17 @hono/node-server@2.1.6`.
`CONTRACT` stands for the path of `contracts/openapi.json` at the base revision.

- Generated types, with `npx --no-install openapi-typescript CONTRACT -o api.d.ts`
  (2197 lines) and `npx --no-install tsc --noEmit --strict --target es2022
  --module nodenext --moduleResolution nodenext --skipLibCheck api.d.ts`, which
  printed no error.
- Schema compilation, with a Node.js script:
  `new Ajv2020({ strict: false, allErrors: true })` from `ajv/dist/2020.js`, then
  `addFormats(ajv)`, `ajv.addSchema({ $id: 'c', components: doc.components })`, and
  `ajv.compile({ $ref: 'c#/components/schemas/' + name })` for each schema. It
  compiled 51 schemas. With `strict: true` the script stopped at
  `strict mode: unknown keyword: "components"`, caused by its wrapper schema.
- Contract validity, with `SwaggerParser.validate(doc)`, which passed.
- Server-sent events, with a Node.js script: `serve({ fetch: app.fetch, port: 0 })`
  for a Hono route returning `streamSSE`, one `writeSSE({ data: 'x', id: '1' })`,
  and one `fetch`. It returned status 200, the content type `text/event-stream`,
  and the body `data: x\nid: 1\n\n`.

Repository checks:

- `npm audit --omit=dev` found 0 vulnerabilities. Full `npm audit` reports 37
  findings, 36 moderate and 1 high, the same counts as the base revision.
- A clean `npm ci --ignore-scripts` from the updated lockfile resolved every
  approved package to its exact version.
- `npm run verify:dependencies` passed: 15 direct dependencies.
- `make verify` passed, including strict OpenSpec validation and the archive dry
  run.

## Review

The owner chose independent review by the first reviewer in the rotation.

Pass 1, on revision `31a24c791a760028c015045b29686de8aee3d5af`:

- Reviewer: Codex CLI 0.167.0, invoked as `codex exec -m gpt-6.1-sol
  -c model_reasoning_effort='"medium"' -s read-only -C <worktree> - < <prompt-file>`.
- Confirmation from the output header: model `gpt-6.1-sol`, reasoning effort
  `medium`, sandbox `read-only`.
- Session ID: `01a1c648-7ecc-7fb2-9d1e-c32f1da7ade3`.
- Time: 2026-11-10, 16:26:41Z to 16:28:03Z.
- Snapshot of tracked and untracked files before and after the pass: identical.
- Reviewer limits: it had no network access, so the registry and audit statements
  are not independently confirmed, and it did not run `make verify`.
- Findings: Critical 0, High 0, Medium 0, Low 1.
- Low: this record described the scratch checks without their exact commands.
  Resolution: the commands and results above were added.

As the review process requires for a pass with only Low findings, the fix is an
unreviewed fix and the reviewer was not called again. No other file changed after
the pass.

## Limitations and remaining gates

- No product code exercises the packages in this repository yet.
- Backpressure of the Hono stream for a slow client is unverified.
- The clone has no `pre-push` hook enabled, so `make verify` was run by hand
  before the push.
- Owner acceptance and integration into `dev`, then archive.
