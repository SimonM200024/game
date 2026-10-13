const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { mkdirSync } = require('node:fs');
mkdirSync('test-results', { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  try {
    for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
      const page = await browser.newPage({ viewport: { width, height } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(process.env.BASE_URL || 'http://127.0.0.1:8000');
      await page.locator('#create-form .primary').click();
      await page.locator('#open-character').click();
      await page.waitForFunction(() => document.querySelector('.portrait-art')?.naturalWidth > 0);
      await page.screenshot({ path: `test-results/anime-${name}-portrait.png` });
      await page.getByRole('button', { name: 'Face & armor' }).click();
      assert.equal(await page.locator('.portrait-art-viewport').evaluate(node => node.classList.contains('zoomed')), true);
      await page.getByRole('button', { name: 'Full character' }).click();
      assert.equal(await page.locator('.portrait-art-viewport').evaluate(node => node.classList.contains('zoomed')), false);
      await page.locator('#close-town').click();
      await page.locator('#open-character').click();
      assert.equal(await page.locator('.portrait-art').count(), 1);
      await page.locator('#close-town').click();
      await page.locator('#next-fight').click();
      await page.waitForFunction(() => document.querySelector('#story-portrait img')?.naturalWidth > 0);
      await page.locator('#story-fight').click();
      await page.locator('[data-action="special"]').click();
      await page.waitForFunction(() => !document.querySelector('[data-action="strike"]').disabled);
      await page.screenshot({ path: `test-results/anime-${name}-combat.png` });
      assert.deepEqual(errors, []);
      await page.close();
      console.log(`PASS ${name}: loaded character art, detail zoom, reopen, rival art and combat`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
