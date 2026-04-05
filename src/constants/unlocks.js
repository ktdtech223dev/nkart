export const AVATARS = [
  { id: 'volta',   name: 'VOLTA',   theme: 'Electric',  locked: false },
  { id: 'cinder',  name: 'CINDER',  theme: 'Fire',      locked: false },
  { id: 'echo',    name: 'ECHO',    theme: 'Sound',     locked: false },
  { id: 'terra',   name: 'TERRA',   theme: 'Earth',     locked: false },
  { id: 'nova',    name: 'NOVA',    theme: 'Cosmic',    locked: false },
  { id: 'surge',   name: 'SURGE',   theme: 'Storm',     locked: false },
  { id: 'rift',    name: 'RIFT',    theme: 'Digital',   locked: true, unlockReq: 'Dorm Cup Gold' },
  { id: 'phantom', name: 'PHANTOM', theme: 'Shadow',    locked: true, unlockReq: 'All 7 Cups Gold' },
];

export const KART_BODIES = [
  { id: 'classic',  name: 'Classic Kart',  locked: false },
  { id: 'muscle',   name: 'Muscle Kart',   locked: false },
  { id: 'wedge',    name: 'Wedge Kart',    locked: true, unlockReq: 'City Cup Complete' },
  { id: 'bubble',   name: 'Bubble Kart',   locked: true, unlockReq: 'Dorm Cup Complete' },
  { id: 'flat',     name: 'Flat Kart',     locked: true, unlockReq: 'Nature Cup Complete' },
  { id: 'pipe',     name: 'Pipe Kart',     locked: true, unlockReq: 'Pirate Cup Complete' },
  { id: 'wing',     name: 'Wing Kart',     locked: true, unlockReq: 'Arcade Cup Complete' },
  { id: 'box',      name: 'Box Kart',      locked: true, unlockReq: 'Volcano Cup Complete' },
  { id: 'dragon',   name: 'Dragon Kart',   locked: true, unlockReq: 'Space Cup Complete' },
  { id: 'circuit',  name: 'Circuit Kart',  locked: true, unlockReq: 'Shadow Cup Complete' },
  { id: 'phantom',  name: 'Phantom Kart',  locked: true, unlockReq: 'All 7 Cups Gold' },
  { id: 'void',     name: 'Void Kart',     locked: true, unlockReq: 'Shadow Cup Gold' },
];

export const WHEELS = [
  { id: 'standard', name: 'Standard',  locked: false },
  { id: 'slick',    name: 'Slick',     locked: false },
  { id: 'offroad',  name: 'Off-Road',  locked: true, unlockReq: 'Dorm Cup Complete' },
  { id: 'cyber',    name: 'Cyber',     locked: true, unlockReq: 'City Cup Complete' },
  { id: 'wooden',   name: 'Wooden',    locked: true, unlockReq: 'Pirate Cup Complete' },
  { id: 'cloud',    name: 'Cloud',     locked: true, unlockReq: 'Nature Cup Complete' },
  { id: 'crystal',  name: 'Crystal',   locked: true, unlockReq: 'Arcade Cup Complete' },
  { id: 'spike',    name: 'Spike',     locked: true, unlockReq: 'Volcano Cup Complete' },
  { id: 'chrome',   name: 'Chrome',    locked: true, unlockReq: 'Space Cup Complete' },
  { id: 'pixel',    name: 'Pixel',     locked: true, unlockReq: 'Arcade Cup Gold' },
  { id: 'donut',    name: 'Donut',     locked: true, unlockReq: 'All 7 Cups Gold' },
  { id: 'shadow',   name: 'Shadow',    locked: true, unlockReq: 'Shadow Cup Gold' },
];

export const SPOILERS = [
  { id: 'none',          name: 'None',          locked: false },
  { id: 'standard_wing', name: 'Standard Wing', locked: false },
  { id: 'high_wing',     name: 'High Wing',     locked: true, unlockReq: 'Dorm Cup Gold' },
  { id: 'twin_wing',     name: 'Twin Wing',     locked: true, unlockReq: 'Pirate Cup Gold' },
  { id: 'tri_wing',      name: 'Tri-Wing',      locked: true, unlockReq: 'City Cup Gold' },
  { id: 'dragon_fin',    name: 'Dragon Fin',    locked: true, unlockReq: 'Nature Cup Gold' },
  { id: 'circuit_board', name: 'Circuit Board',  locked: true, unlockReq: 'Arcade Cup Gold' },
  { id: 'flame_tail',    name: 'Flame Tail',    locked: true, unlockReq: 'Volcano Cup Gold' },
  { id: 'antenna_array', name: 'Antenna Array',  locked: true, unlockReq: 'Space Cup Gold' },
  { id: 'shadow_shroud', name: 'Shadow Shroud',  locked: true, unlockReq: 'Shadow Cup Complete' },
];

export const DECALS = [
  { id: 'clean',       name: 'Clean',        locked: false },
  { id: 'lightning',   name: 'Lightning',     locked: false },
  { id: 'flame',       name: 'Flame',         locked: false },
  { id: 'stars',       name: 'Stars',         locked: true, unlockReq: 'Space Cup Complete' },
  { id: 'circuit',     name: 'Circuit',       locked: true, unlockReq: 'City Cup Complete' },
  { id: 'vines',       name: 'Vines',         locked: true, unlockReq: 'Nature Cup Complete' },
  { id: 'waves',       name: 'Waves',         locked: true, unlockReq: 'Nature Cup Gold' },
  { id: 'glitch',      name: 'Glitch',        locked: true, unlockReq: 'Arcade Cup Complete' },
  { id: 'camo',        name: 'Camo',          locked: true, unlockReq: 'Volcano Cup Complete' },
  { id: 'checker',     name: 'Checker',       locked: true, unlockReq: 'City Cup Gold' },
  { id: 'dragon',      name: 'Dragon',        locked: true, unlockReq: 'Volcano Cup Gold' },
  { id: 'void_cracks', name: 'Void Cracks',   locked: true, unlockReq: 'Shadow Cup Complete' },
  { id: 'n_games_logo',name: 'N Games Logo',  locked: true, unlockReq: 'Space Cup Gold' },
  { id: 'dorm_life',   name: 'Dorm Life',     locked: true, unlockReq: 'Dorm Cup Complete' },
  { id: 'pirate_flag', name: 'Pirate Flag',   locked: true, unlockReq: 'Pirate Cup Complete' },
  { id: 'grand_line',  name: 'Grand Line',    locked: true, unlockReq: 'Pirate Cup Gold' },
];

export const RACE_POINTS = [15, 12, 10, 8, 6, 4, 2, 1];
