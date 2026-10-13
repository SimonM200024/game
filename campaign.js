/* Story and equipment data are shared by the game and its save-migration tests. */
(function (root) {
  'use strict';
  const chapters = [
    { name: 'A Name in the Dust', town: 'Redhaven', arena: 'The Sunbleached Pit', badge: 'THE COPPER SEAL', mentor: 'Tessa Rook · Arena keeper', intro: 'You arrive in Redhaven with a debt stamped into your papers. Tessa offers a way out: win the Copper Seal, and the city must register you as a free contender.', goal: 'Earn a name. Defeat the three fighters of the Copper Trial.', rumor: 'Mara used to fight for the magistrate. If she tells you something after your bout, listen.', after: 'The Copper Seal buys you passage to Highcourt. It does not buy freedom. The fine print bears one name: Varrus.' },
    { name: 'The Price of Applause', town: 'Highcourt', arena: 'The Gilded Colosseum', badge: 'THE LAUREL OF HIGHCOURT', mentor: 'Mara Quickblade · An unlikely ally', intro: 'Highcourt is all marble and cheering crowds. Beneath it, the same debt seals bind every fighter. Mara suspects the tournament’s patron is fixing more than the odds.', goal: 'Reach Aurelius and discover who owns the tournament.', rumor: 'Aurelius keeps a sealed ledger beneath his trophy stand. They say it matters more to him than his crown.', after: 'Aurelius yields his laurel—and a page torn from Varrus’s ledger. It lists fighters sold to the Cinder Coast. Mara’s brother is among them.' },
    { name: 'Blood on the Ledger', town: 'Cinderport', arena: 'The Ashring', badge: 'THE ASHEN KEY', mentor: 'Brann Ironhand · Blacksmith', intro: 'Follow the stolen ledger to Cinderport. Its arena is a marketplace for people, and its champion holds the key to the prison quay. Brann follows you with his traveling forge.', goal: 'Win the Ashen Key and free the fighters at the prison quay.', rumor: 'Serra guards the quay because Varrus holds her daughter’s papers. She is an opponent, not your enemy.', after: 'The prison doors open. Serra’s daughter and Mara’s brother walk free. In the ledger you find the original debt charter, sealed by Varrus himself.' },
    { name: 'The Unbroken', town: 'Dawnspire', arena: 'The Crown Arena', badge: 'THE BROKEN CROWN', mentor: 'Tessa Rook · Your oldest supporter', intro: 'You enter Dawnspire carrying proof of the debt trade. Varrus invokes the old law: only an undefeated champion may challenge a patron before the crowd. Three bouts remain.', goal: 'Face Varrus in public. Decide what the arena becomes.', rumor: 'Cassia has never bowed to a patron. Defeat her fairly and she will stand with you when the crowd must choose.', after: 'Varrus falls, and the crowd falls silent. His debt charter is yours. For the first time, the next move belongs to the fighters.' }
  ];
  const opponents = [
    { name: 'Grit the Unwashed', title: 'The gatekeeper', hp: 65, attack: 12, defense: 2, energy: 6, gold: 38, xp: 35, color: '#8b8052', style: 'soldier', intro: 'The gate guard laughs at your borrowed blade. Tessa quietly presses your first entry token into your palm.', quote: 'Everyone starts in the dirt. Most stay there.', aftermath: 'Grit offers a grudging salute. The crowd has learned your name.' },
    { name: 'Mara Quickblade', title: 'The runaway blade', hp: 90, attack: 17, defense: 3, energy: 9, gold: 50, xp: 40, color: '#477b7a', style: 'duelist', intro: 'Mara fights with a magistrate’s crest scratched off her shield. She recognizes the seal on your debt papers.', quote: 'Win this honestly. I need to know someone still can.', aftermath: 'Mara tells you to seek her in Highcourt. “The seals are a lie,” she whispers.' },
    { name: 'Boulder', title: 'Champion of the pit', hp: 132, attack: 23, defense: 4, energy: 6, gold: 65, xp: 45, color: '#99613e', style: 'brute', intro: 'The Copper Seal hangs above the gate. Boulder has held it for five years. He looks almost relieved to see a challenger.', quote: 'Take the seal, little one. But earn it.', aftermath: 'Boulder places the Copper Seal in your hand. Redhaven opens its gates.' },
    { name: 'The Copper Fang', title: 'The patron’s favorite', hp: 145, attack: 25, defense: 6, energy: 9, gold: 80, xp: 50, color: '#b98346', style: 'soldier', intro: 'A steward offers you gold to lose. When you refuse, he sends the Copper Fang to explain how Highcourt works.', quote: 'The crowd cheers whoever they’re told to cheer.', aftermath: 'The steward leaves before the final salute. Mara smiles from the stands.' },
    { name: 'Nyx of the Dunes', title: 'The silent witness', hp: 155, attack: 29, defense: 6, energy: 11, gold: 100, xp: 55, color: '#716386', style: 'duelist', intro: 'Nyx has seen fighters disappear after their victories. She promises you a name if you can stay standing.', quote: 'Do not mistake silence for loyalty.', aftermath: 'Nyx names Cinderport. “Ask Aurelius about the ships.”' },
    { name: 'Aurelius the Golden', title: 'Highcourt’s champion', hp: 195, attack: 32, defense: 8, energy: 10, gold: 150, xp: 75, color: '#b79a43', style: 'soldier', intro: 'Aurelius has worn his crown long enough to know what it costs. He brings a sealed page into the arena.', quote: 'If you take my laurel, take my burden too.', aftermath: 'Aurelius kneels, offering you the ledger page instead of his sword.' },
    { name: 'Kestrel Saltknife', title: 'The dockside duelist', hp: 220, attack: 34, defense: 9, energy: 11, gold: 120, xp: 65, color: '#3d7c88', style: 'duelist', intro: 'Cinderport demands an arena token before you may enter the prison district. Kestrel collects those tokens—and grudges.', quote: 'Nothing crosses these docks for free.', aftermath: 'You win passage to the prison district. Kestrel points you toward the gaoler.' },
    { name: 'Rook the Gaoler', title: 'Keeper of the chains', hp: 250, attack: 38, defense: 10, energy: 8, gold: 140, xp: 70, color: '#655d58', style: 'brute', intro: 'Rook wears keys like medals. He offers to add your name to the prison book before the fight even begins.', quote: 'I already have a cell picked out for you.', aftermath: 'Rook’s keys spill across the sand. Only the champion’s lock remains.' },
    { name: 'Serra Ashqueen', title: 'The unwilling warden', hp: 275, attack: 40, defense: 12, energy: 11, gold: 175, xp: 80, color: '#a64f42', style: 'soldier', intro: 'Serra cannot surrender the Ashen Key without condemning her daughter. An honest defeat is the only way to break her oath.', quote: 'Fight me properly. Give them no excuse to punish her.', aftermath: 'Serra unlocks the quay herself. This time, nobody is left behind.' },
    { name: 'Decimus the Lion', title: 'Shield of Dawnspire', hp: 300, attack: 42, defense: 13, energy: 10, gold: 180, xp: 85, color: '#bd914d', style: 'brute', intro: 'The Crown Arena opens once a year. Decimus bars the first step, sworn to protect the city from anyone carrying a grievance.', quote: 'Proof is paper. Let us see what you are made of.', aftermath: 'Decimus reads the ledger. He does not return to Varrus’s box.' },
    { name: 'Cassia No-Chains', title: 'The people’s champion', hp: 330, attack: 45, defense: 14, energy: 12, gold: 200, xp: 90, color: '#586e84', style: 'duelist', intro: 'Cassia has fought for years to change the arena from within. She will support you—but not an untested promise.', quote: 'Show me you can carry more than a crown.', aftermath: 'Cassia raises your hand before the crowd. Varrus can no longer refuse your challenge.' },
    { name: 'Lord Varrus', title: 'The keeper of debts', hp: 375, attack: 49, defense: 15, energy: 12, gold: 250, xp: 100, color: '#6e456f', style: 'soldier', intro: 'Varrus descends from his private box wearing the armor of a former champion. The original charter hangs from his belt.', quote: 'You think freedom is won with a sword? I wrote the rules.', aftermath: 'The charter lands in the sand. The arena waits for your judgment.' }
  ];
  const catalog = {
    weapon: [
      { name: 'Borrowed blade', cost: 0, attack: 0, unlock: 0, flavor: 'Not pretty. Still sharp enough to begin.' },
      { name: 'Iron sword', cost: 35, attack: 3, unlock: 0, flavor: 'Brann’s honest work. A proper first sword.' },
      { name: 'Steel gladius', cost: 75, attack: 7, unlock: 2, flavor: 'Balanced steel for a contender with a name.' },
      { name: 'Laurel’s Edge', cost: 120, attack: 12, unlock: 4, flavor: 'Made for the fighters Highcourt cannot buy.' },
      { name: 'Cindersteel', cost: 170, attack: 18, unlock: 6, flavor: 'Tempered in the traveling forge at Cinderport.' },
      { name: 'Oathbreaker', cost: 240, attack: 25, unlock: 9, flavor: 'A blade for cutting chains, not keeping them.' }
    ],
    armor: [
      { name: 'Pit leathers', cost: 0, defense: 0, hp: 0, unlock: 0, flavor: 'A borrowed tunic and a stubborn heart.' },
      { name: 'Leather & bronze', cost: 30, defense: 2, hp: 10, unlock: 0, flavor: 'Patched by hand. Built to take the next hit.' },
      { name: 'Arena plate', cost: 65, defense: 5, hp: 20, unlock: 2, flavor: 'A contender’s breastplate, fitted by Brann.' },
      { name: 'Laurel guard', cost: 110, defense: 9, hp: 30, unlock: 4, flavor: 'The shine is for the crowd. The steel is for you.' },
      { name: 'Ashforged mail', cost: 155, defense: 13, hp: 40, unlock: 6, flavor: 'Light rings over sturdy bronze plates.' },
      { name: 'Unbroken plate', cost: 220, defense: 18, hp: 55, unlock: 9, flavor: 'No patron’s crest. Only your own colors.' }
    ],
    shield: [
      { name: 'Worn buckler', cost: 0, defense: 0, hp: 0, unlock: 0, flavor: 'Small enough to carry. Better than nothing.' },
      { name: 'Redhaven roundshield', cost: 45, defense: 2, hp: 5, unlock: 0, flavor: 'Oak, bronze, and one more reason to stand.' },
      { name: 'Highcourt aegis', cost: 100, defense: 4, hp: 10, unlock: 3, flavor: 'A shield that has outlasted three owners.' },
      { name: 'Dawnward', cost: 180, defense: 7, hp: 15, unlock: 6, flavor: 'For the final road and everyone walking it with you.' }
    ]
  };
  const jobs = [
    { id: 'first-steel', name: 'Brann’s First Commission', description: 'Own a forged weapon and win your first bout.', gold: 30, ready: hero => hero.ownedWeapons.some(tier => tier > 0) && hero.wins >= 1 },
    { id: 'copper-seal', name: 'A Name Worth Betting On', description: 'Win the Copper Seal by defeating Boulder.', gold: 45, ready: hero => hero.wins >= 3 },
    { id: 'laurel', name: 'Mira’s Long Bet', description: 'Defeat Aurelius and bring news from Highcourt.', gold: 65, ready: hero => hero.wins >= 6 },
    { id: 'free-quay', name: 'No One Left Behind', description: 'Win the Ashen Key and free the prison quay.', gold: 90, ready: hero => hero.wins >= 9 }
  ];
  const endings = {
    freedom: { title: 'No More Chains', text: 'You tear the debt charter before the crowd. Tessa opens the gates, Mara finds her brother, and the fighters leave as free people. Your name becomes a promise: no victory is worth another person’s chains.' },
    rebuild: { title: 'An Arena of Our Own', text: 'You place the charter in the hands of the fighters and abolish every inherited debt. Cassia forms a council, Brann opens a permanent forge, and the first freely chosen tournament begins. The arena belongs to those who enter it.' }
  };
  function chapterIndex(wins) { return Math.min(3, Math.floor(wins / 3)); }
  function normalizeSave(data) {
    if (!data || ![1, 2].includes(data.version) || typeof data.name !== 'string' || !data.name.trim() || data.name.length > 20 || !['soldier', 'brute', 'duelist'].includes(data.style) || !['rust', 'teal', 'purple'].includes(data.color)) return null;
    for (const key of ['gold', 'xp', 'wins', 'level', 'weapon', 'armor', 'training']) if (!Number.isInteger(data[key]) || data[key] < 0) return null;
    if (data.wins > (data.version === 1 ? 6 : 12) || data.level < 1 || data.level > 30 || data.gold > 100000 || data.xp >= 60 || data.weapon > 5 || data.armor > 5 || data.training > 6) return null;
    if (data.version === 1 && (data.weapon > 3 || data.armor > 3 || data.training > 3)) return null;
    const hero = Object.fromEntries(['name', 'style', 'color', 'gold', 'xp', 'wins', 'level', 'weapon', 'armor', 'training'].map(key => [key, data[key]]));
    hero.version = 2;
    if (data.version === 1) {
      hero.shield = 0; hero.ownedWeapons = Array.from({ length: data.weapon + 1 }, (_, i) => i); hero.ownedArmor = Array.from({ length: data.armor + 1 }, (_, i) => i); hero.ownedShields = [0]; hero.claimedJobs = []; hero.ending = null;
    } else {
      if (!Number.isInteger(data.shield) || data.shield < 0 || data.shield > 3) return null;
      hero.shield = data.shield;
      for (const [key, max, equipped] of [['ownedWeapons', 5, hero.weapon], ['ownedArmor', 5, hero.armor], ['ownedShields', 3, hero.shield]]) {
        const list = data[key];
        if (!Array.isArray(list) || list.length > max + 1 || !list.includes(0) || !list.includes(equipped) || list.some(tier => !Number.isInteger(tier) || tier < 0 || tier > max) || new Set(list).size !== list.length) return null;
        hero[key] = [...list];
      }
      if (!Array.isArray(data.claimedJobs) || data.claimedJobs.length > jobs.length || data.claimedJobs.some(id => !jobs.some(job => job.id === id)) || new Set(data.claimedJobs).size !== data.claimedJobs.length) return null;
      hero.claimedJobs = [...data.claimedJobs];
      if (data.ending !== null && (!Object.hasOwn(endings, data.ending) || hero.wins !== 12)) return null;
      hero.ending = data.ending;
    }
    return hero;
  }
  const api = { chapters, opponents, catalog, jobs, endings, chapterIndex, normalizeSave };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.GloryCampaign = api;
})(globalThis);
