/**
 * main.js — Three.js scene, game loop, init
 * Entry point for N Kart.
 */

// =================== GLOBALS ===================
let renderer, scene, camera;
let activeProfile = null;
let selectedCar = null;
let currentRace = null;
let gameState = 'profile_select'; // profile_select, menu, racing, results

const CAMERA_DISTANCE = 8;
const CAMERA_HEIGHT = 4;
const CAMERA_LOOK_AHEAD = 3;
const CAMERA_SMOOTHING = 0.06;

// =================== INIT ===================

function initGame() {
  // Renderer
  const canvas = document.getElementById('game-canvas');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f0f0f);
  scene.fog = new THREE.Fog(0x0f0f0f, 50, 200);

  // Camera
  camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(0, 5, 10);

  // Default lighting
  setupDefaultLighting();

  // Input
  Input.init();

  // Audio
  Audio.init();

  // UI
  UI.init();

  // Resize handler
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  // Start loop
  let lastTime = performance.now();
  function gameLoop(now) {
    requestAnimationFrame(gameLoop);
    const dt = Math.min((now - lastTime) / 1000, 0.05); // cap at 50ms
    lastTime = now;

    Input.update();
    update(dt);
    renderer.render(scene, camera);
  }
  requestAnimationFrame(gameLoop);

  // Load save data
  SaveData.load();

  // Show profile select
  UI.showProfileSelect();
}

function setupDefaultLighting() {
  const ambient = new THREE.AmbientLight(0x334455, 0.6);
  scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(30, 50, 30);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far = 200;
  dirLight.shadow.camera.left = -100;
  dirLight.shadow.camera.right = 100;
  dirLight.shadow.camera.top = 100;
  dirLight.shadow.camera.bottom = -100;
  scene.add(dirLight);

  // Hemisphere light for nice ambient
  const hemi = new THREE.HemisphereLight(0x446688, 0x222211, 0.4);
  scene.add(hemi);
}

function setupTrackLighting(theme) {
  scene.background = new THREE.Color(theme.skyColor);
  scene.fog = new THREE.Fog(theme.fogColor, 60, 250);
}

// =================== PROFILE ===================

function selectProfile(profileId) {
  activeProfile = {
    id: profileId,
    color: { keshawn: 0x80e060, sean: 0xf0c040, dart: 0xe04040, amari: 0x40c0e0 }[profileId],
  };
  selectedCar = CREW_CARS[profileId];

  // Init N Games SDK
  try {
    NGame.init({ game_id: 'nkart', profile_id: profileId });
    NGame.ping({ screen: 'in_menu' });
  } catch (e) { /* ignore */ }

  UI.hideProfileSelect();
  UI.showMenu();
  gameState = 'menu';
}

// =================== SAVED DATA ===================

const SaveData = {
  _key: 'nkart_save',
  _data: null,

  load() {
    try {
      this._data = JSON.parse(localStorage.getItem(this._key)) || {};
    } catch (e) { this._data = {}; }
    if (!this._data.medals) this._data.medals = {};
    if (!this._data.taRecords) this._data.taRecords = {};
    if (!this._data.stats) this._data.stats = { wins: 0, races: 0, lastPlaces: 0, tracksPlayed: {} };
    if (!this._data.unlocks) this._data.unlocks = {};
    return this._data;
  },

  save() {
    try { localStorage.setItem(this._key, JSON.stringify(this._data)); } catch (e) { /* ignore */ }
  },

  getMedals() { return this._data.medals || {}; },
  setMedal(cup, medal) {
    const prev = this._data.medals[cup];
    const rank = { gold: 3, silver: 2, bronze: 1 };
    if (!prev || (rank[medal] || 0) > (rank[prev] || 0)) {
      this._data.medals[cup] = medal;
      this.save();
    }
  },

  isNGamesCupUnlocked() {
    const m = this._data.medals;
    return !!m['Street Cup'] && !!m['Nature Cup'] && !!m['Fantasy Cup'];
  },

  getTARecords() { return this._data.taRecords || {}; },
  setTARecord(trackName, timeMs) {
    const prev = this._data.taRecords[trackName];
    if (!prev || timeMs < prev) {
      this._data.taRecords[trackName] = timeMs;
      this.save();
      return true;
    }
    return false;
  },

  recordRaceFinish(position, trackName) {
    this._data.stats.races++;
    if (position === 1) this._data.stats.wins++;
    if (position === 8) this._data.stats.lastPlaces++;
    this._data.stats.tracksPlayed[trackName] = true;
    this.save();
  },
};

