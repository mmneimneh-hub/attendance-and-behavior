import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

const checks = [
  ['mobile viewport scaling', /<meta name="viewport" content="[^"]*width=device-width[^"]*viewport-fit=cover[^"]*">/],
  ['tablet breakpoint', /@media\(max-width:900px\)\s*\{/],
  ['phone breakpoint', /@media\(max-width:600px\)\s*\{/],
  ['dynamic mobile viewport height', /#loginPage\{[^}]*min-height:100dvh/],
  ['scrollable short-screen login', /#loginPage\{[^}]*overflow-y:auto/],
  ['safe-area page spacing', /\.main\{[^}]*safe-area-inset-(?:right|left)/],
  ['safe-area navigation drawer', /\.sidebar\{[^}]*height:100dvh[^}]*safe-area-inset-bottom/],
  ['single-column mobile forms', /\.fg\{grid-template-columns:minmax\(0,1fr\)/],
  ['horizontally scrollable tables', /\.tw\{overflow-x:auto\}/],
];

const failures = checks.filter(([, pattern]) => !pattern.test(html));

for (const [name] of checks) {
  const failed = failures.some(([failure]) => failure === name);
  console.log(`${failed ? 'FAIL' : 'PASS'} ${name}`);
}

if (failures.length) {
  process.exitCode = 1;
  console.error(`\n${failures.length} mobile rendering check(s) failed.`);
} else {
  console.log(`\nAll ${checks.length} mobile rendering checks passed.`);
}
