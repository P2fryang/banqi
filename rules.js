// Rulesets are plain data. Types: G general, A advisor, E elephant, R chariot, H horse, C cannon, S soldier.
// rank: higher beats lower, equal can capture equal. For the cannon this is its *defending* rank.
// beats: exceptions to the rank comparison, "attacker>defender": true/false.
// cannonJumps: cannon captures any piece by jumping exactly one screen (and can't capture adjacent pieces).
// endOnGeneral: capturing a general ends the game immediately.
const TAIWAN = {
  name: 'Taiwanese',
  counts: { G: 1, A: 2, E: 2, R: 2, H: 2, C: 2, S: 5 },
  rank: { G: 7, A: 6, E: 5, R: 4, H: 3, C: 2, S: 1 },
  beats: { 'G>S': false, 'S>G': true },
  cannonJumps: true,
  endOnGeneral: false,
};
const MAINLAND = { ...TAIWAN, name: 'Mainland', cannonJumps: false };
const HONGKONG = { ...MAINLAND, name: 'Hong Kong', rank: { G: 7, R: 6, H: 5, C: 4, A: 3, E: 2, S: 1 } };
const RULESETS = { taiwan: TAIWAN, mainland: MAINLAND, hongkong: HONGKONG };
