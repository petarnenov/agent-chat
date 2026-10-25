import { spawn } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { constants, tmpdir } from 'node:os';
import { basename, dirname, join, sep } from 'node:path';

// Archives every active change in a temporary copy of openspec/ and validates
// the copy strictly, so that archive failures show before handoff.

const OPENSPEC_DIRECTORY = 'openspec';
const ARCHIVE_DIRECTORY = 'archive';
// The pinned CLI of this clone, also when the check runs on another directory.
const OPENSPEC_BIN = join(import.meta.dirname, '..', 'node_modules', '.bin', 'openspec');
const INTERRUPTING_SIGNALS: readonly NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
const COMMAND_TIMEOUT_MS = 300_000;
const SPEC_FILE = 'spec.md';
// Telemetry and the update check off keep the check offline.
const OFFLINE_ENVIRONMENT = { OPENSPEC_TELEMETRY: '0', DO_NOT_TRACK: '1', OPENSPEC_NO_UPDATE_CHECK: '1' };

interface DirectoryEntry {
  readonly name: string;
  isDirectory(): boolean;
}

export function directoryNames(entries: readonly DirectoryEntry[]): string[] {
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
}

export function activeChanges(entries: readonly DirectoryEntry[]): string[] {
  return directoryNames(entries).filter((name) => name !== ARCHIVE_DIRECTORY);
}

// A capability is a directory with a spec.md under a change's specs/, nested
// ones included; its id is that directory's path, as the CLI reports it.
export function capabilityIds(relativePaths: readonly string[]): string[] {
  return relativePaths
    .filter((path) => basename(path) === SPEC_FILE && dirname(path) !== '.')
    .map((path) => dirname(path).split(sep).join('/'))
    .sort();
}

interface ValidationIssue {
  readonly level: string;
  readonly path: string;
  readonly message: string;
}

interface ValidationItem {
  readonly id: string;
  readonly type: string;
  readonly valid: boolean;
  readonly issues: readonly ValidationIssue[];
}

export interface ValidationReport {
  readonly items: readonly ValidationItem[];
}

function originOf(item: ValidationItem, capabilitiesByChange: ReadonlyMap<string, readonly string[]>): string {
  if (item.type === 'change') return item.id;
  const changes = [...capabilitiesByChange].filter(([, capabilities]) => capabilities.includes(item.id)).map(([change]) => change);
  return changes.length === 0 ? 'no active change' : changes.join(', ');
}

// Names each invalid item after the change itself or the changes whose
// deltas touch it; a change left active by a failed archive names itself.
export function validationProblems(report: ValidationReport, capabilitiesByChange: ReadonlyMap<string, readonly string[]>): string[] {
  return report.items
    .filter((item) => !item.valid)
    .flatMap((item) => {
      const origin = originOf(item, capabilitiesByChange);
      return item.issues.map((issue) => `${origin}: ${item.type} ${item.id}: [${issue.level}] ${issue.path}: ${issue.message}`);
    });
}

export function archiveProblem(change: string, output: string): string {
  return `${change}: openspec archive failed: ${output.trim()}`;
}

function subdirectories(directory: string): DirectoryEntry[] {
  return existsSync(directory) ? readdirSync(directory, { withFileTypes: true }) : [];
}

function capabilitiesOf(changesDirectory: string, change: string): string[] {
  const specs = join(changesDirectory, change, 'specs');
  return existsSync(specs) ? capabilityIds(readdirSync(specs, { recursive: true, encoding: 'utf8' })) : [];
}

export class CommandFailure extends Error {
  readonly stdout: string;
  readonly stderr: string;

  constructor(stdout: string, stderr: string, reason: string) {
    super(`${reason}: ${stdout}${stderr}`);
    this.stdout = stdout;
    this.stderr = stderr;
  }
}

export class CommandInterrupted extends Error {}

export interface CommandOptions {
  readonly cwd: string;
  readonly env: NodeJS.ProcessEnv;
}

