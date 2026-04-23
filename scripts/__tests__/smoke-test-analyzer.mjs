#!/usr/bin/env node
/**
 * Smoke test for migration-safety-analyzer.mjs
 * Runs each fixture through the analyzer and verifies expected exit codes.
 * Usage: node scripts/__tests__/smoke-test-analyzer.mjs
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..', '..'); // project root
const ANALYZER = path.join(ROOT, 'scripts', 'migration-safety-analyzer.mjs');
const FIXTURES_DIR = path.join(__dirname, 'migration-safety-analyzer');

// expected: 'PASS' (exit 0), 'BLOCK' (exit 1), 'WARN' (exit 0)
const FIXTURES = [
  { file: '01-drop-table.sql',         expected: 'BLOCK' },
  { file: '02-truncate.sql',           expected: 'BLOCK' },
  { file: '03-delete-no-where.sql',    expected: 'BLOCK' },
  { file: '04-delete-with-where.sql',  expected: 'PASS'  },
  { file: '05-drop-column.sql',        expected: 'BLOCK' },
  { file: '06-alter-column-type.sql',  expected: 'BLOCK' },
  { file: '07-rls-policy.sql',         expected: 'BLOCK' },
  { file: '08-set-not-null.sql',       expected: 'BLOCK' },
  { file: '09-add-unique.sql',         expected: 'BLOCK' },
  { file: '10-safe-migration.sql',     expected: 'PASS'  },
  { file: '11-execute-with-drop.sql',          expected: 'BLOCK' },
  { file: '12-execute-safe-select.sql',        expected: 'PASS'  },
  { file: '13-execute-with-concat.sql',        expected: 'BLOCK' },
  { file: '14-execute-with-marker.sql',        expected: 'WARN',
    markers: { executeReviewed: true } },
  // Filename validation tests — use nameOverride to simulate different filenames
  { file: 'invalid-name-with-hyphens.sql',    expected: 'BLOCK',
    nameOverride: '2026-04-19-01-test.sql' },
  { file: 'invalid-name-short-timestamp.sql', expected: 'BLOCK',
    nameOverride: '202604_test.sql' },
  { file: 'invalid-name-uppercase.sql',       expected: 'BLOCK',
    nameOverride: '20260419010000_TestTable.sql' },
  { file: 'valid-name-snake-case.sql',        expected: 'PASS',
    nameOverride: '20260419010000_create_users.sql' },
];

let passed = 0;
let failed = 0;
const failures = [];

for (const { file, expected, markers, nameOverride } of FIXTURES) {
  const filePath = path.join(FIXTURES_DIR, file);
  // --no-git-markers prevents the analyzer from reading the current git commit message,
  // so test results don't depend on what markers happen to be in the last commit.
  const args = ['node', ANALYZER, '--file', filePath, '--no-git-markers'];
  if (markers) {
    args.push('--markers', JSON.stringify(markers));
  }
  if (nameOverride) {
    args.push('--filename', nameOverride);
  }

  const result = spawnSync(args[0], args.slice(1), {
    encoding: 'utf8',
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 10000,
  });

  const output = (result.stdout || '') + (result.stderr || '');
  const exitCode = result.status;

  let actual;
  if (result.error) {
    actual = 'CRASH';
  } else if (exitCode !== 0) {
    actual = 'BLOCK';
  } else if (output.includes('⚠') || output.includes('WARN')) {
    actual = 'WARN';
  } else {
    actual = 'PASS';
  }

  const ok = actual === expected;
  const icon = ok ? '✓' : '✗';
  console.log(`${icon} ${file.padEnd(40)} expected=${expected.padEnd(5)} actual=${actual}`);

  if (ok) {
    passed++;
  } else {
    failed++;
    failures.push({ file, expected, actual, output: output.trim().slice(0, 300) });
  }
}

console.log('');
console.log(`Results: ${passed} passed, ${failed} failed (total: ${FIXTURES.length})`);

if (failed > 0) {
  console.log('\nFailures:');
  for (const f of failures) {
    console.log(`\n  ✗ ${f.file}`);
    console.log(`    expected: ${f.expected}, got: ${f.actual}`);
    if (f.output) console.log(`    output:\n${f.output.split('\n').map(l => '      ' + l).join('\n')}`);
  }
  process.exit(1);
}

console.log('✅ All smoke tests passed.');
process.exit(0);
