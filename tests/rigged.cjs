const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { mkdirSync } = require('node:fs');
mkdirSync('test-results', { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox','--enable-unsafe-swiftshader'] });
  try {
    for (const [name,width,height] of [['desktop',1200,900],['mobile',390,844]]) {
      const page = await browser.newPage({viewport:{width,height}});
      const errors=[];page.on('pageerror',error=>errors.push(error.message));
      await page.goto(process.env.BASE_URL || 'http://127.0.0.1:8000');
      await page.waitForFunction(()=>document.querySelector('#arena').dataset.rigged==='true',null,{timeout:90000});
      await page.locator('#create-form .primary').click();
      await page.locator('#open-character').click();
      const preview=page.locator('.rigged-preview');await preview.waitFor({timeout:90000});
      await page.waitForTimeout(500);
      await page.screenshot({path:`test-results/rigged-${name}-front.png`});
      for(let i=0;i<4;i++) await page.getByRole('button',{name:'Turn right',exact:true}).click();
      assert.equal(Number(await preview.getAttribute('data-angle')),Math.PI);
      await page.screenshot({path:`test-results/rigged-${name}-back.png`});
      for(let i=0;i<4;i++) await page.getByRole('button',{name:'Turn left',exact:true}).click();
      await page.getByRole('button',{name:'Walk',exact:true}).click();
      const before=await preview.screenshot();await page.waitForTimeout(300);const after=await preview.screenshot();
      assert.equal(before.equals(after),false,'Walking changes the rendered pose');
      await page.getByRole('button',{name:'Attack',exact:true}).click();
      assert.equal(await preview.getAttribute('data-animation'),'attack');
      await page.getByRole('button',{name:'Guard',exact:true}).click();
      await page.screenshot({path:`test-results/rigged-${name}-guard.png`});
      await page.locator('#close-town').click();
      await page.locator('#open-character').click();await preview.waitFor({timeout:90000});
      assert.equal(await preview.count(),1);
      await page.locator('#close-town').click();
      await page.locator('#next-fight').click();await page.locator('#story-fight').click();
      await page.locator('[data-action="special"]').click();
      await page.waitForFunction(()=>!document.querySelector('[data-action="strike"]').disabled);
      await page.screenshot({path:`test-results/rigged-${name}-combat.png`});
      assert.ok(Number((await page.locator('#enemy-health').textContent()).split('/')[0])<65);
      assert.deepEqual(errors,[]);await page.close();
      console.log(`PASS ${name}: loaded rig, actual back view, animated walk, attack/guard preview, cleanup/reopen and combat`);
    }
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
