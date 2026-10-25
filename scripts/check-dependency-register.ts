import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Checks docs/dependencies.md against package.json and the lockfile, so every
// direct dependency is registered, reviewed, and at its locked version.

interface Manifest {
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
}

interface LockedEntry {
  readonly version?: string;
  readonly license?: string;
}

interface Lockfile {
  readonly packages?: Record<string, LockedEntry>;
}

export interface DirectDependency {
  readonly name: string;
  readonly scope: 'prod' | 'dev';
}

export interface RegisterRow {
  readonly name: string;
  readonly version: string;
  readonly scope: string;
  readonly license: string;
  readonly reviewed: string;
}

const REGISTER_HEADER = '| Package | Version | Scope | License | Reviewed |';

export function directDependencies(manifest: Manifest): DirectDependency[] {
  const prod = Object.keys(manifest.dependencies ?? {});
  const dev = Object.keys(manifest.devDependencies ?? {}).filter((name) => !prod.includes(name));
  return [
    ...prod.map((name) => ({ name, scope: 'prod' as const })),
    ...dev.map((name) => ({ name, scope: 'dev' as const })),
  ];
}

export function parseRegister(markdown: string): RegisterRow[] {
  const lines = markdown.split('\n').filter((line) => line.startsWith('|'));
  return lines
    .filter((line) => !line.startsWith('| ---') && line.trim() !== REGISTER_HEADER)
    .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()))
    .map(([name = '', version = '', scope = '', license = '', reviewed = '']) => ({ name, version, scope, license, reviewed }));
}

export function registerProblems(
  manifest: Manifest,
  lockfile: Lockfile,
  rows: readonly RegisterRow[],
): string[] {
  const problems: string[] = [];
  const direct = directDependencies(manifest);
  const byName = new Map(rows.map((row) => [row.name, row]));
  for (const dependency of direct) {
    const row = byName.get(dependency.name);
    const locked = lockfile.packages?.[`node_modules/${dependency.name}`];
    if (!row) {
      problems.push(`${dependency.name}: not registered in docs/dependencies.md`);
      continue;
    }
    if (locked?.version !== row.version) {
      problems.push(`${dependency.name}: registered ${row.version}, lockfile has ${locked?.version ?? 'no entry'}`);
    }
    if (dependency.scope !== row.scope) {
      problems.push(`${dependency.name}: registered scope ${row.scope}, manifest has ${dependency.scope}`);
    }
    if (locked?.license !== row.license) {
      problems.push(`${dependency.name}: registered license ${row.license}, lockfile declares ${locked?.license ?? 'none'}`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.reviewed)) {
      problems.push(`${dependency.name}: review date ${row.reviewed || 'missing'} is not YYYY-MM-DD`);
    }
  }
  const directNames = new Set(direct.map((dependency) => dependency.name));
  for (const row of rows) {
    if (!directNames.has(row.name)) problems.push(`${row.name}: registered but not a direct dependency`);
  }
  return problems;
}

function main(): void {
  const report = process.argv.includes('--report');
  const manifest: Manifest = JSON.parse(readFileSync('package.json', 'utf8'));
  const lockfile: Lockfile = JSON.parse(readFileSync('package-lock.json', 'utf8'));
  const rows = parseRegister(readFileSync('docs/dependencies.md', 'utf8'));
  const problems = registerProblems(manifest, lockfile, rows);
  if (problems.length === 0) {
    console.log(`Every direct dependency is registered: ${rows.length}.`);
    return;
  }
  for (const problem of problems) console.error(`dependency register: ${problem}`);
  if (!report) process.exit(1);
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) main();
