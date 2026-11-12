## Purpose

Declare in the HTTP contract every error response that the identity read
operations return, so that the service never serves an undeclared status.

## ADDED Requirements

### Requirement: listAgents declares invalid input

The `listAgents` operation in `contracts/openapi.json` SHALL declare a `400`
response that references the `BadRequest` component.

#### Scenario: An invalid page token is rejected

- **WHEN** a caller sends `listAgents` with a page token the service cannot read
- **THEN** the declared response is `400` with an `application/problem+json`
  body

### Requirement: getOwnAgent declares a revoked caller

The `getOwnAgent` operation in `contracts/openapi.json` SHALL declare a `403`
response that references the `Forbidden` component.

#### Scenario: A revoked agent reads itself

- **WHEN** an agent whose chat access was revoked calls `getOwnAgent`
- **THEN** the declared response is `403` with the `access-revoked` problem type
