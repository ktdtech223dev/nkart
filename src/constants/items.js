export const ITEM_TYPES = {
  BOOST_SHELL:         'boost_shell',
  HOMING_SHELL:        'homing_shell',
  TRIPLE_BOOST_SHELLS: 'triple_boost_shells',
  TRIPLE_HOMING_SHELLS:'triple_homing_shells',
  BANANA_PEEL:         'banana_peel',
  BOOST_STAR:          'boost_star',
  LIGHTNING_BOLT:      'lightning_bolt',
  GRAVITY_BOMB:        'gravity_bomb',
  MUSHROOM_BOOST:      'mushroom_boost',
  TRIPLE_MUSHROOM:     'triple_mushroom',
  BOO_GHOST:           'boo_ghost',
  THUNDERCLOUD:        'thundercloud',
  FAKE_ITEM_BOX:       'fake_item_box',
  CORRUPTED_SHELL:     'corrupted_shell',
};

export const ITEM_DISPLAY = {
  [ITEM_TYPES.BOOST_SHELL]:         { name: 'Boost Shell',         color: '#4488FF', icon: '🔵' },
  [ITEM_TYPES.HOMING_SHELL]:        { name: 'Homing Shell',        color: '#FF4444', icon: '🔴' },
  [ITEM_TYPES.TRIPLE_BOOST_SHELLS]: { name: 'Triple Boost Shells', color: '#4488FF', icon: '🔵×3' },
  [ITEM_TYPES.TRIPLE_HOMING_SHELLS]:{ name: 'Triple Homing Shells',color: '#FF4444', icon: '🔴×3' },
  [ITEM_TYPES.BANANA_PEEL]:         { name: 'Banana Peel',         color: '#FFDD00', icon: '🍌' },
  [ITEM_TYPES.BOOST_STAR]:          { name: 'Boost Star',          color: '#FFD700', icon: '⭐' },
  [ITEM_TYPES.LIGHTNING_BOLT]:      { name: 'Lightning Bolt',      color: '#FFFF00', icon: '⚡' },
  [ITEM_TYPES.GRAVITY_BOMB]:        { name: 'Gravity Bomb',        color: '#2233AA', icon: '💣' },
  [ITEM_TYPES.MUSHROOM_BOOST]:      { name: 'Mushroom Boost',      color: '#FF8800', icon: '🍄' },
  [ITEM_TYPES.TRIPLE_MUSHROOM]:     { name: 'Triple Mushroom',     color: '#FF8800', icon: '🍄×3' },
  [ITEM_TYPES.BOO_GHOST]:           { name: 'Boo Ghost',           color: '#FFFFFF', icon: '👻' },
  [ITEM_TYPES.THUNDERCLOUD]:        { name: 'Thundercloud',        color: '#555555', icon: '🌩️' },
  [ITEM_TYPES.FAKE_ITEM_BOX]:       { name: 'Fake Item Box',       color: '#FF0000', icon: '❓' },
  [ITEM_TYPES.CORRUPTED_SHELL]:     { name: 'Corrupted Shell',     color: '#1A0A2E', icon: '⚫' },
};

// Position-weighted item distribution (index 0 = 1st place, index 7 = 8th place)
export const ITEM_DISTRIBUTION = {
  [ITEM_TYPES.BOOST_SHELL]:         [30, 25, 20, 15, 10,  5,  3,  2],
  [ITEM_TYPES.TRIPLE_BOOST_SHELLS]: [ 3,  8, 12, 15, 15, 14, 10,  8],
  [ITEM_TYPES.HOMING_SHELL]:        [ 5, 12, 18, 20, 20, 15, 10,  6],
  [ITEM_TYPES.TRIPLE_HOMING_SHELLS]:[ 0,  3,  6, 10, 15, 20, 22, 20],
  [ITEM_TYPES.BANANA_PEEL]:         [25, 18, 14, 10,  7,  4,  3,  2],
  [ITEM_TYPES.BOOST_STAR]:          [ 0,  0,  1,  3,  5, 10, 14, 18],
  [ITEM_TYPES.LIGHTNING_BOLT]:      [ 0,  0,  0,  1,  3,  6, 10, 15],
  [ITEM_TYPES.GRAVITY_BOMB]:        [ 0,  0,  2,  3,  5,  8, 10, 12],
  [ITEM_TYPES.MUSHROOM_BOOST]:      [22, 18, 12,  8,  5,  3,  3,  3],
  [ITEM_TYPES.TRIPLE_MUSHROOM]:     [ 5,  8,  8,  8,  8,  8,  8,  7],
  [ITEM_TYPES.BOO_GHOST]:           [ 5,  5,  4,  3,  3,  4,  4,  4],
  [ITEM_TYPES.THUNDERCLOUD]:        [ 5,  3,  3,  4,  4,  3,  3,  3],
};

export const SHELL_PHYSICS = {
  BOOST_SHELL_SPEED: 40.0,
  HOMING_SHELL_SPEED: 35.0,
  HOMING_SHELL_TURN_RATE: Math.PI / 4, // 45 deg/s
  SHELL_HIT_RADIUS: 0.6,
  BOOST_SHELL_MAX_BOUNCES: 1,
  BOOST_SHELL_LIFETIME: 6.0,
  HOMING_SHELL_LIFETIME: 10.0,
  GRAVITY_BOMB_RADIUS: 2.5,
};

export const ITEM_EFFECTS = {
  STUN_DURATION: 1.2,
  LONG_STUN_DURATION: 2.5,
  BANANA_SPIN_DURATION: 0.8,
  STAR_DURATION: 6.0,
  STAR_SPEED_MULT: 1.4,
  LIGHTNING_SHRINK_DURATION: 5.0,
  LIGHTNING_SPEED_MULT: 0.65,
  LIGHTNING_MINI_SCALE: 0.4,
  BOO_INVISIBLE_DURATION: 3.0,
  THUNDERCLOUD_DURATION: 8.0,
  THUNDERCLOUD_STUN: 2.0,
  THUNDERCLOUD_SHRINK: 3.0,
  CORRUPTED_INVERT_DURATION: 3.0,
  MUSHROOM_BOOST_DURATION: 2.5,
  MUSHROOM_BOOST_MULT: 1.6,
  FAKE_BOX_DETECT_RADIUS: 1.0,
  FAKE_BOX_EXPLODE_RADIUS: 2.0,
  FAKE_BOX_STUN: 1.0,
  MAX_BANANA_PER_PLAYER: 2,
};

export const RACE_POINTS = [15, 12, 10, 8, 6, 4, 2, 1];

export const ITEM_BOX_RESPAWN_TIME = 8.0;
