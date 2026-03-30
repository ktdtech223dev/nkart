/**
 * N Games SDK — ngames.js
 * Fire-and-forget integration with the N Games Network.
 */
const NGAMES_SERVER = 'https://ngames-server-production.up.railway.app';

const NGame = {
  _game_id: null,
  _profile_id: null,
  _ws: null,
  _handlers: {},
  _pingInterval: null,

  init({ game_id, profile_id }) {
    this._game_id = game_id;
    this._profile_id = profile_id;
    this._connectWS();
    console.log(`[NGame] init game=${game_id} profile=${profile_id}`);
  },

  _connectWS() {
    try {
      const wsUrl = NGAMES_SERVER.replace('https://', 'wss://').replace('http://', 'ws://');
      this._ws = new WebSocket(wsUrl);
      this._ws.onopen = () => {
        this._ws.send(JSON.stringify({ type: 'identify', profile_id: this._profile_id }));
      };
      this._ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type && this._handlers[msg.type]) {
            this._handlers[msg.type].forEach(fn => fn(msg));
          }
        } catch (err) { /* ignore */ }
      };
      this._ws.onclose = () => {
        setTimeout(() => this._connectWS(), 5000);
      };
    } catch (err) { /* ignore */ }
  },

  ping(state) {
    try {
      const body = {
        profile_id: this._profile_id,
        game_id: this._game_id,
        screen: state.screen || 'in_menu',
        ...state,
      };
      fetch(`${NGAMES_SERVER}/presence/ping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).catch(() => {});
    } catch (err) { /* ignore */ }
  },

  submitSession({ score, outcome, game_mode, game_version, data }) {
    try {
      fetch(`${NGAMES_SERVER}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: this._profile_id,
          game_id: this._game_id,
          score, outcome, game_mode, game_version, data,
        }),
      }).catch(() => {});
    } catch (err) { /* ignore */ }
  },

  postToWall(content) {
    try {
      fetch(`${NGAMES_SERVER}/wall`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: this._profile_id,
          game_id: this._game_id,
          content,
        }),
      }).catch(() => {});
    } catch (err) { /* ignore */ }
  },

  unlockAchievement(achievement_id) {
    try {
      fetch(`${NGAMES_SERVER}/achievements/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: this._profile_id,
          achievement_id,
        }),
      }).catch(() => {});
    } catch (err) { /* ignore */ }
  },

  updateProgress(achievement_id, value) {
    try {
      fetch(`${NGAMES_SERVER}/achievements/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: this._profile_id,
          achievement_id,
          value,
        }),
      }).catch(() => {});
    } catch (err) { /* ignore */ }
  },

  sendRoomState(room_id, state) {
    try {
      if (this._ws && this._ws.readyState === WebSocket.OPEN) {
        this._ws.send(JSON.stringify({
          type: 'room_state',
          room_id,
          profile_id: this._profile_id,
          state,
        }));
      }
    } catch (err) { /* ignore */ }
  },

  sendRoomEvent(room_id, event, data) {
    try {
      if (this._ws && this._ws.readyState === WebSocket.OPEN) {
        this._ws.send(JSON.stringify({
          type: 'room_event',
          room_id,
          profile_id: this._profile_id,
          event,
          data,
        }));
      }
    } catch (err) { /* ignore */ }
  },

  on(type, handler) {
    if (!this._handlers[type]) this._handlers[type] = [];
    this._handlers[type].push(handler);
  },

  destroy() {
    try {
      if (this._ws) this._ws.close();
      if (this._pingInterval) clearInterval(this._pingInterval);
      this._handlers = {};
    } catch (err) { /* ignore */ }
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = NGame;
} else if (typeof window !== 'undefined') {
  window.NGame = NGame;
}