// =================== GRAND PRIX ===================

let gpState = null; // { cup, cupName, tracks, raceIndex, standings, speedClass, difficulty }

function showGPSelect() {
  SaveData.load();
  UI.hideMenu();
  UI.hideTASelect();
  UI.showGPSelect(CUPS, SaveData.getMedals(), SaveData.isNGamesCupUnlocked());
}

function hideGPSelect() {
  document.getElementById('gp-select').classList.add('hidden');
  UI.showMenu();
}

function startGrandPrix(cupName, speedClass, difficulty) {
  const tracks = CUPS[cupName];
  if (!tracks) return;

  gpState = {
    cupName,
    tracks,
    raceIndex: 0,
    speedClass,
    difficulty,
    standings: {}, // kartId -> { name, points, isPlayer }
  };

  try {
    NGame.ping({ screen: 'grand_prix', cup: cupName, race: 1 });
  } catch (e) { /* ignore */ }

  startGPRace();
}

function startGPRace() {
  if (!gpState || gpState.raceIndex >= gpState.tracks.length) return;

  const trackDef = gpState.tracks[gpState.raceIndex];
  gameState = 'racing';

  clearScene();

  currentRace = new RaceManager({
    trackDef,
    laps: 3,
    speedClass: gpState.speedClass,
    itemPreset: 'Normal',
    botCount: 7,
    botDifficulty: gpState.difficulty,
  });

  setupRaceCallbacks(trackDef, 'grand_prix');

  // Override finish callback for GP
  currentRace.onRaceFinish = (results) => {
    Audio.stopEngine();
    const playerResult = results.find(r => r.isPlayer);
    Audio.playSound(playerResult.position <= 3 ? 'finish_win' : 'finish_lose');

    // Accumulate GP standings
    for (const r of results) {
      const id = r.isPlayer ? '__player__' : r.kart.carDef.id + '_' + results.indexOf(r);
      if (!gpState.standings[id]) {
        gpState.standings[id] = { name: r.isPlayer ? 'You' : r.kart.carDef.name, points: 0, isPlayer: r.isPlayer };
      }
      gpState.standings[id].points += r.points;
    }

    // Submit session
    try {
      NGame.submitSession({
        score: playerResult.position === 1 ? 1000 : Math.max(0, (8 - playerResult.position) * 100),
        outcome: playerResult.position === 1 ? 'win' : playerResult.position <= 3 ? 'cashout' : 'bust',
        game_mode: 'grand_prix',
        game_version: '1.0.0',
        data: {
          track: trackDef.name, position: playerResult.position, total_racers: 8,
          best_lap: playerResult.bestLap * 1000, total_time: playerResult.time * 1000,
          car: selectedCar.id, speed_class: gpState.speedClass,
          items_used: playerResult.itemsUsed, mode: 'grand_prix',
          cup: gpState.cupName, race_num: gpState.raceIndex + 1,
        },
      });
    } catch (e) { /* ignore */ }

    SaveData.load();
    SaveData.recordRaceFinish(playerResult.position, trackDef.name);

    gpState.raceIndex++;

    setTimeout(() => {
      UI.hideHUD();
      const sorted = Object.values(gpState.standings).sort((a, b) => b.points - a.points);

      if (gpState.raceIndex >= gpState.tracks.length) {
        // Cup complete
        const playerStanding = sorted.find(s => s.isPlayer);
        const totalPts = playerStanding ? playerStanding.points : 0;
        const medal = totalPts >= 30 ? 'gold' : totalPts >= 20 ? 'silver' : 'bronze';
        SaveData.setMedal(gpState.cupName, medal);

        // Achievements
        try {
          const cupIdx = ['Street Cup', 'Nature Cup', 'Fantasy Cup', 'N Games Cup'].indexOf(gpState.cupName);
          if (medal === 'gold' && cupIdx >= 0) {
            NGame.unlockAchievement(`nkart_gold_cup_${cupIdx + 1}`);
          }
          if (SaveData.getMedals()['Street Cup'] === 'gold' && SaveData.getMedals()['Nature Cup'] === 'gold' &&
              SaveData.getMedals()['Fantasy Cup'] === 'gold' && SaveData.getMedals()['N Games Cup'] === 'gold') {
            NGame.unlockAchievement('nkart_all_gold');
          }
        } catch (e) { /* ignore */ }

        gameState = 'results';
        UI.showGPFinal(gpState.cupName, sorted, medal, totalPts);
      } else {
        // Show standings, next race
        gameState = 'results';
        UI.showGPStandings(gpState.cupName, gpState.raceIndex, gpState.tracks.length, sorted, () => {
          try { NGame.ping({ screen: 'grand_prix', cup: gpState.cupName, race: gpState.raceIndex + 1 }); } catch (e) { /* ignore */ }
          startGPRace();
        });
      }
    }, 2000);
  };

  setupTrackLighting(trackDef.theme);
  currentRace.init(scene, selectedCar, activeProfile.color, activeProfile.id);
  UI.showHUD();
}

