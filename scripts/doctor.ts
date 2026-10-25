import { spawnSync } from 'node:child_process';
import { dirname } from 'node:path';
import {
  checkEnvironment, collectFacts, formatReport, readPins, shellNodeNotice, type CommandRunner
} from './environment-checks.ts';

// `make doctor`: reports whether this clone can build and verify; changes
// nothing.

const run: CommandRunner = (command, args) => {
  const result = spawnSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  return { status: result.status, stdout: result.stdout ?? '' };
};

const results = checkEnvironment(collectFacts(run, process.version), readPins(process.env));
console.log(formatReport(results));
const notice = shellNodeNotice({
  shell: process.env.INVOKING_NODE, checks: process.version, checksDirectory: dirname(process.execPath)
});
if (notice) console.log(notice);
if (results.some((result) => !result.ok)) process.exit(1);
