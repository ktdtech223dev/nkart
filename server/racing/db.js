/**
 * NKart - Server-side SQLite database layer.
 *
 * Uses better-sqlite3 when available.  If the native module cannot be loaded
 * (e.g. no native build for the current platform), every exported function
 * degrades gracefully: reads return sensible defaults and writes log a
 * warning so the game can still run in a "stateless" mode.
 */

let Database = null;
let db = null;
let useMock = false;

try {
  Database = (await import('better-sqlite3')).default;
} catch (_) {
  useMock = true;
  console.warn('[db] better-sqlite3 not available -- running with in-memory mock (no persistence)');
}

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

function open(filepath) {
  if (useMock) return;
  if (db) return;
  db = new Database(filepath || './nkart.db');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  _createTables();
  _createIndexes();
}

function _createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS kart_players (
      id            TEXT PRIMARY KEY,
      display_name  TEXT NOT NULL,
      total_races   INTEGER NOT NULL DEFAULT 0,
      total_wins    INTEGER NOT NULL DEFAULT 0,
      total_points  INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS kart_track_records (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id     TEXT NOT NULL,
      track_id      TEXT NOT NULL,
      best_lap_time REAL,
      best_race_time REAL,
      race_count    INTEGER NOT NULL DEFAULT 0,
      win_count     INTEGER NOT NULL DEFAULT 0,
      UNIQUE(player_id, track_id)
    );

    CREATE TABLE IF NOT EXISTS kart_cup_records (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id         TEXT NOT NULL,
      cup_id            TEXT NOT NULL,
      best_trophy       TEXT,
      completion_count  INTEGER NOT NULL DEFAULT 0,
      UNIQUE(player_id, cup_id)
    );

    CREATE TABLE IF NOT EXISTS kart_avatar_config (
      player_id       TEXT PRIMARY KEY,
      avatar_id       TEXT NOT NULL DEFAULT 'volta',
      helmet_variant  TEXT,
      suit_primary    TEXT NOT NULL DEFAULT '#FF4D00',
      suit_accent     TEXT NOT NULL DEFAULT '#FFFFFF',
      gloves_variant  TEXT,
      accessory_variant TEXT
    );

    CREATE TABLE IF NOT EXISTS kart_kart_config (
      player_id       TEXT PRIMARY KEY,
      body_variant    TEXT NOT NULL DEFAULT 'classic',
      wheel_variant   TEXT NOT NULL DEFAULT 'standard',
      spoiler_variant TEXT NOT NULL DEFAULT 'none',
      decal_variant   TEXT NOT NULL DEFAULT 'clean'
    );

    CREATE TABLE IF NOT EXISTS kart_unlocks (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id   TEXT NOT NULL,
      unlock_type TEXT NOT NULL,
      unlock_id   TEXT NOT NULL,
      unlocked_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(player_id, unlock_type, unlock_id)
    );

    CREATE TABLE IF NOT EXISTS kart_race_history (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      race_id         TEXT NOT NULL,
      player_id       TEXT NOT NULL,
      track_id        TEXT NOT NULL,
      finish_position INTEGER NOT NULL,
      race_time       REAL,
      points_earned   INTEGER NOT NULL DEFAULT 0,
      raced_at        TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS kart_leaderboard (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      track_id    TEXT NOT NULL,
      player_id   TEXT NOT NULL,
      player_name TEXT NOT NULL,
      lap_time    REAL NOT NULL,
      set_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

function _createIndexes() {
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_leaderboard_track_time
      ON kart_leaderboard (track_id, lap_time ASC);

    CREATE INDEX IF NOT EXISTS idx_track_records_player
      ON kart_track_records (player_id);

    CREATE INDEX IF NOT EXISTS idx_unlocks_player
      ON kart_unlocks (player_id);
  `);
}

function close() {
  if (db) {
    db.close();
    db = null;
  }
}

// ---------------------------------------------------------------------------
// Players
// ---------------------------------------------------------------------------

function getPlayer(playerId) {
  if (useMock) return null;
  return db.prepare('SELECT * FROM kart_players WHERE id = ?').get(playerId) || null;
}

function createPlayer(playerId, displayName) {
  if (useMock) {
    console.warn('[db][mock] createPlayer', playerId, displayName);
    return { id: playerId, display_name: displayName, total_races: 0, total_wins: 0, total_points: 0, created_at: new Date().toISOString() };
  }
  const stmt = db.prepare(`
    INSERT INTO kart_players (id, display_name)
    VALUES (?, ?)
    ON CONFLICT(id) DO UPDATE SET display_name = excluded.display_name
  `);
  stmt.run(playerId, displayName);
  return getPlayer(playerId);
}

function incrementPlayerStats(playerId, races, wins, points) {
  if (useMock) return;
  db.prepare(`
    UPDATE kart_players
    SET total_races = total_races + ?,
        total_wins  = total_wins  + ?,
        total_points = total_points + ?
    WHERE id = ?
  `).run(races, wins, points, playerId);
}

// ---------------------------------------------------------------------------
// Avatar config
// ---------------------------------------------------------------------------

function getAvatarConfig(playerId) {
  if (useMock) return _defaultAvatar(playerId);
  const row = db.prepare('SELECT * FROM kart_avatar_config WHERE player_id = ?').get(playerId);
  return row || _defaultAvatar(playerId);
}

function _defaultAvatar(playerId) {
  return {
    player_id: playerId,
    avatar_id: 'volta',
    helmet_variant: null,
    suit_primary: '#FF4D00',
    suit_accent: '#FFFFFF',
    gloves_variant: null,
    accessory_variant: null,
  };
}

function upsertAvatarConfig(playerId, cfg) {
  if (useMock) {
    console.warn('[db][mock] upsertAvatarConfig', playerId);
    return { ..._defaultAvatar(playerId), ...cfg };
  }
  db.prepare(`
    INSERT INTO kart_avatar_config (player_id, avatar_id, helmet_variant, suit_primary, suit_accent, gloves_variant, accessory_variant)
    VALUES (@player_id, @avatar_id, @helmet_variant, @suit_primary, @suit_accent, @gloves_variant, @accessory_variant)
    ON CONFLICT(player_id) DO UPDATE SET
      avatar_id         = excluded.avatar_id,
      helmet_variant    = excluded.helmet_variant,
      suit_primary      = excluded.suit_primary,
      suit_accent       = excluded.suit_accent,
      gloves_variant    = excluded.gloves_variant,
      accessory_variant = excluded.accessory_variant
  `).run({
    player_id: playerId,
    avatar_id: cfg.avatarId ?? 'volta',
    helmet_variant: cfg.helmetVariant ?? null,
    suit_primary: cfg.suitPrimary ?? '#FF4D00',
    suit_accent: cfg.suitAccent ?? '#FFFFFF',
    gloves_variant: cfg.glovesVariant ?? null,
    accessory_variant: cfg.accessoryVariant ?? null,
  });
  return getAvatarConfig(playerId);
}

// ---------------------------------------------------------------------------
// Kart config
// ---------------------------------------------------------------------------

function getKartConfig(playerId) {
  if (useMock) return _defaultKart(playerId);
  const row = db.prepare('SELECT * FROM kart_kart_config WHERE player_id = ?').get(playerId);
  return row || _defaultKart(playerId);
}

function _defaultKart(playerId) {
  return {
    player_id: playerId,
    body_variant: 'classic',
    wheel_variant: 'standard',
    spoiler_variant: 'none',
    decal_variant: 'clean',
  };
}

function upsertKartConfig(playerId, cfg) {
  if (useMock) {
    console.warn('[db][mock] upsertKartConfig', playerId);
    return { ..._defaultKart(playerId), ...cfg };
  }
  db.prepare(`
    INSERT INTO kart_kart_config (player_id, body_variant, wheel_variant, spoiler_variant, decal_variant)
    VALUES (@player_id, @body_variant, @wheel_variant, @spoiler_variant, @decal_variant)
    ON CONFLICT(player_id) DO UPDATE SET
      body_variant    = excluded.body_variant,
      wheel_variant   = excluded.wheel_variant,
      spoiler_variant = excluded.spoiler_variant,
      decal_variant   = excluded.decal_variant
  `).run({
    player_id: playerId,
    body_variant: cfg.bodyVariant ?? 'classic',
    wheel_variant: cfg.wheelVariant ?? 'standard',
    spoiler_variant: cfg.spoilerVariant ?? 'none',
    decal_variant: cfg.decalVariant ?? 'clean',
  });
  return getKartConfig(playerId);
}

// ---------------------------------------------------------------------------
// Track records
// ---------------------------------------------------------------------------

function getTrackRecords(playerId) {
  if (useMock) return [];
  return db.prepare('SELECT * FROM kart_track_records WHERE player_id = ?').all(playerId);
}

function getTrackRecord(playerId, trackId) {
  if (useMock) return null;
  return db.prepare('SELECT * FROM kart_track_records WHERE player_id = ? AND track_id = ?').get(playerId, trackId) || null;
}

function upsertTrackRecord(playerId, trackId, lapTime, raceTime, won) {
  if (useMock) {
    console.warn('[db][mock] upsertTrackRecord', playerId, trackId);
    return;
  }
  const existing = getTrackRecord(playerId, trackId);
  if (!existing) {
    db.prepare(`
      INSERT INTO kart_track_records (player_id, track_id, best_lap_time, best_race_time, race_count, win_count)
      VALUES (?, ?, ?, ?, 1, ?)
    `).run(playerId, trackId, lapTime, raceTime, won ? 1 : 0);
  } else {
    const bestLap = (lapTime !== null && (existing.best_lap_time === null || lapTime < existing.best_lap_time))
      ? lapTime : existing.best_lap_time;
    const bestRace = (raceTime !== null && (existing.best_race_time === null || raceTime < existing.best_race_time))
      ? raceTime : existing.best_race_time;
    db.prepare(`
      UPDATE kart_track_records
      SET best_lap_time  = ?,
          best_race_time = ?,
          race_count     = race_count + 1,
          win_count      = win_count + ?
      WHERE player_id = ? AND track_id = ?
    `).run(bestLap, bestRace, won ? 1 : 0, playerId, trackId);
  }
}

// ---------------------------------------------------------------------------
// Cup records
// ---------------------------------------------------------------------------

function getCupRecords(playerId) {
  if (useMock) return [];
  return db.prepare('SELECT * FROM kart_cup_records WHERE player_id = ?').all(playerId);
}

function upsertCupRecord(playerId, cupId, trophy) {
  if (useMock) {
    console.warn('[db][mock] upsertCupRecord', playerId, cupId, trophy);
    return;
  }
  const trophyRanks = { gold: 3, silver: 2, bronze: 1 };
  const existing = db.prepare('SELECT * FROM kart_cup_records WHERE player_id = ? AND cup_id = ?').get(playerId, cupId);
  if (!existing) {
    db.prepare(`
      INSERT INTO kart_cup_records (player_id, cup_id, best_trophy, completion_count)
      VALUES (?, ?, ?, 1)
    `).run(playerId, cupId, trophy);
  } else {
    const currentRank = trophyRanks[existing.best_trophy] || 0;
    const newRank = trophyRanks[trophy] || 0;
    const bestTrophy = newRank > currentRank ? trophy : existing.best_trophy;
    db.prepare(`
      UPDATE kart_cup_records
      SET best_trophy      = ?,
          completion_count = completion_count + 1
      WHERE player_id = ? AND cup_id = ?
    `).run(bestTrophy, playerId, cupId);
  }
}

// ---------------------------------------------------------------------------
// Unlocks
// ---------------------------------------------------------------------------

function getUnlocks(playerId) {
  if (useMock) return [];
  return db.prepare('SELECT * FROM kart_unlocks WHERE player_id = ? ORDER BY unlocked_at DESC').all(playerId);
}

function hasUnlock(playerId, unlockType, unlockId) {
  if (useMock) return false;
  const row = db.prepare('SELECT 1 FROM kart_unlocks WHERE player_id = ? AND unlock_type = ? AND unlock_id = ?').get(playerId, unlockType, unlockId);
  return !!row;
}

function grantUnlock(playerId, unlockType, unlockId) {
  if (useMock) {
    console.warn('[db][mock] grantUnlock', playerId, unlockType, unlockId);
    return false;
  }
  try {
    db.prepare(`
      INSERT INTO kart_unlocks (player_id, unlock_type, unlock_id)
      VALUES (?, ?, ?)
    `).run(playerId, unlockType, unlockId);
    return true;
  } catch (e) {
    // UNIQUE constraint -- already unlocked
    return false;
  }
}

// ---------------------------------------------------------------------------
// Race history
// ---------------------------------------------------------------------------

function addRaceHistory(raceId, playerId, trackId, finishPosition, raceTime, pointsEarned) {
  if (useMock) {
    console.warn('[db][mock] addRaceHistory', raceId, playerId, trackId, finishPosition);
    return;
  }
  db.prepare(`
    INSERT INTO kart_race_history (race_id, player_id, track_id, finish_position, race_time, points_earned)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(raceId, playerId, trackId, finishPosition, raceTime, pointsEarned);
}

function getPlayerHistory(playerId, limit) {
  if (useMock) return [];
  return db.prepare('SELECT * FROM kart_race_history WHERE player_id = ? ORDER BY raced_at DESC LIMIT ?').all(playerId, limit || 50);
}

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------

function getTrackLeaderboard(trackId, limit) {
  if (useMock) return [];
  return db.prepare(`
    SELECT * FROM kart_leaderboard
    WHERE track_id = ?
    ORDER BY lap_time ASC
    LIMIT ?
  `).all(trackId, limit || 10);
}

function getGlobalLeaderboard(limit) {
  if (useMock) return [];
  return db.prepare(`
    SELECT id, display_name, total_points, total_races, total_wins
    FROM kart_players
    ORDER BY total_points DESC
    LIMIT ?
  `).all(limit || 10);
}

function submitLapTime(trackId, playerId, playerName, lapTime) {
  if (useMock) {
    console.warn('[db][mock] submitLapTime', trackId, playerId, lapTime);
    return;
  }
  // Keep only best lap per player per track
  const existing = db.prepare(`
    SELECT id, lap_time FROM kart_leaderboard
    WHERE track_id = ? AND player_id = ?
  `).get(trackId, playerId);

  if (!existing) {
    db.prepare(`
      INSERT INTO kart_leaderboard (track_id, player_id, player_name, lap_time)
      VALUES (?, ?, ?, ?)
    `).run(trackId, playerId, playerName, lapTime);
  } else if (lapTime < existing.lap_time) {
    db.prepare(`
      UPDATE kart_leaderboard
      SET lap_time    = ?,
          player_name = ?,
          set_at      = datetime('now')
      WHERE id = ?
    `).run(lapTime, playerName, existing.id);
  }
}

// ---------------------------------------------------------------------------
// Unlock condition evaluator
// ---------------------------------------------------------------------------

const UNLOCK_CONDITIONS = [
  // Milestones
  { type: 'avatar', id: 'chrome',      check: (p) => p.total_races >= 50 },
  { type: 'avatar', id: 'phantom',     check: (p) => p.total_wins >= 25 },
  { type: 'avatar', id: 'neon',        check: (p) => p.total_points >= 500 },
  { type: 'kart_body', id: 'turbo',    check: (p) => p.total_races >= 20 },
  { type: 'kart_body', id: 'retro',    check: (p) => p.total_wins >= 10 },
  { type: 'kart_body', id: 'stealth',  check: (p) => p.total_points >= 300 },
  { type: 'wheel', id: 'offroad',      check: (p) => p.total_races >= 10 },
  { type: 'wheel', id: 'slick',        check: (p) => p.total_wins >= 5 },
  { type: 'wheel', id: 'cyber',        check: (p) => p.total_points >= 200 },
  { type: 'spoiler', id: 'high_wing',  check: (p) => p.total_races >= 30 },
  { type: 'spoiler', id: 'fin',        check: (p) => p.total_wins >= 15 },
  { type: 'decal', id: 'flames',       check: (p) => p.total_races >= 5 },
  { type: 'decal', id: 'lightning',    check: (p) => p.total_wins >= 3 },
  { type: 'decal', id: 'galaxy',       check: (p) => p.total_points >= 100 },
  { type: 'helmet', id: 'visor',       check: (p) => p.total_races >= 15 },
  { type: 'helmet', id: 'crown',       check: (p) => p.total_wins >= 50 },
  { type: 'gloves', id: 'racing',      check: (p) => p.total_races >= 8 },
  { type: 'gloves', id: 'tech',        check: (p) => p.total_points >= 150 },
  { type: 'accessory', id: 'scarf',    check: (p) => p.total_races >= 25 },
  { type: 'accessory', id: 'antenna',  check: (p) => p.total_wins >= 20 },
];

function checkAndGrantUnlocks(playerId) {
  if (useMock) return [];
  const player = getPlayer(playerId);
  if (!player) return [];

  const newUnlocks = [];
  for (const cond of UNLOCK_CONDITIONS) {
    if (cond.check(player) && !hasUnlock(playerId, cond.type, cond.id)) {
      const granted = grantUnlock(playerId, cond.type, cond.id);
      if (granted) {
        newUnlocks.push({ type: cond.type, id: cond.id });
      }
    }
  }
  return newUnlocks;
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export {
  open,
  close,
  getPlayer,
  createPlayer,
  incrementPlayerStats,
  getAvatarConfig,
  upsertAvatarConfig,
  getKartConfig,
  upsertKartConfig,
  getTrackRecords,
  getTrackRecord,
  upsertTrackRecord,
  getCupRecords,
  upsertCupRecord,
  getUnlocks,
  hasUnlock,
  grantUnlock,
  addRaceHistory,
  getPlayerHistory,
  getTrackLeaderboard,
  getGlobalLeaderboard,
  submitLapTime,
  checkAndGrantUnlocks,
};
