const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { existsSync, mkdirSync } = require('node:fs');
mkdirSync('test-results', { recursive: true });
// Campaign rules use the illustrated renderer; test:graphics exercises real WebGL separately.
const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:8000';
const fightingStyle = process.argv[2] || 'soldier';
(async () => {
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),args:['--no-sandbox','--disable-webgl']});
 const page=await browser.newPage({viewport:{width:1440,height:1100}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install();
 await page.addInitScript(()=>{let seed=87;Math.random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646}});
 await page.goto(baseUrl);
 await page.screenshot({path:'test-results/gladiator-desktop.png',fullPage:true});
 await page.locator('#name').fill('Test Champion');
 await page.locator(`[data-class="${fightingStyle}"]`).click();
 await page.locator('[data-color="teal"]').click();
 await page.locator('#create-form .primary').click();
 assert.equal(await page.locator('#gold').textContent(),'45');
 await page.locator('#buy-weapon').click();assert.equal(await page.locator('#gold').textContent(),'10');
 await page.locator('#next-fight').click();
 assert.equal(await page.locator('[data-action="bandage"]').isDisabled(),true,'Cannot waste bandage at full health');
 await page.locator('[data-action="special"]').click();
 assert.equal(await page.locator('[data-action="strike"]').isDisabled(),true,'Blocks input during enemy turn');
 await page.clock.runFor(1050);
 assert.match(await page.locator('[data-action="special"] span').textContent(),/Ready in 3/);
 await page.screenshot({path:'test-results/gladiator-fight.png',fullPage:true});
 let fights=0, turns=1, losses=0;
 while(fights<6 && turns<450){
   if(await page.locator('#camp-panel').isVisible()){
     const save=await page.evaluate(()=>JSON.parse(localStorage.getItem('dust-and-glory-v1')));
     if(save.wins===6){fights=6;break;}
     if((await page.locator('#camp-eyebrow').textContent()).includes('DEFEATED'))losses++;
     fights=save.wins;
     for(const item of ['#buy-weapon','#buy-armor','#buy-training']) if(await page.locator(item).isEnabled())await page.locator(item).click();
     await page.locator('#next-fight').click();
   }
   const hp=Number((await page.locator('#player-health').textContent()).split('/')[0]);
   const intent=await page.locator('#intent').textContent();
   const enemyHp=Number((await page.locator('#enemy-health').textContent()).split('/')[0]);
   let action='strike';
   if(hp<45 && await page.locator('[data-action="bandage"]').isEnabled())action='bandage';
   else if(enemyHp<30 && await page.locator('[data-action="special"]').isEnabled())action='special';
   else if(intent.includes('heavy'))action='guard';
   else if(await page.locator('[data-action="special"]').isEnabled())action='special';
   else if((await page.locator('#enemy-figure').getAttribute('class')).includes('guarding'))action='recover';
   else if(intent.includes('recover') && await page.locator('[data-action="heavy"]').isEnabled())action='heavy';
   await page.locator(`[data-action="${action}"]`).click();
   await page.clock.runFor(2300);turns++;
 }
 assert.equal(fights,6,'Can beat all six opponents using tactical play');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('dust-and-glory-v1')));
 assert.ok(saved.level>1);assert.ok(saved.weapon>0);assert.ok(saved.armor>0);
 await page.reload();await page.locator('#continue').click();
 assert.equal(await page.locator('#camp-title').textContent(),'All hail Test Champion.');
 assert.equal(await page.locator('#next-fight').isVisible(),false,'Campaign ends after sixth opponent');
 await page.screenshot({path:'test-results/gladiator-champion.png',fullPage:true});
 await page.locator('#new-character').click();await page.locator('#continue').click();assert.equal(await page.locator('#camp-title').textContent(),'All hail Test Champion.');
 await page.locator('#help').click();assert.equal(await page.locator('#help-dialog').isVisible(),true);await page.locator('#help-done').click();
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});mobile.on('pageerror',e=>errors.push(e.message));
 await mobile.goto(baseUrl);await mobile.screenshot({path:'test-results/gladiator-mobile.png',fullPage:true});
 assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await mobile.locator('[data-class="brute"]').tap();await mobile.locator('#create-form .primary').tap();await mobile.locator('#next-fight').tap();await mobile.locator('[data-action="strike"]').tap();
 assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await mobile.screenshot({path:'test-results/gladiator-mobile-fight.png',fullPage:true});
 await mobile.goto(baseUrl + '/starfall/');assert.equal(await mobile.title(),'Starfall — A little cosmic chaos');
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({result:'PASS',fightingStyle,fights,turns,losses,saved,checks:'creation, purchases, action locks, cooldown, full campaign, levels, saved progress, help, mobile, Starfall retained'}));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
