import { Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import MainMenu from './screens/MainMenu.jsx';
import Customize from './screens/Customize.jsx';
import LobbyBrowser from './screens/LobbyBrowser.jsx';
import LobbyRoom from './screens/LobbyRoom.jsx';
import Race from './screens/Race.jsx';
import Results from './screens/Results.jsx';
import CupResults from './screens/CupResults.jsx';
import Leaderboard from './screens/Leaderboard.jsx';
import Settings from './screens/Settings.jsx';

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/customize" element={<Customize />} />
        <Route path="/lobby" element={<LobbyBrowser />} />
        <Route path="/lobby/:id" element={<LobbyRoom />} />
        <Route path="/race" element={<ErrorBoundary><Race /></ErrorBoundary>} />
        <Route path="/results" element={<Results />} />
        <Route path="/cup-results" element={<CupResults />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </ErrorBoundary>
  );
}