function endGrandPrix() {
  UI.hideGPFinal();
  gpState = null;
  backToMenu();
}

// =================== TIME ATTACK ===================

let taGhostData = null;
let taGhostMesh = null;
let taRecording = [];
let taFrameCounter = 0;

function showTASelect() {
  SaveData.load();
  UI.hideMenu();
  UI.hideGPSelect();
  UI.showTASelect(ALL_TRACKS, SaveData.getTARecords());
}

function hideTASelect() {
  document.getElementById('ta-select').classList.add('hidden');
  UI.showMenu();
}

function startTimeAttack(trackDef) {
  gameState = 'racing';

  clearScene();

  // Load ghost data for this track
  SaveData.load();
  const ghostKey = 'nkart_ghost_' + trackDef.name.replace(/\s/g, '_');
  try {
    taGhostData = JSON.parse(localStorage.getItem(ghostKey));
  } catch (e) { taGhostData = null; }
  taRecording = [];
  taFrameCounter = 0;

  currentRace = new RaceManager({
    trackDef,
    laps: 3,
    speedClass: '150cc',
    itemPreset: 'No Items',
    botCount: 0,
    botDifficulty: 'Medium',
  });

  setupRaceCallbacks(trackDef, 'time_attack');

  // Spawn ghost kart if we have data
  if (taGhostData && taGhostData.length > 0) {
    taGhostMesh = selectedCar.build(activeProfile.color);
    taGhostMesh.scale.set(0.5, 0.5, 0.5);
    taGhostMesh.traverse(child => {
      if (child.isMesh) {
        child.material = child.material.clone();
        child.material.transparent = true;
        child.material.opacity = 0.3;
      }
    });
    scene.add(taGhostMesh);
  } else {
    taGhostMesh = null;
  }

  // Override finish for TA
  currentRace.onRaceFinish = (results) => {
    Audio.stopEngine();
    const playerResult = results.find(r => r.isPlayer);
    const bestLapMs = Math.round(playerResult.bestLap * 1000);

    // Check if new record
    const isNewRecord = SaveData.setTARecord(trackDef.name, bestLapMs);

    if (isNewRecord) {
      // Save ghost
      try {
        const ghostKey = 'nkart_ghost_' + trackDef.name.replace(/\s/g, '_');
        localStorage.setItem(ghostKey, JSON.stringify(taRecording));
      } catch (e) { /* ignore */ }

      Audio.playSound('finish_win');
      UI.showCenterMessage('NEW RECORD!', '#f0c040', 3000);

      try {
        NGame.unlockAchievement('nkart_time_attack_1');
        NGame.postToWall(`\u23f1\ufe0f ${activeProfile.id} set a new Time Attack record on ${trackDef.name}: ${formatTime(playerResult.bestLap)}`);
      } catch (e) { /* ignore */ }
    } else {
      Audio.playSound('finish_lose');
    }

    try {
      NGame.submitSession({
        score: Math.max(0, 1000 - bestLapMs),
        outcome: isNewRecord ? 'win' : 'bust',
        game_mode: 'time_attack',
        game_version: '1.0.0',
        data: {
          track: trackDef.name, best_lap: bestLapMs,
          total_time: Math.round(playerResult.time * 1000),
          car: selectedCar.id, speed_class: '150cc', mode: 'time_attack',
        },
      });
    } catch (e) { /* ignore */ }

    // Cleanup ghost
    if (taGhostMesh) { scene.remove(taGhostMesh); taGhostMesh = null; }

    setTimeout(() => {
      gameState = 'results';
      UI.hideHUD();
      UI.showResults(results,
        () => { startTimeAttack(trackDef); },
        () => { backToMenu(); }
      );
    }, 2000);
  };

  setupTrackLighting(trackDef.theme);
  currentRace.init(scene, selectedCar, activeProfile.color, activeProfile.id);
  UI.showHUD();

  try { NGame.ping({ screen: 'time_attack', track: trackDef.name }); } catch (e) { /* ignore */ }
}

