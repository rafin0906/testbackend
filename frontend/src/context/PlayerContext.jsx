import { createContext, useContext, useState } from "react";

const defaultSlots = [
  { name: "", isHost: false },
  { name: "", isHost: false },
  { name: "", isHost: false },
  { name: "", isHost: false },
];

// provide safe defaults so usePlayers() won't be undefined if provider is missing
const PlayerContext = createContext({
  players: defaultSlots,
  setPlayers: () => {},
  setPlayerAt: () => {},
  addOrUpdatePlayer: () => {},
  resetPlayers: () => {},
});

export function PlayerProvider({ children }) {
  const [players, setPlayers] = useState(defaultSlots);

  const setPlayerAt = (index, player) => {
    setPlayers((prev) => {
      const next = prev.slice();
      next[index] = { ...next[index], ...player };
      return next;
    });
  };

  const addOrUpdatePlayer = (player) => {
    setPlayers((prev) => {
      const next = prev.slice();
      const idx = next.findIndex((p) => p.name && player.name && p.name === player.name);
      if (idx !== -1) {
        next[idx] = { ...next[idx], ...player };
        return next;
      }
      const empty = next.findIndex((p) => !p.name);
      if (empty !== -1) {
        next[empty] = { ...next[empty], ...player };
      }
      return next;
    });
  };

  const resetPlayers = () => setPlayers(defaultSlots);

  return (
    <PlayerContext.Provider value={{ players, setPlayers, setPlayerAt, addOrUpdatePlayer, resetPlayers }}>
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayers = () => useContext(PlayerContext);