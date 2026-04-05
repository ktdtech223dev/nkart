const BASE_URL = '/api/kart';
const MAX_RETRIES = 3;
const BACKOFF_MS = [1000, 2000, 4000];

class KartDataService {
  constructor() {
    this._token = null;
    this._profileCache = null;
    this._unlocksCache = null;
  }

  setToken(token) {
    this._token = token;
  }

  async _fetch(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(this._token ? { Authorization: `Bearer ${this._token}` } : {}),
      ...options.headers,
    };

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: res.statusText }));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        return await res.json();
      } catch (err) {
        if (attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, BACKOFF_MS[attempt]));
        } else {
          console.error(`KartDataService: ${path} failed after ${MAX_RETRIES} retries:`, err);
          throw err;
        }
      }
    }
  }

  async getProfile() {
    if (this._profileCache) return this._profileCache;
    const data = await this._fetch('/profile');
    this._profileCache = data;
    return data;
  }

  async createProfile(displayName) {
    const data = await this._fetch('/profile', {
      method: 'POST',
      body: JSON.stringify({ displayName }),
    });
    this._profileCache = data;
    return data;
  }

  async updateAvatar(config) {
    this._invalidateProfile();
    return this._fetch('/avatar', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async updateKart(config) {
    this._invalidateProfile();
    return this._fetch('/kart', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async getLeaderboard(trackId) {
    return this._fetch(`/leaderboard/${trackId}`);
  }

  async getGlobalLeaderboard() {
    return this._fetch('/leaderboard/global');
  }

  async submitRaceResult(data) {
    this._invalidateProfile();
    return this._fetch('/race/complete', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCups() {
    return this._fetch('/cups');
  }

  async submitCupResult(data) {
    this._invalidateProfile();
    return this._fetch('/cup/complete', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUnlocks() {
    if (this._unlocksCache) return this._unlocksCache;
    const data = await this._fetch('/unlocks');
    this._unlocksCache = data;
    return data;
  }

  async checkUnlocks() {
    this._unlocksCache = null;
    return this._fetch('/unlock/check', { method: 'POST' });
  }

  _invalidateProfile() {
    this._profileCache = null;
    this._unlocksCache = null;
  }
}

export const kartDataService = new KartDataService();
