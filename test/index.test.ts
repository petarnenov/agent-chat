import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PROJECT, projectInfo } from '../dist/index.js';

test('the scaffold reports the project name and status', () => {
  assert.deepEqual(projectInfo(), { name: PROJECT, status: 'scaffold' });
});
