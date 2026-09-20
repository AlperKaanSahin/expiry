const fs = require('fs');

const resultsFile = './jest-results.json';
const outputFile = './failed-tests.txt';

if (!fs.existsSync(resultsFile)) {
  console.error('jest-results.json bulunamadı.');
  process.exit(1);
}

const results = JSON.parse(
  fs.readFileSync(resultsFile, 'utf8')
);

let output = 'FAILED TESTS\n\n';

for (const suite of results.testResults || []) {
  const failedTests = (suite.assertionResults || [])
    .filter(test => test.status === 'failed');

  if (failedTests.length === 0) continue;

  output += `${suite.name}\n`;

  for (const test of failedTests) {
    output += `  ✗ ${test.fullName}\n`;
  }

  output += '\n';
}

fs.writeFileSync(outputFile, output, 'utf8');

console.log(output);
console.log(`Sonuçlar kaydedildi: ${outputFile}`);

// Geçici Jest JSON dosyasını temizle
fs.unlinkSync(resultsFile);