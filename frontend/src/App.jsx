import {BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Join from './pages/Join';
import ScrollToTop from './components/utility/ScrollToTop';
import Lobby from './pages/Lobby';
import GamePage from './pages/GamePage';

function App() {
  return (
    <>

      <Router>
      <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/join" element={<Join />} />
          <Route path="/lobby/:roomId" element={<Lobby />} />
          <Route path="/game" element={<GamePage />} />

        </Routes>
      </Router>

    </>

  )
}

export default App;
