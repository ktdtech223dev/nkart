import { io } from 'socket.io-client';

export class NetworkManager {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.playerId = null;
    this.roomId = null;
    this.inputSeq = 0;
    this.pendingInputs = [];
    this.interpolationBuffer = new Map();
    this.updateQueue = [];
    this.serverTickRate = 20;

    // Callbacks
    this.onGameState = null;
    this.onItemSpawn = null;
    this.onItemDestroy = null;
    this.onHazardEvent = null;
    this.onPositionUpdate = null;
    this.onPlayerFinish = null;
    this.onRaceEnd = null;
    this.onLobbyState = null;
    this.onRaceStart = null;
    this.onCollision = null;
  }

  connect(serverUrl) {
    if (this.socket) return;

    this.socket = io(serverUrl || 'http://localhost:3000', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      this.connected = true;
      this.playerId = this.socket.id;
    });

    this.socket.on('disconnect', (reason) => {
      this.connected = false;
      this.disconnectReason = reason;
      if (this.onDisconnect) this.onDisconnect(reason);
    });

    this.socket.on('connect_error', (err) => {
      if (this.onConnectionError) this.onConnectionError(err.message);
    });

    // Game state updates (20Hz)
    this.socket.on('game:state', (data) => {
      this.updateQueue.push(data);
      if (this.onGameState) this.onGameState(data);
    });

    this.socket.on('race:item-spawn', (data) => {
      if (this.onItemSpawn) this.onItemSpawn(data);
    });

    this.socket.on('race:item-destroy', (data) => {
      if (this.onItemDestroy) this.onItemDestroy(data);
    });

    this.socket.on('race:hazard-event', (data) => {
      if (this.onHazardEvent) this.onHazardEvent(data);
    });

    this.socket.on('race:position-update', (data) => {
      if (this.onPositionUpdate) this.onPositionUpdate(data);
    });

    this.socket.on('race:player-finish', (data) => {
      if (this.onPlayerFinish) this.onPlayerFinish(data);
    });

    this.socket.on('race:end', (data) => {
      if (this.onRaceEnd) this.onRaceEnd(data);
    });

    this.socket.on('lobby:state', (data) => {
      if (this.onLobbyState) this.onLobbyState(data);
    });

    this.socket.on('lobby:race-start', (data) => {
      if (this.onRaceStart) this.onRaceStart(data);
    });

    this.socket.on('player:collision', (data) => {
      if (this.onCollision) this.onCollision(data);
    });

    this.socket.on('item:event', (data) => {
      if (this.onItemEvent) this.onItemEvent(data);
    });

    this.socket.on('item:collected', (data) => {
      if (this.onItemCollected) this.onItemCollected(data);
    });

    this.socket.on('race:playerFinished', (data) => {
      if (this.onPlayerFinish) this.onPlayerFinish(data);
    });

    this.socket.on('race:start', (data) => {
      if (this.onRaceStart) this.onRaceStart(data);
    });

    this.socket.on('lobby:created', (data) => {
      this.roomId = data.id;
      if (this.onLobbyState) this.onLobbyState(data);
    });

    this.socket.on('lobby:joined', (data) => {
      this.roomId = data.id;
      if (this.onLobbyState) this.onLobbyState(data);
    });

    this.socket.on('lobby:error', (data) => {
      if (this.onLobbyError) this.onLobbyError(data);
    });

    this.socket.on('lobby:list', (data) => {
      if (this.onLobbyList) this.onLobbyList(data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  sendInput(inputState) {
    if (!this.socket || !this.connected) return;

    this.inputSeq++;
    const packet = {
      seq: this.inputSeq,
      timestamp: performance.now(),
      throttle: inputState.throttle,
      brake: inputState.brake,
      steer: inputState.steer,
      drift: inputState.drift,
      useItem: inputState.useItem,
    };

    this.socket.emit('player:input', packet);
    this.pendingInputs.push(packet);

    // Keep buffer manageable
    if (this.pendingInputs.length > 120) {
      this.pendingInputs.splice(0, 60);
    }
  }

  sendItemUse(itemType, targetId) {
    if (!this.socket) return;
    this.socket.emit('player:item-use', { itemType, targetId });
  }

  createLobby(roomName, trackId, cupMode) {
    if (!this.socket) return;
    this.socket.emit('lobby:create', { roomName, trackId, cupMode });
  }

  joinLobby(roomId) {
    if (!this.socket) return;
    this.socket.emit('lobby:join', { roomId });
    this.roomId = roomId;
  }

  setReady(isReady) {
    if (!this.socket) return;
    this.socket.emit('lobby:ready', { isReady });
  }

  startRace() {
    if (!this.socket) return;
    this.socket.emit('lobby:start', {});
  }

  sendCheckpoint(checkpointIndex) {
    if (!this.socket) return;
    this.socket.emit('race:checkpoint', { checkpointIndex, timestamp: performance.now() });
  }

  sendLapComplete(lapNumber, lapTime) {
    if (!this.socket) return;
    this.socket.emit('race:lap-complete', { lapNumber, lapTime });
  }

  sendFinish(totalTime, position) {
    if (!this.socket) return;
    this.socket.emit('race:finish', { totalTime, position });
  }

  applyQueuedUpdates(remoteKarts) {
    while (this.updateQueue.length > 0) {
      const update = this.updateQueue.shift();
      if (!update.players) continue;

      for (const player of update.players) {
        if (player.id === this.playerId) continue;

        let remote = remoteKarts.get(player.id);
        if (!remote) {
          remote = {
            id: player.id,
            mesh: null,
            prevPos: null,
            currPos: null,
            rotation: 0,
            speed: 0,
            interpolationBuffer: [],
          };
          remoteKarts.set(player.id, remote);
        }

        // Add to interpolation buffer
        remote.interpolationBuffer.push({
          timestamp: performance.now(),
          position: player.position,
          rotation: player.rotation,
          speed: player.speed,
        });

        // Keep buffer at 2-3 frames
        while (remote.interpolationBuffer.length > 3) {
          remote.interpolationBuffer.shift();
        }

        // Interpolate
        if (remote.interpolationBuffer.length >= 2) {
          const older = remote.interpolationBuffer[remote.interpolationBuffer.length - 2];
          const newer = remote.interpolationBuffer[remote.interpolationBuffer.length - 1];
          remote.prevPos = older.position;
          remote.currPos = newer.position;
          remote.rotation = newer.rotation;
          remote.speed = newer.speed;
        }
      }
    }
  }
}
