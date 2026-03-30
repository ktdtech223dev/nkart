/**
 * N Kart Game Server
 * Express + Socket.io — separate from N Games server.
 * Persistent lobby: nkart-crew
 */
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 30000,
  pingInterval: 10000,
});

// =================== STATE ===================

const lobby = {
  players: new Map(), // profile_id -> { car, color, ready, socketId }
  settings: {
    speed_class: '150cc',
    laps: 3,
    items: 'Normal',
    bots: 4,
    difficulty: 'Medium',
    track: 'Downtown Drag',
    mirror: false,
    night: false,
  },
  race: null,
  host_id: null,
};

// =================== ROUTES ===================

app.get('/', (req, res) => {
  const players = {};
  for (const [id, data] of lobby.players) {
    players[id] = { car: data.car, color: data.color, ready: data.ready };
  }
  res.json({
    name: 'N Kart Server',
    status: lobby.race ? 'racing' : 'lobby',
    players,
    settings: lobby.settings,
    host_id: lobby.host_id,
    racing: lobby.race !== null,
  });
});

app.get('/health', (req, res) => {
  res.json({ ok: true, players: lobby.players.size });
});

// =================== SOCKET.IO ===================

io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // ---- LOBBY ----

  socket.on('lobby:join', ({ profile_id, car, color }) => {
    if (!profile_id || !car) return;

    // Remove old connection if same profile rejoins
    if (lobby.players.has(profile_id)) {
      const old = lobby.players.get(profile_id);
      if (old.socketId !== socket.id) {
        const oldSocket = io.sockets.sockets.get(old.socketId);
        if (oldSocket) oldSocket.disconnect(true);
      }
    }

    lobby.players.set(profile_id, {
      car, color: color || 0xffffff, ready: false, socketId: socket.id,
    });
    if (!lobby.host_id || !lobby.players.has(lobby.host_id)) {
      lobby.host_id = profile_id;
    }
    socket.profile_id = profile_id;

    broadcastLobbyState();
    io.emit('player:joined', { profile_id, car, color });
    console.log(`[Lobby] ${profile_id} joined with ${car} (${lobby.players.size} players)`);
  });

  socket.on('lobby:ready', ({ profile_id }) => {
    const player = lobby.players.get(profile_id);
    if (player) {
      player.ready = !player.ready;
      broadcastLobbyState();
    }
  });

  socket.on('lobby:settings', (settings) => {
    if (socket.profile_id !== lobby.host_id) return;
    // Validate settings
    const allowed = {
      speed_class: ['100cc', '150cc', '200cc'],
      laps: [1, 2, 3, 5],
      items: ['Normal', 'No Blue Shell', 'Shells Only', 'Chaos', 'No Items'],
      bots: [0, 1, 2, 3, 4],
      difficulty: ['Easy', 'Medium', 'Hard', 'Unfair'],
    };
    for (const [key, val] of Object.entries(settings)) {
      if (allowed[key] && !allowed[key].includes(val)) continue;
      if (key in lobby.settings) lobby.settings[key] = val;
    }
    broadcastLobbyState();
  });

  socket.on('lobby:start', ({ profile_id }) => {
    if (profile_id !== lobby.host_id) return;
    if (lobby.race) return; // already racing

    // Check all players ready (or host can force-start)
    const allReady = [...lobby.players.values()].every(p => p.ready);
    if (!allReady && lobby.players.size > 1) {
      // Allow host to start anyway — just warn
      console.log('[Lobby] Host force-starting (not all ready)');
    }

    startRace();
  });

  // ---- RACE ----

  socket.on('race:input', (input) => {
    if (!lobby.race) return;
    const pid = socket.profile_id;
    if (!pid) return;

    // Store latest position for relay
    lobby.race.positions.set(pid, {
      x: input.x, y: input.y, z: input.z,
      ry: input.ry, speed: input.speed,
      item: input.item, lap: input.lap, pos: input.pos,
      ts: Date.now(),
    });
  });

  socket.on('race:checkpoint', ({ index, timestamp }) => {
    const pid = socket.profile_id;
    if (!pid || !lobby.race) return;
    const state = lobby.race.playerStates.get(pid);
    if (!state) return;

    // Validate sequential checkpoint order
    const expected = state.nextCheckpoint;
    if (index === expected || index === (expected + 1) % lobby.race.totalCheckpoints) {
      state.nextCheckpoint = (index + 1) % lobby.race.totalCheckpoints;
      state.lastCheckpointTime = timestamp;
      io.emit('race:event', { type: 'checkpoint', data: { profile_id: pid, index } });
    }
  });

  socket.on('race:lap', ({ lap, time }) => {
    const pid = socket.profile_id;
    if (!pid || !lobby.race) return;
    const state = lobby.race.playerStates.get(pid);
    if (state) {
      state.lap = lap;
      state.lapTime = time;
      if (time < state.bestLap) state.bestLap = time;
      io.emit('race:event', { type: 'lap', data: { profile_id: pid, lap, time } });
    }
  });

  socket.on('race:item_use', ({ item, target, profile_id }) => {
    if (!lobby.race) return;
    io.emit('race:event', { type: 'item_use', data: { profile_id, item, target } });
  });

  socket.on('race:finish', ({ total_time, best_lap, position }) => {
    const pid = socket.profile_id;
    if (!pid || !lobby.race) return;

    // Prevent duplicate finishes
    if (lobby.race.finishers.find(f => f.profile_id === pid)) return;

    const finishPos = lobby.race.finishers.length + 1;
    lobby.race.finishers.push({ profile_id: pid, total_time, best_lap, position: finishPos });
    io.emit('race:event', { type: 'finish', data: { profile_id: pid, total_time, best_lap, position: finishPos } });

    console.log(`[Race] ${pid} finished in position ${finishPos} (${total_time}ms)`);

    // Check if all human players finished
    if (lobby.race.finishers.length >= lobby.players.size) {
      endRace();
    }
  });

  // ---- DISCONNECT ----

  socket.on('disconnect', () => {
    const pid = socket.profile_id;
    if (!pid) return;

    lobby.players.delete(pid);
    io.emit('player:left', { profile_id: pid });

    if (lobby.race) {
      lobby.race.positions.delete(pid);
      // Auto-finish disconnected player
      if (!lobby.race.finishers.find(f => f.profile_id === pid)) {
        lobby.race.finishers.push({ profile_id: pid, total_time: 999999, best_lap: 999999, position: 8 });
        if (lobby.race.finishers.length >= lobby.players.size && lobby.players.size > 0) {
          endRace();
        }
      }
    }

    // Transfer host
    if (lobby.host_id === pid) {
      const next = lobby.players.keys().next().value;
      lobby.host_id = next || null;
    }

    broadcastLobbyState();
    console.log(`[Lobby] ${pid} disconnected (${lobby.players.size} remain)`);
  });
});

