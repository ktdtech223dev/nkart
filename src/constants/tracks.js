export const CUPS = [
  { id: 'dorm',    name: 'DORM CUP',    icon: '🏠', locked: false },
  { id: 'pirate',  name: 'PIRATE CUP',  icon: '🏴‍☠️', locked: false },
  { id: 'city',    name: 'CITY CUP',    icon: '🏙️', locked: false },
  { id: 'nature',  name: 'NATURE CUP',  icon: '🌿', locked: false },
  { id: 'arcade',  name: 'ARCADE CUP',  icon: '🕹️', locked: false },
  { id: 'volcano', name: 'VOLCANO CUP', icon: '🌋', locked: false },
  { id: 'space',   name: 'SPACE CUP',   icon: '🚀', locked: false },
  { id: 'shadow',  name: 'SHADOW CUP',  icon: '👁️', locked: true },
];

export const TRACKS = [
  // Dorm Cup
  { id: 'desk_dash',           name: 'DESK DASH',           cup: 'dorm',    cupIndex: 0, lapCount: 3 },
  { id: 'snack_attack',        name: 'SNACK ATTACK',        cup: 'dorm',    cupIndex: 1, lapCount: 3 },
  { id: 'laundry_loop',        name: 'LAUNDRY LOOP',        cup: 'dorm',    cupIndex: 2, lapCount: 3 },
  { id: 'bathroom_blitz',      name: 'BATHROOM BLITZ',      cup: 'dorm',    cupIndex: 3, lapCount: 3 },
  // Pirate Cup
  { id: 'grand_line_galleon',  name: 'GRAND LINE GALLEON',  cup: 'pirate',  cupIndex: 0, lapCount: 3 },
  { id: 'fishman_island_reef', name: 'FISHMAN ISLAND REEF', cup: 'pirate',  cupIndex: 1, lapCount: 3 },
  { id: 'marineford_ruins',    name: 'MARINEFORD RUINS',    cup: 'pirate',  cupIndex: 2, lapCount: 3 },
  { id: 'skypiea_circuit',     name: 'SKYPIEA CIRCUIT',     cup: 'pirate',  cupIndex: 3, lapCount: 3 },
  // City Cup
  { id: 'downtown_drift',      name: 'DOWNTOWN DRIFT',      cup: 'city',    cupIndex: 0, lapCount: 3 },
  { id: 'subway_surge',        name: 'SUBWAY SURGE',        cup: 'city',    cupIndex: 1, lapCount: 3 },
  { id: 'rooftop_rally',       name: 'ROOFTOP RALLY',       cup: 'city',    cupIndex: 2, lapCount: 3 },
  { id: 'construction_chaos',  name: 'CONSTRUCTION CHAOS',  cup: 'city',    cupIndex: 3, lapCount: 3 },
  // Nature Cup
  { id: 'jungle_canopy',       name: 'JUNGLE CANOPY',       cup: 'nature',  cupIndex: 0, lapCount: 3 },
  { id: 'mountain_pass',       name: 'MOUNTAIN PASS',       cup: 'nature',  cupIndex: 1, lapCount: 3 },
  { id: 'crystal_cave',        name: 'CRYSTAL CAVE',        cup: 'nature',  cupIndex: 2, lapCount: 3 },
  { id: 'frozen_tundra',       name: 'FROZEN TUNDRA',       cup: 'nature',  cupIndex: 3, lapCount: 3 },
  // Arcade Cup
  { id: 'circuit_board',       name: 'CIRCUIT BOARD',       cup: 'arcade',  cupIndex: 0, lapCount: 3 },
  { id: 'pixel_world',         name: 'PIXEL WORLD',         cup: 'arcade',  cupIndex: 1, lapCount: 3 },
  { id: 'neon_arcade',         name: 'NEON ARCADE',         cup: 'arcade',  cupIndex: 2, lapCount: 3 },
  { id: 'glitch_zone',         name: 'GLITCH ZONE',         cup: 'arcade',  cupIndex: 3, lapCount: 3 },
  // Volcano Cup
  { id: 'lava_flow',           name: 'LAVA FLOW',           cup: 'volcano', cupIndex: 0, lapCount: 3 },
  { id: 'storm_coast',         name: 'STORM COAST',         cup: 'volcano', cupIndex: 1, lapCount: 3 },
  { id: 'sand_dune_rally',     name: 'SAND DUNE RALLY',     cup: 'volcano', cupIndex: 2, lapCount: 3 },
  { id: 'glacier_pass',        name: 'GLACIER PASS',        cup: 'volcano', cupIndex: 3, lapCount: 3 },
  // Space Cup
  { id: 'lunar_base',          name: 'LUNAR BASE',          cup: 'space',   cupIndex: 0, lapCount: 3 },
  { id: 'asteroid_belt',       name: 'ASTEROID BELT',       cup: 'space',   cupIndex: 1, lapCount: 3 },
  { id: 'space_station_interior', name: 'SPACE STATION',    cup: 'space',   cupIndex: 2, lapCount: 3 },
  { id: 'alien_planet',        name: 'ALIEN PLANET',        cup: 'space',   cupIndex: 3, lapCount: 3 },
  // Shadow Cup
  { id: 'nightmare_dorm',      name: 'NIGHTMARE DORM',      cup: 'shadow',  cupIndex: 0, lapCount: 3 },
  { id: 'cursed_seas',         name: 'CURSED SEAS',         cup: 'shadow',  cupIndex: 1, lapCount: 3 },
  { id: 'corrupted_arcade',    name: 'CORRUPTED ARCADE',    cup: 'shadow',  cupIndex: 2, lapCount: 3 },
  { id: 'the_void',            name: 'THE VOID',            cup: 'shadow',  cupIndex: 3, lapCount: 3 },
];

export const getTracksByCup = (cupId) => TRACKS.filter(t => t.cup === cupId);
export const getTrackById = (trackId) => TRACKS.find(t => t.id === trackId);
