import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Checks the contract documents with Node built-ins only: valid JSON, the
// specification version, a response for every operation, and local $refs.

export type Json = null | boolean | number | string | Json[] | JsonObject;
export interface JsonObject {
  [key: string]: Json;
}

export type DocumentCheck = (document: JsonObject, name: string) => string[];

export const OPENAPI_PATH = 'contracts/openapi.json';
export const ASYNCAPI_PATH = 'contracts/asyncapi.json';
const OPENAPI_VERSION = /^3\.1\.\d+$/;
const ASYNCAPI_VERSION = /^3\.0\.\d+$/;
const DOCUMENT_VERSION = /^\d+\.\d+\.\d+$/;
const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];
const ASYNC_ACTIONS = ['send', 'receive'];
const MAX_REF_HOPS = 32;

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function parseDocument(name: string, text: string): { document?: JsonObject; problems: string[] } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return { problems: [`${name}: not valid JSON: ${errorMessage(error)}`] };
  }
  if (!isObject(parsed)) return { problems: [`${name}: the top level is not a JSON object`] };
  return { document: parsed, problems: [] };
}

function pointerToken(token: string): string | undefined {
  try {
    return decodeURIComponent(token).replaceAll('~1', '/').replaceAll('~0', '~');
  } catch {
    return undefined;
  }
}

// Resolves a local JSON pointer such as #/components/schemas/Agent; any
// other reference, including one to another file, does not resolve.
export function resolvePointer(document: JsonObject, ref: string): Json | undefined {
  if (ref === '#') return document;
  if (!ref.startsWith('#/')) return undefined;
  let current: Json | undefined = document;
  for (const token of ref.slice(2).split('/')) {
    const key = pointerToken(token);
    if (key === undefined) return undefined;
    if (Array.isArray(current) && /^\d+$/.test(key)) current = current[Number(key)];
    else if (isObject(current) && Object.hasOwn(current, key)) current = current[key];
    else return undefined;
  }
  return current;
}

function dereference(document: JsonObject, value: Json | undefined): Json | undefined {
  let current = value;
  for (let hops = 0; hops < MAX_REF_HOPS; hops += 1) {
    if (!isObject(current)) return current;
    const ref = current.$ref;
    if (typeof ref !== 'string') return current;
    current = resolvePointer(document, ref);
  }
  return current;
}

