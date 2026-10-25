import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { join, posix, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Node's coverage reports only modules that tests load, so this fails on a
// product module missing from the report, unless it declares only types.

function sourceModules(root: string, dir: string): string[] {
  const full = join(root, dir);
  if (!existsSync(full)) return [];
  return readdirSync(full).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(join(root, path)).isDirectory()) return sourceModules(root, path);
    return path.endsWith('.ts') && !path.endsWith('.d.ts') ? [path] : [];
  });
}

function productSources(root: string): { source: string; compiled: string }[] {
  return sourceModules(root, 'src').map((source) => {
    const relativeSource = relative('src', source).split(sep).join('/');
    return { source: source.split(sep).join('/'), compiled: posix.join('dist', relativeSource.replace(/\.ts$/, '.js')) };
  });
}

function coveredFiles(root: string, lcov: string): Set<string> {
  return new Set(lcov.split('\n')
    .filter((line) => line.startsWith('SF:'))
    .map((line) => relative(root, resolve(root, line.slice(3))).split(sep).join('/')));
}

function isTypeOnly(root: string, compiled: string): boolean {
  const path = join(root, compiled);
  if (!existsSync(path)) return false;
  const code = readFileSync(path, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').trim();
  return code === 'export {};';
}

export function missingFromCoverage(root: string, lcov: string): string[] {
  const covered = coveredFiles(root, lcov);
  return productSources(root)
    .filter(({ compiled }) => !covered.has(compiled) && !isTypeOnly(root, compiled))
    .map(({ source }) => source);
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const missing = missingFromCoverage(process.cwd(), readFileSync(process.argv[2], 'utf8'));
  if (missing.length > 0) {
    console.error(`Product modules missing from the coverage report: ${missing.join(', ')}`);
    process.exit(1);
  }
  console.log('Every product module is in the coverage report.');
}
