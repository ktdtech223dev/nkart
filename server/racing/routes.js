const express = require('express');
const { evaluateUnlocks } = require('./unlocks');

function createKartRoutes(db) {
  const router = express.Router();

  router.use((req, res, next) => {
    req.playerId = req.headers.authorization?.replace('Bearer ', '') || req.query.token || 'default_player';
    next();
  });

  router.get('/profile', (req, res) => {
    try {
      const playerId = req.playerId;
      const player = db.prepare('SELECT * FROM kart_players WHERE id = ?').get(playerId);
      if (!player) return res.status(404).json({ error: 'Profile not found' });
      const avatar = db.prepare('SELECT * FROM kart_avatar_config WHERE player_id = ?').get(playerId);
      const kart = db.prepare('SELECT * FROM kart_kart_config WHERE player_id = ?').get(playerId);
      const unlocks = db.prepare('SELECT unlock_type, unlock_id FROM kart_unlocks WHERE player_id = ?').all(playerId);
      const cupRecords = db.prepare('SELECT * FROM kart_cup_records WHERE player_id = ?').all(playerId);
      const trackRecords = db.prepare('SELECT * FROM kart_track_records WHERE player_id = ?').all(playerId);
      res.json({ ...player, avatar: avatar || {}, kart: kart || {}, unlocks, cupRecords, trackRecords });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  router.post('/profile', (req, res) => {
    try {
      const playerId = req.playerId;
      const { displayName } = req.body;
      db.prepare('INSERT OR IGNORE INTO kart_players (id, display_name) VALUES (?, ?)').run(playerId, displayName || 'Racer');
      db.prepare('INSERT OR IGNORE INTO kart_avatar_config (player_id) VALUES (?)').run(playerId);
      db.prepare('INSERT OR IGNORE INTO kart_kart_config (player_id) VALUES (?)').run(playerId);
      const defaults = [
        ['avatar','volta'],['avatar','cinder'],['avatar','echo'],['avatar','terra'],['avatar','nova'],['avatar','surge'],
        ['body','classic'],['body','muscle'],['wheels','standard'],['wheels','slick'],
        ['spoiler','none'],['spoiler','standard_wing'],['decal','clean'],['decal','lightning'],['decal','flame'],
      ];
      const ins = db.prepare('INSERT OR IGNORE INTO kart_unlocks (player_id, unlock_type, unlock_id) VALUES (?, ?, ?)');
      for (const [t, id] of defaults) ins.run(playerId, t, id);
      res.json(db.prepare('SELECT * FROM kart_players WHERE id = ?').get(playerId));
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  router.put('/avatar', (req, res) => {
    try {
      const p = req.playerId;
      const b = req.body;
      db.prepare(`UPDATE kart_avatar_config SET avatar_id=COALESCE(?,avatar_id),helmet_variant=COALESCE(?,helmet_variant),suit_primary=COALESCE(?,suit_primary),suit_accent=COALESCE(?,suit_accent),gloves_variant=COALESCE(?,gloves_variant),accessory_variant=COALESCE(?,accessory_variant) WHERE player_id=?`)
        .run(b.avatar_id,b.helmet_variant,b.suit_primary,b.suit_accent,b.gloves_variant,b.accessory_variant,p);
      res.json(db.prepare('SELECT * FROM kart_avatar_config WHERE player_id = ?').get(p));
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  router.put('/kart', (req, res) => {
    try {
      const p = req.playerId;
      const b = req.body;
      db.prepare(`UPDATE kart_kart_config SET body_variant=COALESCE(?,body_variant),wheel_variant=COALESCE(?,wheel_variant),spoiler_variant=COALESCE(?,spoiler_variant),decal_variant=COALESCE(?,decal_variant) WHERE player_id=?`)
        .run(b.body_variant,b.wheel_variant,b.spoiler_variant,b.decal_variant,p);
      res.json(db.prepare('SELECT * FROM kart_kart_config WHERE player_id = ?').get(p));
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  router.get('/leaderboard/global', (req, res) => {
    try {
      res.json(db.prepare('SELECT id,display_name,total_points,total_wins,total_races FROM kart_players ORDER BY total_points DESC LIMIT 10').all());
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  router.get('/leaderboard/:trackId', (req, res) => {
    try {
      res.json(db.prepare('SELECT player_name,lap_time,set_at FROM kart_leaderboard WHERE track_id=? ORDER BY lap_time ASC LIMIT 10').all(req.params.trackId));
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  router.post('/race/complete', (req, res) => {
    try {
      const p = req.playerId;
      const { raceId, trackId, finishPosition, raceTime, bestLapTime, pointsEarned } = req.body;
      const rid = raceId || Date.now().toString(36) + Math.random().toString(36).slice(2,8);
      db.prepare('INSERT INTO kart_race_history (race_id,player_id,track_id,finish_position,race_time,points_earned) VALUES (?,?,?,?,?,?)').run(rid,p,trackId,finishPosition,raceTime,pointsEarned||0);
      db.prepare('UPDATE kart_players SET total_races=total_races+1,total_points=total_points+?,total_wins=total_wins+? WHERE id=?').run(pointsEarned||0,finishPosition===1?1:0,p);
      db.prepare(`INSERT INTO kart_track_records (player_id,track_id,best_lap_time,best_race_time,race_count,win_count) VALUES (?,?,?,?,1,?) ON CONFLICT(player_id,track_id) DO UPDATE SET best_lap_time=MIN(COALESCE(best_lap_time,?),?),best_race_time=MIN(COALESCE(best_race_time,?),?),race_count=race_count+1,win_count=win_count+?`)
        .run(p,trackId,bestLapTime,raceTime,finishPosition===1?1:0,bestLapTime,bestLapTime,raceTime,raceTime,finishPosition===1?1:0);
      if (bestLapTime) {
        const name = db.prepare('SELECT display_name FROM kart_players WHERE id=?').get(p)?.display_name||'Unknown';
        const ex = db.prepare('SELECT lap_time FROM kart_leaderboard WHERE track_id=? AND player_id=?').get(trackId,p);
        if (!ex||bestLapTime<ex.lap_time) {
          db.prepare('DELETE FROM kart_leaderboard WHERE track_id=? AND player_id=?').run(trackId,p);
          db.prepare('INSERT INTO kart_leaderboard (track_id,player_id,player_name,lap_time) VALUES (?,?,?,?)').run(trackId,p,name,bestLapTime);
        }
      }
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  router.get('/cups', (req, res) => {
    try { res.json(db.prepare('SELECT * FROM kart_cup_records WHERE player_id=?').all(req.playerId)); }
    catch (err) { res.status(500).json({ error: err.message }); }
  });

  router.post('/cup/complete', (req, res) => {
    try {
      const p = req.playerId;
      const { cupId, trophy } = req.body;
      const ex = db.prepare('SELECT * FROM kart_cup_records WHERE player_id=? AND cup_id=?').get(p, cupId);
      if (ex) {
        const rank = {gold:3,silver:2,bronze:1};
        const best = (rank[trophy]||0)>(rank[ex.best_trophy]||0)?trophy:ex.best_trophy;
        db.prepare('UPDATE kart_cup_records SET best_trophy=?,completion_count=completion_count+1 WHERE player_id=? AND cup_id=?').run(best,p,cupId);
      } else {
        db.prepare('INSERT INTO kart_cup_records (player_id,cup_id,best_trophy,completion_count) VALUES (?,?,?,1)').run(p,cupId,trophy);
      }
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  router.get('/unlocks', (req, res) => {
    try { res.json(db.prepare('SELECT unlock_type,unlock_id,unlocked_at FROM kart_unlocks WHERE player_id=?').all(req.playerId)); }
    catch (err) { res.status(500).json({ error: err.message }); }
  });

  router.post('/unlock/check', (req, res) => {
    try { res.json({ newUnlocks: evaluateUnlocks(db, req.playerId) }); }
    catch (err) { res.status(500).json({ error: err.message }); }
  });

  return router;
}

module.exports = { createKartRoutes };
