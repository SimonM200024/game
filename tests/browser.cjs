const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { existsSync, mkdirSync } = require('node:fs');
const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:8000';
const fightingStyle = process.argv[2] || 'soldier';
mkdirSync('test-results', { recursive: true });
(async () => {
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),args:['--no-sandbox','--disable-webgl']});
 try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install();await page.addInitScript(()=>{let seed=87;Math.random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646}});
 await page.goto(baseUrl);await page.locator('#name').fill('Test Champion');await page.locator(`[data-class="${fightingStyle}"]`).click();await page.locator('#create-form .primary').click();
 assert.equal(await page.locator('#gold').textContent(),'45');
 await page.locator('#open-blacksmith').click();await page.locator('[data-item="weapon-1"] button').click();
 assert.match(await page.locator('#merchant-message').textContent(),/Iron sword equipped/);assert.equal(await page.locator('#gold').textContent(),'10');
 await page.locator('[data-item="weapon-0"] button').click();assert.equal(await page.locator('#gold').textContent(),'10');await page.locator('[data-item="weapon-1"] button').click();assert.equal(await page.locator('#gold').textContent(),'10');
 assert.equal(await page.locator('[data-item="weapon-5"] button').isDisabled(),true);await page.locator('#close-town').click();
 let fights=0,turns=0,losses=0;
 const enter = async()=>{await page.locator('#next-fight').click();assert.equal(await page.locator('#story-dialog').isVisible(),true);assert.ok((await page.locator('#story-intro').textContent()).length>20);await page.locator('#story-fight').click()};
 await enter();assert.equal(await page.locator('[data-action="bandage"]').isDisabled(),true);
 await page.locator('[data-action="special"]').click();assert.equal(await page.locator('[data-action="strike"]').isDisabled(),true);await page.clock.runFor(1050);assert.match(await page.locator('[data-action="special"] span').textContent(),/Ready in 3/);turns++;
 while(fights<12 && turns<450 && losses<12){
  if(await page.locator('#camp-panel').isVisible()){
   const save=await page.evaluate(()=>JSON.parse(localStorage.getItem('dust-and-glory-v1')));fights=save.wins;if(fights===12)break;
   if((await page.locator('#camp-eyebrow').textContent()).includes('DEFEATED'))losses++;
   await page.locator('#open-tavern').click();
   for(const claim of await page.locator('[data-job]:enabled').all())await claim.click();
   await page.locator('#close-town').click();await page.locator('#open-blacksmith').click();
   for(const category of ['weapon','armor','shield']){
    await page.locator(`[data-category="${category}"]`).click();
    const upgrades=page.locator('.item-buy:enabled').filter({hasText:'BUY & EQUIP'});if(await upgrades.count())await upgrades.last().click();
   }
   await page.locator('#close-town').click();await enter();
  }
  const [hp,maxHp]=(await page.locator('#player-health').textContent()).split('/').map(Number),intent=await page.locator('#intent').textContent();
  const enemyHp=Number((await page.locator('#enemy-health').textContent()).split('/')[0]);
  let action='strike';
  if(hp<maxHp*.5 && !intent.includes('heavy') && await page.locator('[data-action="bandage"]').isEnabled())action='bandage';
  else if(enemyHp<30 && await page.locator('[data-action="special"]').isEnabled())action='special';
  else if(intent.includes('heavy'))action='guard';
  else if((await page.locator('#enemy-figure').getAttribute('class')).includes('guarding'))action='recover';
  else if(await page.locator('[data-action="special"]').isEnabled())action='special';
  else if(intent.includes('recover') && await page.locator('[data-action="heavy"]').isEnabled())action='heavy';
  await page.locator(`[data-action="${action}"]`).click();await page.clock.runFor(2300);turns++;
 }
 assert.equal(fights,12,'Can complete all four chapters through normal combat and purchases');
 let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('dust-and-glory-v1')));assert.ok(saved.level>6);assert.ok(saved.shield>0);assert.ok(saved.claimedJobs.length>0);
 await page.locator('[data-ending="freedom"]').click();assert.match(await page.locator('#story-summary').textContent(),/tear the debt charter/);
 await page.reload();await page.locator('#continue').click();assert.equal(await page.locator('#ending-choices').isVisible(),false);assert.equal(await page.locator('#next-fight').isVisible(),false);
 saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('dust-and-glory-v1')));assert.equal(saved.ending,'freedom');
 await page.locator('#open-journal').click();assert.equal(await page.locator('.journal-chapter').count(),4);assert.match(await page.locator('#town-dialog-content').textContent(),/No More Chains/);await page.locator('#close-town').click();
 await page.locator('#new-character').click();await page.locator('#continue').click();assert.equal(await page.locator('#next-fight').isVisible(),false);
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});mobile.on('pageerror',e=>errors.push(e.message));
 await mobile.goto(baseUrl);await mobile.locator('#create-form .primary').tap();await mobile.locator('#open-blacksmith').tap();await mobile.locator('[data-item="weapon-1"] button').tap();await mobile.screenshot({path:'test-results/story-mobile-shop.png'});await mobile.locator('#close-town').tap();
 await mobile.locator('#next-fight').tap();await mobile.locator('#story-fight').tap();await mobile.locator('[data-action="strike"]').tap();
 assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await mobile.goto(baseUrl+'/starfall/');assert.equal(await mobile.title(),'Starfall — A little cosmic chaos');assert.deepEqual(errors,[]);
 console.log(JSON.stringify({result:'PASS',fightingStyle,fights,turns,losses,level:saved.level,checks:'four chapters, twelve fights, shop purchase/equip, locked gear, jobs, story introductions, ending, persistence, journal, mobile, Starfall'}));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
