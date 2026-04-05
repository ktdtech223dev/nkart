const UNLOCK_TREE = [
  // Dorm Cup
  { condition: { cup: 'dorm', requirement: 'complete' }, rewards: [['body', 'bubble'], ['wheels', 'offroad'], ['decal', 'dorm_life']] },
  { condition: { cup: 'dorm', requirement: 'gold' }, rewards: [['spoiler', 'high_wing'], ['avatar', 'rift']] },
  // Pirate Cup
  { condition: { cup: 'pirate', requirement: 'complete' }, rewards: [['body', 'pipe'], ['wheels', 'wooden'], ['decal', 'pirate_flag']] },
  { condition: { cup: 'pirate', requirement: 'gold' }, rewards: [['spoiler', 'twin_wing'], ['decal', 'grand_line']] },
  // City Cup
  { condition: { cup: 'city', requirement: 'complete' }, rewards: [['body', 'wedge'], ['wheels', 'cyber'], ['decal', 'circuit']] },
  { condition: { cup: 'city', requirement: 'gold' }, rewards: [['spoiler', 'tri_wing'], ['decal', 'checker']] },
  // Nature Cup
  { condition: { cup: 'nature', requirement: 'complete' }, rewards: [['body', 'flat'], ['wheels', 'cloud'], ['decal', 'vines']] },
  { condition: { cup: 'nature', requirement: 'gold' }, rewards: [['spoiler', 'dragon_fin'], ['decal', 'waves']] },
  // Arcade Cup
  { condition: { cup: 'arcade', requirement: 'complete' }, rewards: [['body', 'wing'], ['wheels', 'crystal'], ['decal', 'glitch']] },
  { condition: { cup: 'arcade', requirement: 'gold' }, rewards: [['spoiler', 'circuit_board'], ['wheels', 'pixel']] },
  // Volcano Cup
  { condition: { cup: 'volcano', requirement: 'complete' }, rewards: [['body', 'box'], ['wheels', 'spike'], ['decal', 'camo']] },
  { condition: { cup: 'volcano', requirement: 'gold' }, rewards: [['spoiler', 'flame_tail'], ['decal', 'dragon']] },
  // Space Cup
  { condition: { cup: 'space', requirement: 'complete' }, rewards: [['body', 'dragon'], ['wheels', 'chrome'], ['decal', 'stars']] },
  { condition: { cup: 'space', requirement: 'gold' }, rewards: [['spoiler', 'antenna_array'], ['decal', 'n_games_logo']] },
  // All 7 Standard Cups Gold
  { condition: { requirement: 'all_7_gold' }, rewards: [['cup', 'shadow'], ['avatar', 'phantom'], ['body', 'phantom'], ['wheels', 'donut']] },
  // Shadow Cup
  { condition: { cup: 'shadow', requirement: 'complete' }, rewards: [['body', 'circuit'], ['spoiler', 'shadow_shroud'], ['decal', 'void_cracks']] },
  { condition: { cup: 'shadow', requirement: 'gold' }, rewards: [['body', 'void'], ['wheels', 'shadow']] },
];

const STANDARD_CUPS = ['dorm', 'pirate', 'city', 'nature', 'arcade', 'volcano', 'space'];

function evaluateUnlocks(db, playerId) {
  const existing = db.prepare('SELECT unlock_type, unlock_id FROM kart_unlocks WHERE player_id = ?').all(playerId);
  const existingSet = new Set(existing.map(u => `${u.unlock_type}:${u.unlock_id}`));
  const cupRecords = db.prepare('SELECT * FROM kart_cup_records WHERE player_id = ?').all(playerId);
  const cupMap = {};
  for (const r of cupRecords) cupMap[r.cup_id] = r;

  const newUnlocks = [];
  const insertUnlock = db.prepare('INSERT OR IGNORE INTO kart_unlocks (player_id, unlock_type, unlock_id) VALUES (?, ?, ?)');

  for (const entry of UNLOCK_TREE) {
    const { condition, rewards } = entry;
    let met = false;

    if (condition.requirement === 'all_7_gold') {
      met = STANDARD_CUPS.every(cup => cupMap[cup] && cupMap[cup].best_trophy === 'gold');
    } else if (condition.cup) {
      const record = cupMap[condition.cup];
      if (condition.requirement === 'complete') {
        met = record && record.completion_count > 0;
      } else if (condition.requirement === 'gold') {
        met = record && record.best_trophy === 'gold';
      }
    }

    if (met) {
      for (const [type, id] of rewards) {
        const key = `${type}:${id}`;
        if (!existingSet.has(key)) {
          insertUnlock.run(playerId, type, id);
          existingSet.add(key);
          newUnlocks.push({ type, id });
        }
      }
    }
  }

  return newUnlocks;
}

module.exports = { evaluateUnlocks, UNLOCK_TREE };