// =================== SHARED HELPERS ===================

function clearScene() {
  if (currentRace) {
    currentRace.cleanup(scene);
    Audio.stopEngine();
  }
  if (taGhostMesh) { scene.remove(taGhostMesh); taGhostMesh = null; }
  const toRemove = [];
  scene.traverse(child => { if (child.isMesh) toRemove.push(child); });
  for (const obj of toRemove) { if (obj.parent) obj.parent.remove(obj); }
}

function setupRaceCallbacks(trackDef, mode) {
  currentRace.onCountdownTick = (num) => {
    UI.showCountdown(num);
    Audio.playSound('countdown_beep');
  };

  currentRace.onRaceStart = () => {
    UI.showCountdown(0);
    Audio.playSound('countdown_go');
    const engineFreqs = { nissan_350z: 90, nissan_gtr: 70, bmw_m8: 80, corvette_c6: 75 };
    Audio.startEngine(engineFreqs[selectedCar.id] || 80);
    try { NGame.ping({ screen: 'in_race', track: trackDef.name, position: 1, lap: 1 }); } catch (e) { /* ignore */ }
  };

  currentRace.onLapComplete = (lap, totalLaps) => {
    Audio.playSound('lap_complete');
    UI.showCenterMessage(`Lap ${lap}/${totalLaps}`, '#80e060', 1500);
  };

  currentRace.onPositionChange = (newPos, oldPos) => {
    const gained = newPos < oldPos;
    const diff = Math.abs(newPos - oldPos);
    UI.showCenterMessage(`${gained ? '+' : '-'}${diff}`, gained ? '#80e060' : '#e04040', 1000);
  };
}

// =================== VS RACE ===================

