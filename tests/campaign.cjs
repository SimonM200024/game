const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeSave, chapters, opponents, catalog, chapterIndex, jobs } = require('../campaign.js');
const legacy = { version: 1, name: 'Veteran', style: 'soldier', color: 'teal', gold: 158, xp: 0, wins: 6, level: 6, weapon: 3, armor: 2, training: 1 };
test('legacy champion migrates with equipment, money and progression intact', () => {
 const hero = normalizeSave(legacy); assert.equal(hero.version, 2); for (const key of ['name','gold','xp','wins','level','weapon','armor','training']) assert.equal(hero[key], legacy[key]);
 assert.deepEqual(hero.ownedWeapons,[0,1,2,3]); assert.deepEqual(hero.ownedArmor,[0,1,2]); assert.deepEqual(hero.ownedShields,[0]); assert.equal(hero.shield,0); assert.equal(hero.ending,null); assert.equal(chapterIndex(hero.wins),2);
 assert.equal(catalog.weapon[hero.weapon].attack,12);assert.equal(catalog.armor[hero.armor].defense,5);assert.equal(catalog.armor[hero.armor].hp,20);
});
test('v2 inventory, jobs and equipment survive a JSON round-trip',()=>{const hero=normalizeSave(legacy);hero.shield=2;hero.ownedShields.push(1,2);hero.claimedJobs.push('first-steel');assert.deepEqual(normalizeSave(JSON.parse(JSON.stringify(hero))),hero)});
test('rejects equipped gear that is not owned',()=>{const hero=normalizeSave(legacy);hero.weapon=5;assert.equal(normalizeSave(hero),null)});
test('rejects duplicate jobs, unknown jobs and out-of-range gear',()=>{for(const change of [{claimedJobs:['first-steel','first-steel']},{claimedJobs:['unknown']},{ownedWeapons:[0,1,2,3,99]},{weapon:99},{wins:13}])assert.equal(normalizeSave({...normalizeSave(legacy),...change}),null)});
test('ending is only valid after all rivals are defeated',()=>{const hero=normalizeSave(legacy);hero.ending='freedom';assert.equal(normalizeSave(hero),null);hero.wins=12;assert.equal(normalizeSave(hero).ending,'freedom');hero.ending='unknown';assert.equal(normalizeSave(hero),null)});
test('each chapter has three named rivals and a conclusion',()=>{assert.equal(chapters.length,4);assert.equal(opponents.length,12);for(let i=0;i<12;i++)assert.equal(chapterIndex(i),Math.floor(i/3));assert.equal(chapterIndex(12),3);for(const rival of opponents)assert.ok(rival.intro&&rival.quote&&rival.aftermath)});
test('job eligibility follows actual progression and ownership',()=>{const hero=normalizeSave({...legacy,wins:0,weapon:0,armor:0});assert.equal(jobs[0].ready(hero),false);hero.ownedWeapons.push(1);hero.wins=1;assert.equal(jobs[0].ready(hero),true);assert.equal(jobs[1].ready(hero),false);hero.wins=3;assert.equal(jobs[1].ready(hero),true)});
test('invalid and non-finite save fields are rejected',()=>{for(const change of [{gold:NaN},{xp:60},{style:'__proto__'},{name:''},{training:7},{level:0}])assert.equal(normalizeSave({...legacy,...change}),null)});
