const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { existsSync, mkdirSync } = require('node:fs');
const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:8000';
const executablePath = process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
mkdirSync('test-results', { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844], ['landscape', 844, 390]]) {
      const page = await browser.newPage({ viewport: { width, height }, isMobile: name !== 'desktop', hasTouch: name !== 'desktop' });
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(baseUrl);
      await page.waitForFunction(() => Boolean(window.arena3d));
      assert.equal(await page.locator('#graphics-status').textContent(), '3D ARENA');
      const bounds = await page.locator('#arena-3d').boundingBox();
      assert.equal(bounds.width, width);
      assert.equal(await page.evaluate(() => document.documentElement.scrollHeight > innerHeight || document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: `test-results/3d-${name}-creator.png` });
      if (name === 'desktop') {
        await page.locator('#fullscreen').click();
        await page.waitForFunction(() => Boolean(document.fullscreenElement));
        assert.equal(await page.locator('#fullscreen').getAttribute('aria-pressed'), 'true');
        await page.locator('#fullscreen').click();
        await page.waitForFunction(() => !document.fullscreenElement);
      }
      await page.locator('#create-form .primary').click();
      await page.locator('#next-fight').click();
      await page.locator('[data-action="strike"]').click();
      await page.waitForFunction(() => !document.querySelector('[data-action="strike"]').disabled);
      assert.ok(Number((await page.locator('#enemy-health').textContent()).split('/')[0]) < 65);
      await page.locator('[data-action="guard"]').click();
      await page.waitForFunction(() => !document.querySelector('[data-action="strike"]').disabled);
      for (const action of await page.locator('[data-action]').all()) {
        await action.scrollIntoViewIfNeeded();
        const rect = await action.boundingBox();
        assert.ok(rect.x >= 0 && rect.x + rect.width <= width && rect.y >= 0 && rect.y + rect.height <= height, `${name}: action is reachable inside viewport`);
      }
      await page.screenshot({ path: `test-results/3d-${name}-combat.png` });
      await page.context().setOffline(true);
      await page.locator('[data-action="recover"]').click();
      await page.waitForFunction(() => !document.querySelector('[data-action="strike"]').disabled);
      await page.close();
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
  const fallback = await chromium.launch({ executablePath, args: ['--no-sandbox', '--disable-webgl'] });
  try {
    const page = await fallback.newPage();
    await page.goto(baseUrl);
    assert.equal(await page.evaluate(() => Boolean(window.arena3d)), false);
    assert.equal(await page.locator('.arena-art').isVisible(), true);
    await page.locator('#create-form .primary').click(); await page.locator('#next-fight').click();
    await page.locator('[data-action="strike"]').click();
    await page.waitForFunction(() => !document.querySelector('[data-action="strike"]').disabled);
    assert.ok(Number((await page.locator('#enemy-health').textContent()).split('/')[0]) < 65);
  } finally { await fallback.close(); }
  console.log('PASS: real WebGL rendering, viewport layout, fullscreen entry/exit, desktop/mobile/landscape controls, offline combat, and playable no-WebGL fallback.');
})().catch(error => { console.error(error); process.exit(1); });
