import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const messages = [];
page.on('console', msg => {
  const type = msg.type();
  if (type === 'error' || type === 'warning') {
    messages.push(`${type.toUpperCase()}: ${msg.text()}`);
  }
});
page.on('pageerror', err => messages.push(`PAGEERROR: ${err.message}`));

await page.goto('http://localhost:3030/', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

console.log('=== CONSOLE ERRORS & WARNINGS ===');
for (const m of messages) {
  console.log(m.substring(0, 1000));
  console.log('---');
}

await browser.close();