function startVSRace() {
  if (!selectedCar) return;

  UI.hideMenu();
  gameState = 'racing';

  const trackDef = ALL_TRACKS[Math.floor(Math.random() * ALL_TRACKS.length)];

  clearScene();

  currentRace = new RaceManager({
    trackDef,
    laps: 3,
    speedClass: '150cc',
    itemPreset: 'Normal',
    botCount: 7,
    botDifficulty: 'Medium',
  });

  setupRaceCallbacks(trackDef, 'race');

  currentRace.onRaceFinish = (results) => {
    Audio.stopEngine();
    const playerResult = results.find(r => r.isPlayer);
    Audio.playSound(playerResult.position <= 3 ? 'finish_win' : 'finish_lose');

    SaveData.load();
    SaveData.recordRaceFinish(playerResult.position, trackDef.name);

    // Achievements
    try {
      NGame.unlockAchievement('nkart_first_race');
      if (playerResult.position === 1) NGame.unlockAchievement('nkart_first_win');
      if (currentRace.playerKart.timesHit === 0) NGame.unlockAchievement('nkart_clean_race');
    } catch (e) { /* ignore */ }

    try {
      NGame.submitSession({
        score: playerResult.position === 1 ? 1000 : Math.max(0, (8 - playerResult.position) * 100),
        outcome: playerResult.position === 1 ? 'win' : playerResult.position <= 3 ? 'cashout' : 'bust',
        game_mode: 'race',
        game_version: '1.0.0',
        data: {
          track: trackDef.name, position: playerResult.position, total_racers: 8,
          best_lap: playerResult.bestLap * 1000, total_time: playerResult.time * 1000,
          car: selectedCar.id, speed_class: '150cc',
          items_used: playerResult.itemsUsed,
          hits_landed: currentRace.playerKart.hitsLanded,
          times_hit: currentRace.playerKart.timesHit, mode: 'race',
        },
      });
    } catch (e) { /* ignore */ }

    setTimeout(() => {
      gameState = 'results';
      UI.hideHUD();
      UI.showResults(results,
        () => { startVSRace(); },
        () => { backToMenu(); }
      );
    }, 2000);
  };

  setupTrackLighting(trackDef.theme);
  currentRace.init(scene, selectedCar, activeProfile.color, activeProfile.id);
  UI.showHUD();
}

function backToMenu() {
  gameState = 'menu';
  if (currentRace) {
    currentRace.cleanup(scene);
    currentRace = null;
    Audio.stopEngine();
  }
  scene.background = new THREE.Color(0x0f0f0f);
  scene.fog = new THREE.Fog(0x0f0f0f, 50, 200);
  UI.hideHUD();
  UI.hideResults();
  UI.showMenu();

  try { NGame.ping({ screen: 'in_menu' }); } catch (e) { /* ignore */ }
}

// =================== UPDATE LOOP ===================

function update(dt) {
  if (gameState === 'racing' && currentRace) {
    currentRace.update(dt);

    if (currentRace.state === 'racing' || currentRace.state === 'countdown') {
      updateCamera(dt);
      UI.updateHUD(currentRace);
      UI.updateMinimap(currentRace.track, currentRace.karts, currentRace.playerKart);

      // Update engine sound
      if (currentRace.playerKart) {
        Audio.updateEngine(currentRace.playerKart.speed, currentRace.playerKart.maxSpeed);
      }

      // Time Attack: record ghost at 20fps
      if (currentRace.state === 'racing' && currentRace.playerKart) {
        taFrameCounter += dt;
        if (taFrameCounter >= 0.05) { // 20fps
          taFrameCounter = 0;
          const k = currentRace.playerKart;
          taRecording.push({
            x: Math.round(k.position.x * 100) / 100,
            y: Math.round(k.position.y * 100) / 100,
            z: Math.round(k.position.z * 100) / 100,
            r: Math.round(k.rotation * 1000) / 1000,
            f: taRecording.length,
          });
        }

        // Replay ghost
        if (taGhostMesh && taGhostData) {
          const frame = Math.min(taRecording.length, taGhostData.length - 1);
          if (frame >= 0 && frame < taGhostData.length) {
            const gf = taGhostData[frame];
            taGhostMesh.position.set(gf.x, gf.y, gf.z);
            taGhostMesh.rotation.y = gf.r;
          }
        }
      }

      // Online: send local state at 20Hz and interpolate remote karts
      if (onlineMode && Network.connected && currentRace.state === 'racing') {
        _netSendTimer += dt;
        if (_netSendTimer >= 0.05) { // 20Hz
          _netSendTimer = 0;
          Network.sendInput(currentRace.playerKart);
        }

        // Interpolate remote player positions
        for (const pid of Object.keys(onlineRemoteKarts)) {
          const state = Network.getInterpolatedState(pid);
          if (state && onlineRemoteKarts[pid]) {
            const rk = onlineRemoteKarts[pid];
            rk.mesh.position.set(state.x, state.y, state.z);
            rk.mesh.rotation.y = state.ry;
          }
        }
      }

      // Presence ping every 45s
      if (currentRace.raceTime > 0 && Math.floor(currentRace.raceTime) % 45 === 0) {
        try {
          NGame.ping({
            screen: 'in_race',
            track: currentRace.trackDef.name,
            position: currentRace.getPlayerPosition(),
            lap: currentRace.getPlayerLap(),
          });
        } catch (e) { /* ignore */ }
      }
    }
  }
}

