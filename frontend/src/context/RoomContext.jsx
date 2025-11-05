import { createContext, useContext, useState } from "react";

const RoomContext = createContext();

export function RoomProvider({ children }) {
  const [roomCode, setRoomCode] = useState("");

  return (
    <RoomContext.Provider value={{ roomCode, setRoomCode }}>
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  return useContext(RoomContext);
}
