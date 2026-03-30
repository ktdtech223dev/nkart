/**
 * ui.js — HUD, menus, results, lobby screen
 */

const UI = {
  _minimapCtx: null,

  init() {
    const minimapCanvas = document.getElementById('minimap-canvas');
    if (minimapCanvas) {
      this._minimapCtx = minimapCanvas.getContext('2d');
    }
  },

  showHUD() {
    document.getElementById('hud').classList.remove('hidden');
  },

  hideHUD() {
    document.getElementById('hud').classList.add('hidden');
  },

  updateHUD(race) {
    if (!race || !race.playerKart) return;

    const kart = race.playerKart;

    // Position
    const posEl = document.getElementById('hud-position');
    const pos = kart.position_rank;
    const suffixes = ['st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th'];
    posEl.innerHTML = `${pos}<span class="suffix">${suffixes[pos - 1]}</span>`;

    // Lap
    const lap = Math.min(kart.lap + 1, race.laps);
    document.getElementById('hud-lap').textContent = `Lap ${lap}/${race.laps}`;

    // Timer
    document.getElementById('hud-timer').textContent = formatTime(race.raceTime);

    // Speed
    document.getElementById('hud-speed').innerHTML = `${kart.getDisplaySpeed()} <span class="unit">km/h</span>`;

    // Speed class
    document.getElementById('hud-speedclass').textContent = race.speedClass;

    // Item
    const itemEl = document.getElementById('hud-item');
    if (kart.currentItem) {
      itemEl.textContent = kart.currentItem.emoji;
      itemEl.classList.remove('empty');
    } else {
      itemEl.textContent = '';
      itemEl.classList.add('empty');
    }
  },

  showCountdown(num) {
    const el = document.getElementById('hud-countdown');
    if (num > 0) {
      el.textContent = num;
      el.style.opacity = '1';
      el.style.color = '#fff';
      el.style.transform = 'translate(-50%, -50%) scale(1.2)';
      setTimeout(() => {
        el.style.transform = 'translate(-50%, -50%) scale(1)';
      }, 100);
    } else {
      el.textContent = 'GO!';
      el.style.color = '#80e060';
      el.style.opacity = '1';
      setTimeout(() => { el.style.opacity = '0'; }, 800);
    }
  },

  showCenterMessage(msg, color, duration = 2000) {
    const el = document.getElementById('hud-center-msg');
    el.textContent = msg;
    el.style.color = color || '#fff';
    el.style.opacity = '1';
    setTimeout(() => { el.style.opacity = '0'; }, duration);
  },

  updateMinimap(track, karts, playerKart) {
    if (!this._minimapCtx || !track) return;
    const ctx = this._minimapCtx;
    const w = 160, h = 160;
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = 'rgba(26, 29, 35, 0.5)';
    ctx.fillRect(0, 0, w, h);

    // Draw track outline
    if (track.trackPath) {
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const pt = track.trackPath.getPointAt(i / 100);
        const mx = (pt.x / 200 + 0.5) * w;
        const my = (pt.z / 200 + 0.5) * h;
        if (i === 0) ctx.moveTo(mx, my);
        else ctx.lineTo(mx, my);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Draw karts as dots
    const colors = {
      keshawn: '#80e060', sean: '#f0c040', dart: '#e04040', amari: '#40c0e0',
    };
    for (const kart of karts) {
      const mx = (kart.position.x / 200 + 0.5) * w;
      const my = (kart.position.z / 200 + 0.5) * h;

      ctx.fillStyle = kart === playerKart ? '#ffffff' :
        (colors[kart.carDef.owner] || '#888888');
      ctx.beginPath();
      ctx.arc(mx, my, kart === playerKart ? 4 : 3, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  showResults(results, onRestart, onMenu) {
    const overlay = document.getElementById('results-overlay');
    overlay.classList.remove('hidden');

    const playerResult = results.find(r => r.isPlayer);
    const title = playerResult.position === 1 ? 'VICTORY!' :
      playerResult.position <= 3 ? 'PODIUM FINISH' : 'RACE COMPLETE';

    let html = `<h2>${title}</h2>`;
    html += '<table id="results-table"><thead><tr><th>Pos</th><th>Racer</th><th>Time</th><th>Best Lap</th><th>Points</th></tr></thead><tbody>';
    for (const r of results) {
      const highlight = r.isPlayer ? ' style="color: #80e060; font-weight: 700;"' : '';
      const name = r.isPlayer ? 'You' : (r.kart.carDef.name || 'Bot');
      html += `<tr${highlight}>
        <td>${r.position}</td>
        <td>${name}</td>
        <td>${formatTime(r.time)}</td>
        <td>${formatTime(r.bestLap)}</td>
        <td>${r.points}</td>
      </tr>`;
    }
    html += '</tbody></table>';
    html += '<div class="results-buttons">';
    html += '<button class="menu-btn" id="btn-race-again">RACE AGAIN</button>';
    html += '<button class="menu-btn" id="btn-back-menu">MAIN MENU</button>';
    html += '</div>';

    overlay.innerHTML = html;

    document.getElementById('btn-race-again').onclick = () => {
      overlay.classList.add('hidden');
      if (onRestart) onRestart();
    };
    document.getElementById('btn-back-menu').onclick = () => {
      overlay.classList.add('hidden');
      if (onMenu) onMenu();
    };
  },

  hideResults() {
    document.getElementById('results-overlay').classList.add('hidden');
  },

  showMenu() {
    document.getElementById('menu-overlay').classList.remove('hidden');
  },

  hideMenu() {
    document.getElementById('menu-overlay').classList.add('hidden');
  },

  showProfileSelect() {
    document.getElementById('profile-select').classList.remove('hidden');
  },

  hideProfileSelect() {
    document.getElementById('profile-select').classList.add('hidden');
  },

  // =================== Grand Prix UI ===================

  showGPSelect(cups, savedMedals, nGamesCupUnlocked) {
    const container = document.getElementById('gp-cups');
    container.innerHTML = '';
    const cupNames = Object.keys(cups);
    for (const name of cupNames) {
      const locked = name === 'N Games Cup' && !nGamesCupUnlocked;
      const medal = savedMedals[name] || '';
      const medalIcon = medal === 'gold' ? '\ud83e\udd47' : medal === 'silver' ? '\ud83e\udd48' : medal === 'bronze' ? '\ud83e\udd49' : '';
      const tracks = cups[name].map(t => t.name.split(' ').slice(0, 2).join(' ')).join(', ');

      const card = document.createElement('div');
      card.className = 'cup-card' + (locked ? ' locked' : '');
      card.innerHTML = `
        <div class="cup-name">${name}</div>
        <div class="cup-tracks">${tracks}</div>
        <div class="cup-medal">${medalIcon || (locked ? '\ud83d\udd12' : '')}</div>
      `;
      if (!locked) {
        card.onclick = () => {
          const speed = document.getElementById('gp-speed').value;
          const diff = document.getElementById('gp-diff').value;
          document.getElementById('gp-select').classList.add('hidden');
          if (typeof startGrandPrix === 'function') startGrandPrix(name, speed, diff);
        };
      }
      container.appendChild(card);
    }
    document.getElementById('gp-select').classList.remove('hidden');
  },

  hideGPSelect() {
    document.getElementById('gp-select').classList.add('hidden');
  },

  showGPStandings(cupName, raceNum, totalRaces, standings, onNext) {
    const el = document.getElementById('gp-standings');
    el.classList.remove('hidden');
    document.getElementById('gp-standings-title').textContent = cupName;
    document.getElementById('gp-standings-sub').textContent = `Race ${raceNum} of ${totalRaces} complete`;

    let html = '<thead><tr><th>Pos</th><th>Racer</th><th>Points</th></tr></thead><tbody>';
    for (let i = 0; i < standings.length; i++) {
      const s = standings[i];
      const hl = s.isPlayer ? ' style="color:#80e060;font-weight:700;"' : '';
      html += `<tr${hl}><td>${i + 1}</td><td>${s.name}</td><td>${s.points}</td></tr>`;
    }
    html += '</tbody>';
    document.getElementById('gp-standings-table').innerHTML = html;

    document.getElementById('gp-next-btn').textContent = raceNum >= totalRaces ? 'VIEW RESULTS' : 'NEXT RACE';
    document.getElementById('gp-next-btn').onclick = () => {
      el.classList.add('hidden');
      if (onNext) onNext();
    };
  },

  showGPFinal(cupName, standings, medal, totalPoints) {
    const el = document.getElementById('gp-final');
    el.classList.remove('hidden');

    const medalText = medal === 'gold' ? '\ud83e\udd47 GOLD' : medal === 'silver' ? '\ud83e\udd48 SILVER' : medal === 'bronze' ? '\ud83e\udd49 BRONZE' : '';
    document.getElementById('gp-final-title').textContent = `${cupName} COMPLETE`;
    document.getElementById('gp-final-medal').textContent = medalText ? `${medalText} \u2014 ${totalPoints} pts` : `${totalPoints} pts`;
    document.getElementById('gp-final-medal').style.color = medal === 'gold' ? '#f0c040' : medal === 'silver' ? '#aaaaaa' : '#cd7f32';

    let html = '<thead><tr><th>Pos</th><th>Racer</th><th>Points</th></tr></thead><tbody>';
    for (let i = 0; i < standings.length; i++) {
      const s = standings[i];
      const hl = s.isPlayer ? ' style="color:#80e060;font-weight:700;"' : '';
      html += `<tr${hl}><td>${i + 1}</td><td>${s.name}</td><td>${s.points}</td></tr>`;
    }
    html += '</tbody>';
    document.getElementById('gp-final-table').innerHTML = html;
  },

  hideGPFinal() {
    document.getElementById('gp-final').classList.add('hidden');
  },

  // =================== Time Attack UI ===================

  showTASelect(tracks, records) {
    const container = document.getElementById('ta-tracks');
    container.innerHTML = '';
    for (const track of tracks) {
      const rec = records[track.name];
      const card = document.createElement('div');
      card.className = 'track-card';
      card.innerHTML = `
        <div class="track-name">${track.name}</div>
        <div class="track-cup">${track.cup}</div>
        <div class="track-record">${rec ? formatTime(rec / 1000) : 'No record'}</div>
      `;
      card.onclick = () => {
        document.getElementById('ta-select').classList.add('hidden');
        if (typeof startTimeAttack === 'function') startTimeAttack(track);
      };
      container.appendChild(card);
    }
    document.getElementById('ta-select').classList.remove('hidden');
  },

  hideTASelect() {
    document.getElementById('ta-select').classList.add('hidden');
  },
};

function formatTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) return '0:00.000';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

function getPositionSuffix(pos) {
  if (pos === 1) return 'st';
  if (pos === 2) return 'nd';
  if (pos === 3) return 'rd';
  return 'th';
}