// =================== CAMERA ===================

const _cameraTarget = new THREE.Vector3();
const _cameraPos = new THREE.Vector3();

function updateCamera(dt) {
  if (!currentRace || !currentRace.playerKart) return;
  const kart = currentRace.playerKart;

  // Look-back
  const lookBack = Input.lookBack;
  const dirMult = lookBack ? 1 : -1;

  // Camera position: behind and above the kart
  const forward = new THREE.Vector3(
    -Math.sin(kart.rotation) * dirMult,
    0,
    -Math.cos(kart.rotation) * dirMult
  );

  const idealPos = kart.position.clone()
    .add(forward.clone().multiplyScalar(-CAMERA_DISTANCE))
    .add(new THREE.Vector3(0, CAMERA_HEIGHT, 0));

  // Smooth follow
  _cameraPos.lerp(idealPos, CAMERA_SMOOTHING + dt * 3);
  camera.position.copy(_cameraPos);

  // Look at target (slightly ahead of kart)
  const lookTarget = kart.position.clone()
    .add(forward.clone().multiplyScalar(CAMERA_LOOK_AHEAD * dirMult))
    .add(new THREE.Vector3(0, 1, 0));
  _cameraTarget.lerp(lookTarget, CAMERA_SMOOTHING + dt * 3);
  camera.lookAt(_cameraTarget);
}

// =================== ONLINE MULTIPLAYER ===================

let onlineMode = false;
let onlineRemoteKarts = {}; // profile_id -> { mesh, carDef }
let _netSendTimer = 0;

function showOnlineLobby() {
  if (!activeProfile || !selectedCar) return;
  UI.hideMenu();

  document.getElementById('online-lobby').classList.remove('hidden');
  document.getElementById('lobby-status').textContent = 'Connecting...';
  document.getElementById('lobby-players').innerHTML = '';

  // Populate track select
  const trackSelect = document.getElementById('lobby-track');
  if (trackSelect.options.length === 0) {
    for (const t of ALL_TRACKS) {
      const opt = document.createElement('option');
      opt.value = t.name;
      opt.textContent = t.name;
      trackSelect.appendChild(opt);
    }
    const rnd = document.createElement('option');
    rnd.value = 'Random';
    rnd.textContent = 'Random';
    trackSelect.appendChild(rnd);
  }

  // Connect
  Network.connect(activeProfile.id, selectedCar.id, activeProfile.color);

  Network._onConnected = () => {
    document.getElementById('lobby-status').textContent = 'Connected \u2014 nkart-crew lobby';
    Network.joinLobby();
  };

  Network._onDisconnected = (reason) => {
    document.getElementById('lobby-status').textContent = 'Disconnected: ' + reason;
  };

  Network._onLobbyState = (state) => {
    updateLobbyUI(state);
  };

  Network._onPlayerJoined = (data) => {
    document.getElementById('lobby-status').textContent = `${data.profile_id} joined`;
  };

  Network._onPlayerLeft = (data) => {
    document.getElementById('lobby-status').textContent = `${data.profile_id} left`;
  };

  Network._onRaceCountdown = (seconds) => {
    document.getElementById('online-lobby').classList.add('hidden');
    gameState = 'racing';
    onlineMode = true;
    // Race will start from race:start event
  };

  Network._onRaceStart = (data) => {
    startOnlineRace(data);
  };

  Network._onRaceResults = (data) => {
    handleOnlineResults(data);
  };

  // Settings change handlers (host only)
  const settingIds = ['lobby-track', 'lobby-speed', 'lobby-laps', 'lobby-items', 'lobby-bots', 'lobby-diff'];
  const settingKeys = ['track', 'speed_class', 'laps', 'items', 'bots', 'difficulty'];
  for (let i = 0; i < settingIds.length; i++) {
    const el = document.getElementById(settingIds[i]);
    const key = settingKeys[i];
    el.onchange = () => {
      let val = el.value;
      if (key === 'laps' || key === 'bots') val = parseInt(val);
      Network.updateSettings({ [key]: val });
    };
  }

  try { NGame.ping({ screen: 'in_lobby', mode: 'online' }); } catch (e) { /* ignore */ }
}