// =================== HELPERS ===================

function broadcastLobbyState() {
  const players = {};
  for (const [id, data] of lobby.players) {
    players[id] = { car: data.car, color: data.color, ready: data.ready };
  }
  io.emit('lobby:state', {
    players,
    settings: lobby.settings,
    host_id: lobby.host_id,
  });
}

function startRace() {
  lobby.race = {
    positions: new Map(),
    playerStates: new Map(),
    finishers: [],
    startTime: Date.now(),
    totalCheckpoints: 8,
  };

  // Set all players unready for next race
  for (const [pid, player] of lobby.players) {
    player.ready = false;
    lobby.race.playerStates.set(pid, {
      nextCheckpoint: 0,
      lap: 0,
      lapTime: 0,
      bestLap: Infinity,
      lastCheckpointTime: 0,
    });
  }

  console.log(`[Race] Starting on ${lobby.settings.track} (${lobby.settings.speed_class}, ${lobby.players.size} players)`);

  io.emit('race:countdown', { seconds: 4 });
  setTimeout(() => {
    io.emit('race:start', {
      track: lobby.settings.track,
      settings: { ...lobby.settings },
      start_positions: [...lobby.players.keys()],
    });
    lobby.race.startTime = Date.now();
  }, 4000);
}

function endRace() {
  if (!lobby.race) return;

  const standings = lobby.race.finishers.sort((a, b) => a.position - b.position);
  const npAwards = {};
  const points = [10, 7, 5, 4, 3, 2, 1, 0];
  for (let i = 0; i < standings.length; i++) {
    npAwards[standings[i].profile_id] = points[i] || 0;
  }

  io.emit('race:results', {
    standings,
    best_laps: standings.map(s => ({ profile_id: s.profile_id, best_lap: s.best_lap })),
    np_awarded: npAwards,
  });

  console.log('[Race] Ended. Standings:', standings.map(s => `${s.profile_id}:${s.position}`).join(', '));

  lobby.race = null;
  broadcastLobbyState();
}

// =================== STATE BROADCAST (20Hz) ===================

setInterval(() => {
  if (!lobby.race) return;

  const karts = [];
  for (const [pid, pos] of lobby.race.positions) {
    karts.push({ id: pid, ...pos });
  }

  if (karts.length > 0) {
    io.emit('race:state', { karts, ts: Date.now() });
  }
}, 50); // 20Hz

// =================== START ===================

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`[N Kart Server] Running on port ${PORT}`);
});
