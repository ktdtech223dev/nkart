/**
 * network.js — Socket.io client, lobby state, state interpolation
 * Uses Socket.io CDN for the client (loaded in index.html).
 */

const GAME_SERVER = 'https://nkart-server-production.up.railway.app';

const Network = {
  socket: null,
  connected: false,
  lobby: null,
  isHost: false,
  profileId: null,
  car: null,
  color: null,

  // Remote player state buffers for interpolation
  _remoteStates: {}, // profile_id -> { prev, next, ts }
  _lastServerTs: 0,
  _inputSeq: 0,

  // Callbacks
  _onLobbyState: null,
  _onRaceCountdown: null,
  _onRaceStart: null,
  _onRaceState: null,
  _onRaceEvent: null,
  _onRaceResults: null,
  _onPlayerJoined: null,
  _onPlayerLeft: null,
  _onConnected: null,
  _onDisconnected: null,

  connect(profileId, car, color) {
    this.profileId = profileId;
    this.car = car;
    this.color = color;

    if (typeof io === 'undefined') {
      console.warn('[Network] Socket.io not loaded — loading from CDN');
      const script = document.createElement('script');
      script.src = 'https://cdn.socket.io/4.7.4/socket.io.min.js';
      script.onload = () => this._doConnect();
      document.head.appendChild(script);
      return;
    }
    this._doConnect();
  },

  _doConnect() {
    if (this.socket) this.disconnect();

    this.socket = io(GAME_SERVER, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('[Network] Connected to game server');
      this.connected = true;
      if (this._onConnected) this._onConnected();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Network] Disconnected:', reason);
      this.connected = false;
      if (this._onDisconnected) this._onDisconnected(reason);
    });

    this.socket.on('lobby:state', (state) => {
      this.lobby = state;
      this.isHost = state.host_id === this.profileId;
      if (this._onLobbyState) this._onLobbyState(state);
    });

    this.socket.on('race:countdown', (data) => {
      if (this._onRaceCountdown) this._onRaceCountdown(data.seconds);
    });

    this.socket.on('race:start', (data) => {
      if (this._onRaceStart) this._onRaceStart(data);
    });

    this.socket.on('race:state', (data) => {
      // Store for interpolation
      this._lastServerTs = data.ts;
      for (const kart of data.karts) {
        if (kart.id === this.profileId) continue; // skip self
        if (!this._remoteStates[kart.id]) {
          this._remoteStates[kart.id] = { prev: null, next: null, ts: 0 };
        }
        const rs = this._remoteStates[kart.id];
        rs.prev = rs.next;
        rs.next = { x: kart.x, y: kart.y, z: kart.z, ry: kart.ry, speed: kart.speed, item: kart.item, lap: kart.lap, pos: kart.pos };
        rs.ts = Date.now();
      }
      if (this._onRaceState) this._onRaceState(data);
    });

    this.socket.on('race:event', (data) => {
      if (this._onRaceEvent) this._onRaceEvent(data);
    });

    this.socket.on('race:results', (data) => {
      if (this._onRaceResults) this._onRaceResults(data);
    });

    this.socket.on('player:joined', (data) => {
      if (this._onPlayerJoined) this._onPlayerJoined(data);
    });

    this.socket.on('player:left', (data) => {
      if (this._onPlayerLeft) this._onPlayerLeft(data);
      delete this._remoteStates[data.profile_id];
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[Network] Connection error:', err.message);
    });
  },

  joinLobby() {
    if (!this.socket || !this.connected) return;
    this.socket.emit('lobby:join', {
      profile_id: this.profileId,
      car: this.car,
      color: this.color,
    });
  },

  setReady() {
    if (!this.socket) return;
    this.socket.emit('lobby:ready', { profile_id: this.profileId });
  },

  updateSettings(settings) {
    if (!this.socket || !this.isHost) return;
    this.socket.emit('lobby:settings', settings);
  },

  requestStart() {
    if (!this.socket || !this.isHost) return;
    this.socket.emit('lobby:start', { profile_id: this.profileId });
  },

  sendInput(kartState) {
    if (!this.socket || !this.connected) return;
    this._inputSeq++;
    this.socket.emit('race:input', {
      x: Math.round(kartState.position.x * 100) / 100,
      y: Math.round(kartState.position.y * 100) / 100,
      z: Math.round(kartState.position.z * 100) / 100,
      ry: Math.round(kartState.rotation * 1000) / 1000,
      speed: Math.round(kartState.speed * 10) / 10,
      item: kartState.currentItem ? kartState.currentItem.id : null,
      lap: kartState.lap,
      pos: kartState.position_rank,
      seq: this._inputSeq,
      timestamp: Date.now(),
    });
  },

  sendCheckpoint(index, timestamp) {
    if (!this.socket) return;
    this.socket.emit('race:checkpoint', { index, timestamp });
  },

  sendLap(lap, time) {
    if (!this.socket) return;
    this.socket.emit('race:lap', { lap, time });
  },

  sendFinish(totalTime, bestLap, position) {
    if (!this.socket) return;
    this.socket.emit('race:finish', { total_time: totalTime, best_lap: bestLap, position });
  },

  sendItemUse(itemId, targetId) {
    if (!this.socket) return;
    this.socket.emit('race:item_use', { item: itemId, target: targetId, profile_id: this.profileId });
  },

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connected = false;
    this.lobby = null;
    this.isHost = false;
    this._remoteStates = {};
  },

  /**
   * Get interpolated position for a remote player.
   * Call at render rate (60fps) to smooth 20Hz server updates.
   */
  getInterpolatedState(profileId) {
    const rs = this._remoteStates[profileId];
    if (!rs || !rs.next) return null;
    if (!rs.prev) return rs.next;

    // Time since last server update
    const elapsed = Date.now() - rs.ts;
    const alpha = Math.min(1, elapsed / 50); // 50ms = 20Hz

    return {
      x: rs.prev.x + (rs.next.x - rs.prev.x) * alpha,
      y: rs.prev.y + (rs.next.y - rs.prev.y) * alpha,
      z: rs.prev.z + (rs.next.z - rs.prev.z) * alpha,
      ry: this._lerpAngle(rs.prev.ry, rs.next.ry, alpha),
      speed: rs.prev.speed + (rs.next.speed - rs.prev.speed) * alpha,
      item: rs.next.item,
      lap: rs.next.lap,
      pos: rs.next.pos,
    };
  },

  _lerpAngle(a, b, t) {
    let diff = b - a;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return a + diff * t;
  },

  getRemotePlayerIds() {
    return Object.keys(this._remoteStates);
  },
};
