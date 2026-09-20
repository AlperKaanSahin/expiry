const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const resultsFile = path.join(process.cwd(), 'jest-results.json');
const outputFile = path.join(process.cwd(), 'failed-tests.txt');

console.log('Jest testleri çalıştırılıyor...\n');

const jestPath = path.join(
  process.cwd(),
  'node_modules',
  '.bin',
  'jest.cmd'
);

const result = spawnSync(
  jestPath,
  [
    '--runInBand',
    '--json',
    `--outputFile=${resultsFile}`,
  ],
  {
    stdio: 'inherit',
    shell: true,
  }
);

function stripAnsi(text) {
  return text.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');
}

let output = 'FAILED TESTS\n\n';

if (fs.existsSync(resultsFile)) {
  const report = JSON.parse(
    fs.readFileSync(resultsFile, 'utf8')
  );

  for (const suite of report.testResults || []) {
    // --------------------------------------------------
    // 1. Suite tamamen çalışmadan çökmüşse
    // --------------------------------------------------

    if (suite.status === 'failed' && suite.assertionResults.length === 0) {
      const message = stripAnsi(suite.message || '');

      output += `${suite.name}\n`;
      output += `${'='.repeat(suite.name.length)}\n\n`;

      output += `✗ TEST SUITE FAILED TO RUN\n\n`;

      if (message) {
        output += message
          .split('\n')
          .map(line => `  ${line}`)
          .join('\n');

        output += '\n';
      }

      output += '\n';

      continue;
    }

    // --------------------------------------------------
    // 2. Suite çalıştı ama bazı testler fail olduysa
    // --------------------------------------------------

    const failedTests = (suite.assertionResults || [])
      .filter(test => test.status === 'failed');

    if (failedTests.length === 0) continue;

    output += `${suite.name}\n`;
    output += `${'='.repeat(suite.name.length)}\n\n`;

    for (const test of failedTests) {
      output += `✗ ${test.fullName}\n`;

      const failureMessage = stripAnsi(
        test.failureMessages?.join('\n') || ''
      );

      const locationMatch = failureMessage.match(
        /at Object\.[^(]+\((.*?):(\d+):(\d+)\)/
      );

      if (locationMatch) {
        const [, file, line, column] = locationMatch;

        output += `  File: ${file}\n`;
        output += `  Line: ${line}\n`;
        output += `  Column: ${column}\n`;
      }

      const expectedMatch = failureMessage.match(
        /Expected:\s*(.+)/
      );

      const receivedMatch = failureMessage.match(
        /Received:\s*(.+)/
      );

      if (expectedMatch) {
        output += `  Expected: ${stripAnsi(expectedMatch[1]).trim()}\n`;
      }

      if (receivedMatch) {
        output += `  Received: ${stripAnsi(receivedMatch[1]).trim()}\n`;
      }

      if (failureMessage) {
        output += '\n  Failure:\n';

        output += failureMessage
          .split('\n')
          .map(line => `  ${line}`)
          .join('\n');

        output += '\n';
      }

      output += '\n';
    }
  }

  fs.unlinkSync(resultsFile);
} else {
  output += 'Jest sonuç dosyası oluşturulamadı.\n';
}

fs.writeFileSync(outputFile, output, 'utf8');

console.log('\n' + output);
console.log(`Sonuçlar kaydedildi: ${outputFile}`);

process.exit(result.status ?? 1);