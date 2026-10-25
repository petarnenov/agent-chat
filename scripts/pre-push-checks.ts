// Node built-ins only, like the other hook helpers.

const DELETION = /^0+$/;

// make verify checks the checked-out commit, so every other pushed commit is
// unverified; git passes one "<local ref> <sha> <remote ref> <sha>" per line.
export function unverifiedPushRefs(updates: string, head: string): string[] {
  return updates.split('\n').filter(line => line.trim() !== '')
    .map(line => line.trim().split(/\s+/))
    .filter(([, localSha]) => !DELETION.test(localSha) && localSha !== head)
    .map(([localRef]) => localRef);
}
