import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PositionDisplay from './hud/PositionDisplay.jsx';
import LapCounter from './hud/LapCounter.jsx';
import RaceTimer from './hud/RaceTimer.jsx';
import ItemDisplay from './hud/ItemDisplay.jsx';
import Minimap from './hud/Minimap.jsx';
import SpeedBar from './hud/SpeedBar.jsx';
import NotificationStack from './hud/NotificationStack.jsx';
import CountdownOverlay from './hud/CountdownOverlay.jsx';
import FinishOverlay from './hud/FinishOverlay.jsx';

export default function HUD({ gameState }) {
  const {
    position = 1,
    lap = 1,
    totalLaps = 3,
    raceTime = 0,
    lapTime = 0,
    bestLapTime = null,
    speed = 0,
    maxSpeed = 28,
    item = null,
    itemCount = 0,
    driftCharge = 0,
    driftLevel = 0,
    surfaceType = 'default',
    countdown = -1,
    finished = false,
    finishPosition = 0,
    players = [],
    trackCurve = null,
    notifications = [],
  } = gameState || {};

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20, fontFamily: "'Rajdhani', sans-serif" }}>
      {/* Countdown */}
      <AnimatePresence>
        {countdown >= 0 && countdown <= 3 && <CountdownOverlay count={countdown} />}
      </AnimatePresence>

      {/* Finish overlay */}
      <AnimatePresence>
        {finished && <FinishOverlay position={finishPosition} />}
      </AnimatePresence>

      {/* Position - top left */}
      <PositionDisplay position={position} />

      {/* Lap counter - top center */}
      <LapCounter lap={lap} totalLaps={totalLaps} />

      {/* Race timer - top right */}
      <RaceTimer raceTime={raceTime} lapTime={lapTime} bestLapTime={bestLapTime} />

      {/* Speed bar - bottom left */}
      <SpeedBar speed={speed} maxSpeed={maxSpeed} driftCharge={driftCharge} driftLevel={driftLevel} surfaceType={surfaceType} />

      {/* Item display - bottom center */}
      <ItemDisplay item={item} itemCount={itemCount} />

      {/* Minimap - bottom right */}
      <Minimap players={players} trackCurve={trackCurve} />

      {/* Notifications - center */}
      <NotificationStack notifications={notifications} />
    </div>
  );
}
