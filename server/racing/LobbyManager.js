/**
 * NKart - In-memory lobby / room management.
 *
 * Manages the lifecycle of multiplayer rooms:  create, join, leave, ready,
 * start-race, disconnect handling, host migration, and auto-cleanup.
 *
 * Max 8 racers per room.  When the host starts the race any empty slots are
 * filled with bots.  If a human disconnects mid-race their kart converts to
 * a bot.  When the host leaves, the next player (by join order) becomes host.
 * Rooms auto-destroy 5 minutes after a race ends (or immediately if empty).
 */

const crypto = require('node:crypto');

const MAX_PLAYERS = 8;
const ROOM_AUTO_DESTROY_MS = 5 * 60 * 1000; // 5 minutes

const BOT_NAMES = [
  'Bolt',   'Pixel',  'Turbo',  'Blitz',
  'Nitro',  'Spark',  'Flash',  'Drift',
  'Vroom',  'Zippy',  'Rocket', 'Jet',
  'Flame',  'Skid',   'Burn',   'Dust',
];

function uid() {
  return crypto.randomBytes(6).toString('hex');
}

class LobbyManager {
  constructor() {
    /** @type {Map<string, Room>} */
    this.rooms = new Map();
    /** @type {Map<string, string>} socketId -> roomId */
    this.playerRooms = new Map();
  }

  // -----------------------------------------------------------------------
  // Room CRUD
  // -----------------------------------------------------------------------

  createRoom(socketId, playerName, trackId, cupMode) {
    const roomId = uid();
    const room = {
      id: roomId,
      name: `${playerName}'s Room`,
      hostId: socketId,
      players: new Map(),     // socketId -> PlayerSlot
      bots: new Map(),        // botId -> BotSlot
      trackId: trackId || null,
      cupMode: cupMode || false,
      currentCupRace: 0,
      raceActive: false,
      raceStartTime: null,
      raceEndTime: null,
      _destroyTimer: null,
      createdAt: Date.now(),
    };

    room.players.set(socketId, {
      id: socketId,
      name: playerName,
      ready: false,
      connected: true,
    });

    this.rooms.set(roomId, room);
    this.playerRooms.set(socketId, roomId);

    return room;
  }

  joinRoom(roomId, socketId, playerName) {
    const room = this.rooms.get(roomId);
    if (!room) return { error: 'Room not found' };
    if (room.raceActive) return { error: 'Race already in progress' };
    if (room.players.size >= MAX_PLAYERS) return { error: 'Room is full' };
    if (room.players.has(socketId)) return { error: 'Already in room' };

    // Cancel auto-destroy if someone joins
    if (room._destroyTimer) {
      clearTimeout(room._destroyTimer);
      room._destroyTimer = null;
    }

    room.players.set(socketId, {
      id: socketId,
      name: playerName,
      ready: false,
      connected: true,
    });

    this.playerRooms.set(socketId, roomId);
    return { room };
  }

  leaveRoom(socketId) {
    const roomId = this.playerRooms.get(socketId);
    if (!roomId) return null;
    const room = this.rooms.get(roomId);
    if (!room) {
      this.playerRooms.delete(socketId);
      return null;
    }

    // If race is active, convert player kart to bot
    if (room.raceActive && room.players.has(socketId)) {
      const player = room.players.get(socketId);
      const botId = `bot_${uid()}`;
      room.bots.set(botId, {
        id: botId,
        name: player.name + ' (Bot)',
        convertedFrom: socketId,
        difficulty: 'medium',
      });
    }

    room.players.delete(socketId);
    this.playerRooms.delete(socketId);

    // Host migration
    if (room.hostId === socketId && room.players.size > 0) {
      const nextHost = room.players.keys().next().value;
      room.hostId = nextHost;
    }

    // Auto-destroy empty rooms immediately
    if (room.players.size === 0) {
      this._destroyRoom(room.id);
      return { roomId, destroyed: true };
    }

    return { roomId, room };
  }

  setReady(socketId, isReady) {
    const roomId = this.playerRooms.get(socketId);
    if (!roomId) return null;
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player = room.players.get(socketId);
    if (!player) return null;

    player.ready = !!isReady;
    return room;
  }

  setTrack(socketId, trackId) {
    const roomId = this.playerRooms.get(socketId);
    if (!roomId) return null;
    const room = this.rooms.get(roomId);
    if (!room || room.hostId !== socketId) return null;

    room.trackId = trackId;
    return room;
  }

  // -----------------------------------------------------------------------
  // Race start / end
  // -----------------------------------------------------------------------

  canStartRace(socketId) {
    const roomId = this.playerRooms.get(socketId);
    if (!roomId) return { ok: false, error: 'Not in a room' };
    const room = this.rooms.get(roomId);
    if (!room) return { ok: false, error: 'Room not found' };
    if (room.hostId !== socketId) return { ok: false, error: 'Only the host can start' };
    if (room.raceActive) return { ok: false, error: 'Race already active' };
    if (!room.trackId) return { ok: false, error: 'No track selected' };

    // All human players must be ready (host is exempt)
    for (const [id, p] of room.players) {
      if (id !== room.hostId && !p.ready) {
        return { ok: false, error: `${p.name} is not ready` };
      }
    }

    return { ok: true, room };
  }

