import { spawnSync } from 'node:child_process';
import { dirname } from 'node:path';
import {
  checkEnvironment, collectFacts, formatReport, readPins, setupSteps, shellNodeNotice, stepCommand, type CommandRunner
} from './environment-checks.ts';

// `make setup`: installs what this clone can and reports the result; it runs
// under the .nvmrc Node.js through scripts/with-pinned-node.sh.

const run: CommandRunner = (command, args) => {
  const result = spawnSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  return { status: result.status, stdout: result.stdout ?? '' };
};

const pins = readPins(process.env);
const facts = () => collectFacts(run, process.version);

for (const step of setupSteps(facts(), pins)) {
  const { command, args } = stepCommand(step, pins);
  console.log(`> ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    console.error(`make setup: '${command} ${args.join(' ')}' failed.`);
    process.exit(1);
  }
}

const results = checkEnvironment(facts(), pins);
console.log(formatReport(results));
const notice = shellNodeNotice({
  shell: process.env.INVOKING_NODE, checks: process.version, checksDirectory: dirname(process.execPath)
});
if (notice) console.log(notice);
if (results.some((result) => !result.ok)) process.exit(1);