// An interruption terminates the command and settles only after it exits,
// so that nothing writes into a directory the caller then removes.
export function runCommand(file: string, args: readonly string[], options: CommandOptions, interruption: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    if (interruption.aborted) {
      reject(new CommandInterrupted());
      return;
    }
    const child = spawn(file, args, { ...options, stdio: ['ignore', 'pipe', 'pipe'], timeout: COMMAND_TIMEOUT_MS });
    const terminate = () => child.kill('SIGTERM');
    interruption.addEventListener('abort', terminate, { once: true });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8').on('data', (chunk: string) => { stdout += chunk; });
    child.stderr.setEncoding('utf8').on('data', (chunk: string) => { stderr += chunk; });
    child.on('error', (error) => {
      if (child.pid === undefined) reject(error);
    });
    child.on('close', (code, signal) => {
      interruption.removeEventListener('abort', terminate);
      if (interruption.aborted) reject(new CommandInterrupted());
      else if (code === 0) resolve(stdout);
      else reject(new CommandFailure(stdout, stderr, `exit ${code ?? signal}`));
    });
  });
}

function openspec(copy: string, args: readonly string[], interruption: AbortSignal): Promise<string> {
  return runCommand(OPENSPEC_BIN, args, { cwd: copy, env: { ...process.env, ...OFFLINE_ENVIRONMENT } }, interruption);
}

function commandOutput(error: CommandFailure): string {
  return `${error.stdout}${error.stderr}` || error.message;
}

// A failed archive changes no file, so the remaining changes still archive.
async function archiveAll(copy: string, changes: readonly string[], interruption: AbortSignal): Promise<string[]> {
  const problems: string[] = [];
  for (const change of changes) {
    try {
      await openspec(copy, ['archive', change, '--yes'], interruption);
    } catch (error) {
      if (!(error instanceof CommandFailure)) throw error;
      problems.push(archiveProblem(change, commandOutput(error)));
    }
  }
  return problems;
}

// validate exits nonzero when an item fails but still prints its JSON report.
async function validateAll(copy: string, interruption: AbortSignal): Promise<ValidationReport> {
  try {
    return JSON.parse(await openspec(copy, ['validate', '--all', '--strict', '--json', '--no-interactive'], interruption));
  } catch (error) {
    if (!(error instanceof CommandFailure) || error.stdout === '') throw error;
    return JSON.parse(error.stdout);
  }
}

// Copies links as their targets, so that archiving writes only the copy;
// cpSync keeps nested links even with its dereference option (Node 24).
function copyResolvingLinks(source: string, target: string): void {
  if (!statSync(source).isDirectory()) {
    copyFileSync(source, target);
    return;
  }
  mkdirSync(target);
  for (const name of readdirSync(source)) copyResolvingLinks(join(source, name), join(target, name));
}

async function checkArchives(interruption: AbortSignal): Promise<string[]> {
  const changesDirectory = join(OPENSPEC_DIRECTORY, 'changes');
  const changes = activeChanges(subdirectories(changesDirectory));
  if (changes.length === 0) {
    console.log('No active OpenSpec change; nothing to archive.');
    return [];
  }
  const capabilitiesByChange = new Map(changes.map((change) => [change, capabilitiesOf(changesDirectory, change)]));
  const copy = mkdtempSync(join(tmpdir(), 'taskelith-archive-dry-run-'));
  try {
    copyResolvingLinks(OPENSPEC_DIRECTORY, join(copy, OPENSPEC_DIRECTORY));
    const archiveProblems = await archiveAll(copy, changes, interruption);
    return [...archiveProblems, ...validationProblems(await validateAll(copy, interruption), capabilitiesByChange)];
  } finally {
    rmSync(copy, { recursive: true, force: true });
  }
}

// SIGINT and SIGTERM stop the CLI and remove the copy before exiting.
async function main(): Promise<number> {
  const interruption = new AbortController();
  let received: NodeJS.Signals | undefined;
  const interrupt = (signal: NodeJS.Signals) => {
    received = signal;
    interruption.abort();
  };
  for (const signal of INTERRUPTING_SIGNALS) process.once(signal, interrupt);
  try {
    const problems = await checkArchives(interruption.signal);
    for (const problem of problems) console.error(problem);
    if (problems.length === 0) console.log('Every active OpenSpec change archives into strictly valid specs.');
    return problems.length === 0 ? 0 : 1;
  } catch (error) {
    if (received === undefined) throw error;
    console.error(`Archive dry run interrupted by ${received}.`);
    return 128 + constants.signals[received];
  }
}

if (import.meta.main) process.exitCode = await main();