  startRace(socketId) {
    const check = this.canStartRace(socketId);
    if (!check.ok) return check;
    const room = check.room;

    room.raceActive = true;
    room.raceStartTime = Date.now();
    room.raceEndTime = null;

    // Cancel any pending destroy timer
    if (room._destroyTimer) {
      clearTimeout(room._destroyTimer);
      room._destroyTimer = null;
    }

    // Fill remaining slots with bots
    this._fillBots(room);

    return { ok: true, room };
  }

  endRace(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.raceActive = false;
    room.raceEndTime = Date.now();

    // Clear bot roster
    room.bots.clear();

    // Reset player ready states
    for (const [, p] of room.players) {
      p.ready = false;
    }

    // Cup mode: advance to next race
    if (room.cupMode) {
      room.currentCupRace++;
    }

    // Schedule auto-destroy
    room._destroyTimer = setTimeout(() => {
      this._destroyRoom(roomId);
    }, ROOM_AUTO_DESTROY_MS);

    return room;
  }

  // -----------------------------------------------------------------------
  // Queries
  // -----------------------------------------------------------------------

  getRoom(roomId) {
    return this.rooms.get(roomId) || null;
  }

  getRoomForPlayer(socketId) {
    const roomId = this.playerRooms.get(socketId);
    if (!roomId) return null;
    return this.rooms.get(roomId) || null;
  }

  listRooms() {
    const list = [];
    for (const room of this.rooms.values()) {
      list.push({
        id: room.id,
        name: room.name,
        hostId: room.hostId,
        playerCount: room.players.size,
        maxPlayers: MAX_PLAYERS,
        trackId: room.trackId,
        cupMode: room.cupMode,
        raceActive: room.raceActive,
      });
    }
    return list;
  }

  /**
   * Serialise room state for broadcast (lobby:state event).
   */
  serialiseRoom(room) {
    if (!room) return null;
    const players = [];
    for (const [id, p] of room.players) {
      players.push({
        id,
        name: p.name,
        ready: p.ready,
        isHost: id === room.hostId,
        connected: p.connected,
      });
    }
    const bots = [];
    for (const [id, b] of room.bots) {
      bots.push({ id, name: b.name, difficulty: b.difficulty });
    }

    return {
      id: room.id,
      name: room.name,
      hostId: room.hostId,
      players,
      bots,
      playerCount: room.players.size,
      botCount: room.bots.size,
      maxPlayers: MAX_PLAYERS,
      trackId: room.trackId,
      cupMode: room.cupMode,
      currentCupRace: room.currentCupRace,
      raceActive: room.raceActive,
    };
  }

  /**
   * Get every participant (players + bots) as a flat list of
   * { id, name, isBot, difficulty }.  Used by RaceManager to create slots.
   */
  getParticipants(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    const out = [];
    for (const [id, p] of room.players) {
      out.push({ id, name: p.name, isBot: false, difficulty: null });
    }
    for (const [id, b] of room.bots) {
      out.push({ id, name: b.name, isBot: true, difficulty: b.difficulty });
    }
    return out;
  }

  // -----------------------------------------------------------------------
  // Disconnect (called when socket drops)
  // -----------------------------------------------------------------------

  handleDisconnect(socketId) {
    return this.leaveRoom(socketId);
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  _fillBots(room) {
    const currentTotal = room.players.size + room.bots.size;
    const needed = MAX_PLAYERS - currentTotal;

    const usedNames = new Set();
    for (const [, p] of room.players) usedNames.add(p.name);
    for (const [, b] of room.bots) usedNames.add(b.name);

    const difficulties = ['easy', 'medium', 'medium', 'hard', 'hard', 'hard', 'max', 'max'];
    let diffIdx = room.players.size; // bots start at harder levels as the room fills

    for (let i = 0; i < needed; i++) {
      const botId = `bot_${uid()}`;
      let name = BOT_NAMES[i % BOT_NAMES.length];
      if (usedNames.has(name)) name = `${name}_${i}`;
      usedNames.add(name);

      room.bots.set(botId, {
        id: botId,
        name,
        convertedFrom: null,
        difficulty: difficulties[diffIdx % difficulties.length] || 'medium',
      });
      diffIdx++;
    }
  }

  _destroyRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    if (room._destroyTimer) {
      clearTimeout(room._destroyTimer);
      room._destroyTimer = null;
    }

    // Remove all player associations
    for (const socketId of room.players.keys()) {
      this.playerRooms.delete(socketId);
    }

    this.rooms.delete(roomId);
  }
}

module.exports = { LobbyManager };