const CREW_COLORS = { keshawn: '#80e060', sean: '#f0c040', dart: '#e04040', amari: '#40c0e0' };
const CREW_INITIALS = { keshawn: 'K', sean: 'S', dart: 'D', amari: 'A' };
const CREW_NAMES = { keshawn: 'Keshawn', sean: 'Sean', dart: 'Dart', amari: 'Amari' };

function updateLobbyUI(state) {
  const container = document.getElementById('lobby-players');
  container.innerHTML = '';

  for (const [pid, pdata] of Object.entries(state.players)) {
    const div = document.createElement('div');
    div.className = 'lobby-player';
    const color = CREW_COLORS[pid] || '#888';
    const initial = CREW_INITIALS[pid] || pid[0].toUpperCase();
    const name = CREW_NAMES[pid] || pid;
    const isHost = pid === state.host_id;
    div.innerHTML = `
      <div class="lp-initial" style="background:${color};color:#0f0f0f;">${initial}</div>
      <div class="lp-name">${name}${isHost ? '<span class="lp-host">HOST</span>' : ''}</div>
      ${pdata.ready ? '<div class="lp-ready">READY</div>' : ''}
    `;
    container.appendChild(div);
  }

  // Update settings UI
  const isHost = Network.isHost;
  const settingsPanel = document.getElementById('lobby-settings-panel');
  const selects = settingsPanel.querySelectorAll('select');
  for (const sel of selects) {
    sel.disabled = !isHost;
    sel.style.opacity = isHost ? '1' : '0.5';
  }

  // Sync settings values from server
  document.getElementById('lobby-track').value = state.settings.track;
  document.getElementById('lobby-speed').value = state.settings.speed_class;
  document.getElementById('lobby-laps').value = state.settings.laps;
  document.getElementById('lobby-items').value = state.settings.items;
  document.getElementById('lobby-bots').value = state.settings.bots;
  document.getElementById('lobby-diff').value = state.settings.difficulty;

  // Show start button for host
  document.getElementById('lobby-start-btn').style.display = isHost ? 'block' : 'none';
}

function toggleReady() {
  Network.setReady();
}

function requestOnlineStart() {
  Network.requestStart();
}

function leaveOnlineLobby() {
  Network.disconnect();
  onlineMode = false;
  document.getElementById('online-lobby').classList.add('hidden');
  UI.showMenu();
}

