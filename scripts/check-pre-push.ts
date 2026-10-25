import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { unverifiedPushRefs } from './pre-push-checks.ts';

// Run by the pre-push hook before make verify, which reads the working tree.
const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const unverified = unverifiedPushRefs(readFileSync(0, 'utf8'), head);
if (unverified.length > 0) {
  console.error(`pre-push: make verify checks only the checked-out commit; check out and push ${unverified.join(', ')} separately`);
  process.exit(1);
}
