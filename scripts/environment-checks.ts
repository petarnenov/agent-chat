// Checks behind `make doctor` and `make setup`: whether this clone has what it
// needs to build and verify, and which missing parts setup can add itself.

export interface Pins {
  readonly node: string;
  readonly npm: string;
}

export interface EnvironmentFacts {
  readonly gitAvailable: boolean;
  readonly nodeVersion: string;
  readonly npmVersion: string | undefined;
  readonly dependenciesInstalled: boolean;
  readonly hooksPath: string | undefined;
}

export type CheckId = 'git' | 'node' | 'npm' | 'dependencies' | 'hooks';

export interface CheckResult {
  readonly id: CheckId;
  readonly label: string;
  readonly ok: boolean;
  readonly detail: string;
  readonly remedy: string;
}

export type SetupStep = 'install-npm' | 'install-dependencies' | 'enable-hooks';

export interface CommandOutcome {
  readonly status: number | null;
  readonly stdout: string;
}

export type CommandRunner = (command: string, args: readonly string[]) => CommandOutcome;

export const HOOKS_PATH = '.githooks';

export function readPins(env: Readonly<Record<string, string | undefined>>): Pins {
  const node = env.NODE_PIN?.trim();
  const npm = env.NPM_PIN?.trim();
  if (!node || !npm) {
    throw new Error('NODE_PIN and NPM_PIN must be set; run this through make doctor or make setup.');
  }
  return { node, npm };
}

export function collectFacts(run: CommandRunner, nodeVersion: string): EnvironmentFacts {
  const git = run('git', ['--version']);
  const npm = run('npm', ['-v']);
  const hooks = run('git', ['config', '--get', 'core.hooksPath']);
  return {
    gitAvailable: git.status === 0,
    nodeVersion,
    npmVersion: npm.status === 0 ? npm.stdout.trim() : undefined,
    dependenciesInstalled: npm.status === 0 && run('npm', ['ls', '--all']).status === 0,
    hooksPath: hooks.status === 0 ? hooks.stdout.trim() : undefined,
  };
}

export function checkEnvironment(facts: EnvironmentFacts, pins: Pins): CheckResult[] {
  return [
    {
      id: 'git',
      label: 'git',
      ok: facts.gitAvailable,
      detail: facts.gitAvailable ? 'available' : 'not found',
      remedy: 'Install git with your system package manager.'
    },
    {
      id: 'node',
      label: `Node.js ${pins.node} (.nvmrc)`,
      ok: pinnedNodeActive(facts, pins),
      detail: facts.nodeVersion,
      remedy: `With nvm, run make setup to install Node.js ${pins.node}; without nvm, install Node.js ${pins.node} yourself.`
    },
    {
      id: 'npm',
      label: `npm ${pins.npm} (CI pin)`,
      ok: facts.npmVersion === pins.npm,
      detail: facts.npmVersion ?? 'not found',
      remedy: npmRemedy(facts, pins)
    },
    {
      id: 'dependencies',
      label: 'Dependency tree complete (npm ls --all)',
      ok: facts.dependenciesInstalled,
      detail: facts.dependenciesInstalled ? 'complete' : 'missing or out of date',
      remedy: npmMissingUnderPinnedNode(facts, pins) ? 'Fix the npm check first; dependencies are installed with npm.' : 'Run make setup.'
    },
    {
      id: 'hooks',
      label: 'pre-push and post-merge hooks enabled',
      ok: facts.hooksPath === HOOKS_PATH,
      detail: facts.hooksPath ?? 'not configured',
      remedy: gitRemedy(facts)
    }
  ];
}

function gitRemedy(facts: EnvironmentFacts): string {
  return facts.gitAvailable ? 'Run make setup.' : 'Install git, then run make setup.';
}

// Each Node.js has its own npm, so only under the pinned Node.js does a
// missing npm mean a broken install, which only a reinstall fixes.
function npmRemedy(facts: EnvironmentFacts, pins: Pins): string {
  if (!pinnedNodeActive(facts, pins)) return `Fix the Node.js check first; npm is checked under Node.js ${pins.node}.`;
  if (facts.npmVersion === undefined) {
    return `Reinstall Node.js ${pins.node}, which includes npm: with nvm, run nvm deactivate, nvm uninstall ${pins.node}, and make setup; without nvm, reinstall Node.js ${pins.node} yourself.`;
  }
  return 'Run make setup.';
}

function npmMissingUnderPinnedNode(facts: EnvironmentFacts, pins: Pins): boolean {
  return pinnedNodeActive(facts, pins) && facts.npmVersion === undefined;
}

function pinnedNodeActive(facts: EnvironmentFacts, pins: Pins): boolean {
  return facts.nodeVersion === `v${pins.node}`;
}

// Without the pinned Node.js nothing is installed, so no other Node.js gets npm
// or dependencies; npm comes first because it installs the dependencies.
export function setupSteps(facts: EnvironmentFacts, pins: Pins): SetupStep[] {
  const failing = new Set(checkEnvironment(facts, pins).filter((result) => !result.ok).map((result) => result.id));
  if (failing.has('node')) return [];
  const steps: SetupStep[] = [];
  if (facts.npmVersion !== undefined) {
    if (failing.has('npm')) steps.push('install-npm');
    if (failing.has('npm') || failing.has('dependencies')) steps.push('install-dependencies');
  }
  if (!failing.has('git') && failing.has('hooks')) steps.push('enable-hooks');
  return steps;
}

export function stepCommand(step: SetupStep, pins: Pins): { command: string; args: string[] } {
  switch (step) {
    case 'install-npm':
      return { command: 'npm', args: ['install', '--global', `npm@${pins.npm}`, '--ignore-scripts'] };
    case 'install-dependencies':
      return { command: 'npm', args: ['ci', '--ignore-scripts'] };
    case 'enable-hooks':
      return { command: 'git', args: ['config', 'core.hooksPath', HOOKS_PATH] };
  }
}

// make setup, make doctor, and make verify run under the pinned Node.js, which
// they cannot activate in the calling shell.
export interface NodeSelection {
  readonly shell: string | undefined;
  readonly checks: string;
  readonly checksDirectory: string;
}

// nvm use leaves a Node.js that comes earlier in PATH first, so the notice
// also names the PATH line that the make targets use.
export function shellNodeNotice({ shell, checks, checksDirectory }: NodeSelection): string | undefined {
  if (shell === checks) return undefined;
  return `These checks ran under Node.js ${checks}, which make doctor and make verify select on their own; your shell uses ${shell || 'none'}. To run npm or node directly, run 'nvm use' and check that 'node -v' prints ${checks}; if it does not, run: export PATH=${singleQuoted(checksDirectory)}:"$PATH"`;
}

function singleQuoted(text: string): string {
  return `'${text.replaceAll("'", "'\\''")}'`;
}

export function formatReport(results: readonly CheckResult[]): string {
  const lines = results.map((result) => {
    const line = `${result.ok ? 'ok  ' : 'FAIL'} ${result.label}: ${result.detail}`;
    return result.ok ? line : `${line}\n     ${result.remedy}`;
  });
  const failures = results.filter((result) => !result.ok).length;
  const summary = failures === 0 ? 'All checks passed.' : `${failures} of ${results.length} checks failed.`;
  return [...lines, summary].join('\n');
}
