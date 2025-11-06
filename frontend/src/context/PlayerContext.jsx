import { createContext, useContext, useState, useCallback } from "react";
import axios from "axios";

const defaultPlayers = [
  { id: "", name: "", isHost: false },
  { id: "", name: "", isHost: false },
  { id: "", name: "", isHost: false },
  { id: "", name: "", isHost: false },
];

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const [players, setPlayersState] = useState(defaultPlayers);

  // replace players array (expect array of { _id, name, isHost } from backend)
  const setPlayers = useCallback((next) => {
    // ensure stored array always has id field and 4 slots
    const arr = Array.isArray(next) ? next.slice(0, 4) : defaultPlayers.slice();
    const fixed = arr.map((p = {}) => ({
      id: p.id || p._id || "",
      name: p.name || "",
      isHost: !!p.isHost,
    }));
    while (fixed.length < 4) fixed.push({ id: "", name: "", isHost: false });
    setPlayersState(fixed);
  }, []);

  // load players from backend by roomCode
  const loadPlayersByRoomCode = useCallback(async (roomCode) => {
    if (!roomCode) {
      setPlayers(defaultPlayers);
      return defaultPlayers;
    }
    try {
      const res = await axios.get(`/api/v1/rooms/${encodeURIComponent(roomCode)}/players`, { withCredentials: true });
      const serverPlayers = Array.isArray(res?.data?.players) ? res.data.players : [];
      const out = defaultPlayers.slice();
      for (let i = 0; i < Math.min(serverPlayers.length, 4); i++) {
        out[i] = {
          id: serverPlayers[i]._id || "",
          name: serverPlayers[i].name || "",
          isHost: !!serverPlayers[i].isHost,
        };
      }
      setPlayersState(out);
      return out;
    } catch (err) {
      console.error("loadPlayersByRoomCode error:", err);
      setPlayersState(defaultPlayers);
      return defaultPlayers;
    }
  }, []);

  const clearPlayers = useCallback(() => setPlayersState(defaultPlayers), []);

  return (
    <PlayerContext.Provider value={{ players, setPlayers, loadPlayersByRoomCode, clearPlayers }}>
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayers = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayers must be used within a PlayerProvider");
  return ctx;
};