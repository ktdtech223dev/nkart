const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Use better-sqlite3 if available, otherwise fallback
let Database;
try { Database = require('better-sqlite3'); } catch { Database = null; }

const { initKartDatabase } = require('./racing/database');
const { createKartRoutes } = require('./racing/routes');
const { LobbyManager } = require('./racing/LobbyManager');
const { RaceManager } = require('./racing/RaceManager');

const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' }, transports: ['websocket', 'polling'] });

app.use(express.json());

// Static files
app.use(express.static(path.join(__dirname, '../dist')));

// Database
let db = null;
if (Database) {
  db = new Database(path.join(__dirname, 'nkart.db'));
  db.pragma('journal_mode = WAL');
  initKartDatabase(db);
}

// API routes
if (db) {
  app.use('/api/kart', createKartRoutes(db));
}

// Lobby & Race managers
const lobbyManager = new LobbyManager(io);
const raceManager = new RaceManager(io);

// Socket.io
io.on('connection', (socket) => {
  console.log(`[NKart] Player connected: ${socket.id}`);

  // Lobby events
  socket.on('lobby:create', (data) => {
    const room = lobbyManager.createRoom(socket.id, data.playerName || 'Player', data.trackId, data.cupMode);
    socket.join(room.id);
    socket.emit('lobby:created', lobbyManager.serialiseRoom(room));
    io.emit('lobby:list', lobbyManager.listRooms());
  });

  socket.on('lobby:join', (data) => {
    const result = lobbyManager.joinRoom(data.roomId, socket.id, data.playerName || 'Player');
    if (result.error) {
      socket.emit('lobby:error', { message: result.error });
    } else {
      socket.join(data.roomId);
      socket.emit('lobby:joined', lobbyManager.serialiseRoom(result.room));
      io.to(data.roomId).emit('lobby:state', lobbyManager.serialiseRoom(result.room));
    }
  });

  socket.on('lobby:ready', (data) => {
    const room = lobbyManager.setReady(socket.id, data.ready);
    if (room) io.to(room.id).emit('lobby:state', lobbyManager.serialiseRoom(room));
  });

  socket.on('lobby:setTrack', (data) => {
    const room = lobbyManager.setTrack(socket.id, data.trackId);
    if (room) io.to(room.id).emit('lobby:state', lobbyManager.serialiseRoom(room));
  });

  socket.on('lobby:start', () => {
    const result = lobbyManager.startRace(socket.id);
    if (result.ok) {
      const room = result.room;
      raceManager.startRace(room.id, room);
      io.to(room.id).emit('race:start', {
        trackId: room.trackId,
        startTime: room.raceStartTime + 4000, // 4s countdown
        participants: lobbyManager.getParticipants(room.id),
      });
    } else {
      socket.emit('lobby:error', { message: result.error });
    }
  });

  socket.on('lobby:list', () => socket.emit('lobby:list', lobbyManager.listRooms()));

  // Race events
  socket.on('player:input', (data) => {
    const roomId = lobbyManager.playerRooms?.get(socket.id);
    if (roomId) raceManager.queueInput(roomId, socket.id, data);
  });

  socket.on('player:item-use', () => {
    const roomId = lobbyManager.playerRooms?.get(socket.id);
    if (roomId) raceManager.handleItemUse(roomId, socket.id);
  });

  socket.on('race:checkpoint', (data) => {
    const roomId = lobbyManager.playerRooms?.get(socket.id);
    if (roomId) raceManager.handleCheckpoint(roomId, socket.id, data.checkpointIndex);
  });

  socket.on('race:finish', (data) => {
    const roomId = lobbyManager.playerRooms?.get(socket.id);
    if (roomId) {
      const race = raceManager.activeRaces.get(roomId);
      if (race) {
        const racer = race.players.get(socket.id);
        if (racer && !racer.finished) {
          racer.finished = true;
          racer.finishTime = Date.now() - race.startTime;
          race.results.push({
            id: racer.id,
            name: racer.name,
            position: race.results.length + 1,
            finishTime: racer.finishTime,
          });
          io.to(roomId).emit('race:playerFinished', {
            playerId: racer.id,
            position: race.results.length,
            finishTime: racer.finishTime,
          });
        }
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`[NKart] Player disconnected: ${socket.id}`);
    const result = lobbyManager.handleDisconnect(socket.id);
    if (result && result.roomId && !result.destroyed) {
      const room = lobbyManager.getRoom(result.roomId);
      if (room) io.to(result.roomId).emit('lobby:state', lobbyManager.serialiseRoom(room));
    }
    io.emit('lobby:list', lobbyManager.listRooms());
  });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

server.listen(PORT, () => {
  console.log(`[NKart] Server running on port ${PORT}`);
});

module.exports = { app, server, io };
