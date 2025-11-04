import { createContext, useContext, useState } from 'react';
import { nanoid } from 'nanoid';

const RoomContext = createContext();

export function RoomProvider({ children }) {
  const [roomCode, setRoomCode] = useState(nanoid(10)); // 10-character code

  const regenerateCode = () => {
    const newCode = nanoid(10);
    setRoomCode(newCode);
  };

  return (
    <RoomContext.Provider value={{ roomCode, regenerateCode }}>
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  return useContext(RoomContext);
}
