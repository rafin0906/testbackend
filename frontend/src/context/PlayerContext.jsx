import { createContext, useContext, useState } from "react";

const defaultPlayers = [
  { name: "", isHost: false },
  { name: "", isHost: false },
  { name: "", isHost: false },
  { name: "", isHost: false },
];

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const [players, setPlayers] = useState(defaultPlayers);

  return (
    <PlayerContext.Provider value={{ players, setPlayers }}>
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayers = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayers must be used within a PlayerProvider");
  return ctx;
};