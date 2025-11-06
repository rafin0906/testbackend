import { createContext, useContext, useState, useCallback } from "react";
import axios from "axios";

const RoomContext = createContext(null);

export function RoomProvider({ children }) {
  const [roomCode, setRoomCodeState] = useState("");
  const [room, setRoom] = useState(null);

  const setRoomCode = useCallback((code) => {
    setRoomCodeState(code || "");
  }, []);

  // load room data from backend by roomCode
  const loadRoomByCode = useCallback(async (code) => {
    if (!code) return null;
    try {
      console.log("here");
      // backend endpoint should return { room }
      const res = await axios.get(`/api/v1/rooms/by-code/${encodeURIComponent(code)}`, { withCredentials: true });
      const serverRoom = res?.data?.room || null;
      if (serverRoom) {
        setRoomCodeState(code);
        setRoom(serverRoom);
      }
      return serverRoom;
    } catch (err) {
      console.error("loadRoomByCode error:", err);
      setRoom(null);
      return null;
    }
  }, []);

  const clearRoom = useCallback(() => {
    setRoomCodeState("");
    setRoom(null);
  }, []);

  return (
    <RoomContext.Provider value={{ roomCode, room, setRoomCode, loadRoomByCode, clearRoom }}>
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("useRoom must be used within RoomProvider");
  return ctx;
}