function startOnlineRace(data) {
  // Find track def
  let trackDef = ALL_TRACKS.find(t => t.name === data.track);
  if (!trackDef) trackDef = ALL_TRACKS[Math.floor(Math.random() * ALL_TRACKS.length)];

  const settings = data.settings;

  clearScene();
  onlineRemoteKarts = {};

  // Create local race (player + bots, no remote players in RaceManager)
  currentRace = new RaceManager({
    trackDef,
    laps: settings.laps || 3,
    speedClass: settings.speed_class || '150cc',
    itemPreset: settings.items || 'Normal',
    botCount: settings.bots || 0,
    botDifficulty: settings.difficulty || 'Medium',
  });

  setupRaceCallbacks(trackDef, 'online');

  currentRace.onRaceFinish = (results) => {
    Audio.stopEngine();
    const playerResult = results.find(r => r.isPlayer);
    Network.sendFinish(
      Math.round(playerResult.time * 1000),
      Math.round(playerResult.bestLap * 1000),
      playerResult.position
    );
    // Wait for server results
  };

  // Create meshes for remote players
  const startPositions = data.start_positions || [];
  for (const pid of startPositions) {
    if (pid === activeProfile.id) continue;
    const carDef = CREW_CARS[pid] || Nissan350Z;
    const color = parseInt((CREW_COLORS[pid] || '#888888').replace('#', '0x'));
    const mesh = carDef.build(color);
    mesh.scale.set(0.5, 0.5, 0.5);
    scene.add(mesh);
    onlineRemoteKarts[pid] = { mesh, carDef };
  }

  setupTrackLighting(trackDef.theme);
  currentRace.init(scene, selectedCar, activeProfile.color, activeProfile.id);
  UI.showHUD();

  try { NGame.ping({ screen: 'in_race', track: trackDef.name, position: 1, lap: 1 }); } catch (e) { /* ignore */ }
}

function handleOnlineResults(data) {
  Audio.stopEngine();
  const standings = data.standings || [];
  const playerStanding = standings.find(s => s.profile_id === activeProfile.id);
  const pos = playerStanding ? playerStanding.position : 8;

  Audio.playSound(pos <= 3 ? 'finish_win' : 'finish_lose');

  try {
    NGame.submitSession({
      score: pos === 1 ? 1000 : Math.max(0, (8 - pos) * 100),
      outcome: pos === 1 ? 'win' : pos <= 3 ? 'cashout' : 'bust',
      game_mode: 'race',
      game_version: '1.0.0',
      data: {
        track: currentRace?.trackDef?.name || 'unknown',
        position: pos, total_racers: standings.length,
        car: selectedCar.id, mode: 'online',
      },
    });
    if (pos === 1) NGame.unlockAchievement('nkart_online_win');
  } catch (e) { /* ignore */ }

  // Clean up remote karts
  for (const pid of Object.keys(onlineRemoteKarts)) {
    scene.remove(onlineRemoteKarts[pid].mesh);
  }
  onlineRemoteKarts = {};

  setTimeout(() => {
    gameState = 'results';
    UI.hideHUD();
    // Build results for display
    const displayResults = standings.map((s, i) => ({
      position: s.position,
      time: s.total_time / 1000,
      bestLap: s.best_lap / 1000,
      points: [10, 7, 5, 4, 3, 2, 1, 0][i] || 0,
      isPlayer: s.profile_id === activeProfile.id,
      kart: { carDef: CREW_CARS[s.profile_id] || Nissan350Z },
      itemsUsed: 0,
    }));
    UI.showResults(displayResults,
      () => {
        // Return to lobby
        gameState = 'menu';
        onlineMode = false;
        showOnlineLobby();
      },
      () => {
        onlineMode = false;
        Network.disconnect();
        backToMenu();
      }
    );
  }, 2000);
}

// =================== OFFLINE BEACON ===================

window.addEventListener('beforeunload', () => {
  Network.disconnect();
  if (activeProfile) {
    try {
      navigator.sendBeacon(
        'https://ngames-server-production.up.railway.app/presence/offline',
        JSON.stringify({ profile_id: activeProfile.id })
      );
    } catch (e) { /* ignore */ }
  }
});

// =================== START ===================

initGame();