export function referenceProblems(document: JsonObject, name: string): string[] {
  const problems: string[] = [];
  const visit = (value: Json, path: string): void => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${path}/${index}`));
      return;
    }
    if (!isObject(value)) return;
    for (const [key, child] of Object.entries(value)) {
      if (key === '$ref' && (typeof child !== 'string' || resolvePointer(document, child) === undefined)) {
        problems.push(`${name}: ${path}: unresolved $ref ${JSON.stringify(child)}`);
      }
      visit(child, `${path}/${key}`);
    }
  };
  visit(document, '#');
  return problems;
}

function stringField(object: Json | undefined, key: string): string | undefined {
  if (!isObject(object)) return undefined;
  const value = object[key];
  return typeof value === 'string' ? value : undefined;
}

function versionProblems(document: JsonObject, name: string, field: string, expected: RegExp, label: string): string[] {
  const problems: string[] = [];
  const declared = stringField(document, field);
  if (declared === undefined || !expected.test(declared)) {
    problems.push(`${name}: ${field} is ${JSON.stringify(document[field] ?? null)}, expected ${label}`);
  }
  const documentVersion = stringField(document.info, 'version');
  if (documentVersion === undefined || !DOCUMENT_VERSION.test(documentVersion)) {
    problems.push(`${name}: info.version must be a MAJOR.MINOR.PATCH document version`);
  }
  return problems;
}

function responseProblems(document: JsonObject, name: string, label: string, operation: JsonObject): string[] {
  const responses = dereference(document, operation.responses);
  if (!isObject(responses) || Object.keys(responses).length === 0) {
    return [`${name}: operation ${label} has no response definition`];
  }
  return Object.entries(responses).flatMap(([status, response]) => {
    const description = stringField(dereference(document, response), 'description');
    return description ? [] : [`${name}: operation ${label} response ${status} has no description`];
  });
}

function operationIdProblem(name: string, label: string, operation: JsonObject, seen: Set<string>): string[] {
  const id = stringField(operation, 'operationId');
  if (!id) return [`${name}: operation ${label} has no operationId`];
  if (seen.has(id)) return [`${name}: operationId ${id} is not unique`];
  seen.add(id);
  return [];
}

export function openApiProblems(document: JsonObject, name: string): string[] {
  const problems = versionProblems(document, name, 'openapi', OPENAPI_VERSION, '3.1.x');
  const paths = document.paths;
  const operationIds = new Set<string>();
  if (!isObject(paths) || Object.keys(paths).length === 0) problems.push(`${name}: paths defines no operation`);
  for (const [path, entry] of Object.entries(isObject(paths) ? paths : {})) {
    const item = dereference(document, entry);
    if (!isObject(item)) {
      problems.push(`${name}: path ${path} is not an object`);
      continue;
    }
    for (const method of HTTP_METHODS) {
      if (!Object.hasOwn(item, method)) continue;
      const operation = item[method];
      const label = `${method.toUpperCase()} ${path}`;
      if (!isObject(operation)) {
        problems.push(`${name}: operation ${label} is not an object`);
        continue;
      }
      problems.push(...operationIdProblem(name, label, operation, operationIds));
      problems.push(...responseProblems(document, name, label, operation));
    }
  }
  return [...problems, ...referenceProblems(document, name)];
}

// Checks a non-empty message list whose every message defines a payload.
function messageListProblems(document: JsonObject, label: string, messages: Json | undefined): string[] {
  if (!Array.isArray(messages) || messages.length === 0) return [`${label} declares no message`];
  return messages.flatMap((message, index) => {
    const target = dereference(document, message);
    return isObject(target) && target.payload !== undefined ? [] : [`${label} message ${index} has no payload`];
  });
}

// A send operation's pushed messages are its response; a receive operation
// must also declare a reply, which is its response definition.
function asyncOperationProblems(document: JsonObject, name: string, id: string, operation: JsonObject): string[] {
  const problems: string[] = [];
  const label = `${name}: operation ${id}`;
  const action = stringField(operation, 'action');
  if (action === undefined || !ASYNC_ACTIONS.includes(action)) problems.push(`${label} action must be send or receive`);
  if (!isObject(dereference(document, operation.channel))) problems.push(`${label} has no channel`);
  problems.push(...messageListProblems(document, label, operation.messages));
  if (action === 'receive') {
    const reply = dereference(document, operation.reply);
    if (isObject(reply)) problems.push(...messageListProblems(document, `${label} reply`, reply.messages));
    else problems.push(`${label} is a receive operation without a reply`);
  }
  return problems;
}

export function asyncApiProblems(document: JsonObject, name: string): string[] {
  const problems = versionProblems(document, name, 'asyncapi', ASYNCAPI_VERSION, '3.0.x');
  const operations = document.operations;
  if (!isObject(operations) || Object.keys(operations).length === 0) {
    problems.push(`${name}: operations defines no operation`);
  }
  for (const [id, entry] of Object.entries(isObject(operations) ? operations : {})) {
    const operation = dereference(document, entry);
    if (isObject(operation)) problems.push(...asyncOperationProblems(document, name, id, operation));
    else problems.push(`${name}: operation ${id} is not an object`);
  }
  return [...problems, ...referenceProblems(document, name)];
}

export function checkText(name: string, text: string, check: DocumentCheck): string[] {
  const { document, problems } = parseDocument(name, text);
  return document ? check(document, name) : problems;
}

const VALID_OPENAPI: JsonObject = {
  openapi: '3.1.0',
  info: { title: 'fixture', version: '0.1.0' },
  paths: { '/x': { get: { operationId: 'getX', responses: { '200': { description: 'ok' } } } } },
};

const FIXTURE_CHANNEL: JsonObject = {
  address: '/c',
  messages: { m: { name: 'm', payload: { type: 'object' } }, r: { name: 'r', payload: { type: 'object' } } },
};

const VALID_ASYNCAPI: JsonObject = {
  asyncapi: '3.0.0',
  info: { title: 'fixture', version: '0.1.0' },
  channels: { c: FIXTURE_CHANNEL },
  operations: {
    sendM: { action: 'send', channel: { $ref: '#/channels/c' }, messages: [{ $ref: '#/channels/c/messages/m' }] },
    receiveM: {
      action: 'receive',
      channel: { $ref: '#/channels/c' },
      messages: [{ $ref: '#/channels/c/messages/m' }],
      reply: { channel: { $ref: '#/channels/c' }, messages: [{ $ref: '#/channels/c/messages/r' }] },
    },
  },
};

interface Fixture {
  readonly label: string;
  readonly check: DocumentCheck;
  readonly text: string;
  readonly fails: boolean;
}

function asyncFixture(operations: JsonObject): string {
  return JSON.stringify({ ...VALID_ASYNCAPI, operations });
}

const FIXTURES: readonly Fixture[] = [
  { label: 'a valid OpenAPI document', check: openApiProblems, text: JSON.stringify(VALID_OPENAPI), fails: false },
  { label: 'a valid AsyncAPI document', check: asyncApiProblems, text: JSON.stringify(VALID_ASYNCAPI), fails: false },
  { label: 'invalid OpenAPI JSON', check: openApiProblems, text: '{"openapi": "3.1.0",', fails: true },
  { label: 'invalid AsyncAPI JSON', check: asyncApiProblems, text: '{"asyncapi": "3.0.0"', fails: true },
  { label: 'OpenAPI 3.0', check: openApiProblems, text: JSON.stringify({ ...VALID_OPENAPI, openapi: '3.0.3' }), fails: true },
  { label: 'AsyncAPI 2.6', check: asyncApiProblems, text: JSON.stringify({ ...VALID_ASYNCAPI, asyncapi: '2.6.0' }), fails: true },
  {
    label: 'an OpenAPI operation without responses',
    check: openApiProblems,
    text: JSON.stringify({ ...VALID_OPENAPI, paths: { '/x': { get: { operationId: 'getX' } } } }),
    fails: true,
  },
  {
    label: 'an OpenAPI operation with empty responses',
    check: openApiProblems,
    text: JSON.stringify({ ...VALID_OPENAPI, paths: { '/x': { get: { operationId: 'getX', responses: {} } } } }),
    fails: true,
  },
  {
    label: 'an AsyncAPI operation without messages',
    check: asyncApiProblems,
    text: asyncFixture({ sendM: { action: 'send', channel: { $ref: '#/channels/c' } } }),
    fails: true,
  },
  {
    label: 'an AsyncAPI receive operation without a reply',
    check: asyncApiProblems,
    text: asyncFixture({
      receiveM: { action: 'receive', channel: { $ref: '#/channels/c' }, messages: [{ $ref: '#/channels/c/messages/m' }] },
    }),
    fails: true,
  },
  {
    label: 'an unresolved $ref',
    check: openApiProblems,
    text: JSON.stringify({
      ...VALID_OPENAPI,
      paths: { '/x': { get: { operationId: 'getX', responses: { '200': { $ref: '#/components/responses/Missing' } } } } },
    }),
    fails: true,
  },
];

// Proves on fixtures that the check rejects each defect it promises to catch
// and accepts valid documents, before it checks the real contracts.
export function selfTestProblems(): string[] {
  return FIXTURES.flatMap(({ label, check, text, fails }) => {
    const found = checkText(`fixture (${label})`, text, check).length > 0;
    if (found === fails) return [];
    return [`self-test: ${label} was ${found ? 'rejected' : 'accepted'}`];
  });
}

function checkFile(path: string, check: DocumentCheck): string[] {
  let text: string;
  try {
    text = readFileSync(path, 'utf8');
  } catch (error) {
    return [`${path}: cannot be read: ${errorMessage(error)}`];
  }
  return checkText(path, text, check);
}

function main(): number {
  const problems = [
    ...selfTestProblems(),
    ...checkFile(OPENAPI_PATH, openApiProblems),
    ...checkFile(ASYNCAPI_PATH, asyncApiProblems),
  ];
  for (const problem of problems) console.error(`contract check: ${problem}`);
  if (problems.length > 0) return 1;
  console.log(`The contracts are valid: ${OPENAPI_PATH} and ${ASYNCAPI_PATH}.`);
  return 0;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main();
