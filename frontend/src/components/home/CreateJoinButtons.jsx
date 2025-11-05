import { useNavigate } from "react-router-dom";
import { useRoom } from "../../context/RoomContext";
import { usePlayers } from "../../context/PlayerContext";
import { useSocket } from "../../context/SocketContext";
import { useState } from "react";
import axios from "axios";

export default function CreateJoinButtons() {
  const navigate = useNavigate();
  const { setRoomCode } = useRoom();

  // safe access to PlayerContext (avoid destructure error when provider missing)
  const playersCtx = usePlayers();
  const setPlayers = playersCtx?.setPlayers ?? (() => {});

  const { setRegisterData } = useSocket();
  const [nickname, setNickname] = useState("");
  const [showError, setShowError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = async () => {
    if (!nickname.trim()) {
      setShowError(true);
      return;
    }
    setShowError(false);
    setLoading(true);

    try {
      const res = await axios.post(
        "/api/v1/rooms/generate-room",
        { name: nickname },
        { withCredentials: true }
      );

      const host = res?.data?.host;
      const room = res?.data?.room;
      if (!room || !room.roomCode || !host) {
        throw new Error("Invalid response from server");
      }

      // set roomCode in context for other pages
      setRoomCode(room.roomCode);

      // use setPlayers safely (no-op if provider not mounted)
      setPlayers([
        { name: host.name || nickname, isHost: true },
        { name: "", isHost: false },
        { name: "", isHost: false },
        { name: "", isHost: false },
      ]);

      // tell SocketContext to connect & register this host socket with server (use DB room._id)
      setRegisterData({ userId: host._id, roomId: room._id });

      // navigate host to lobby using roomCode
      navigate(`/lobby/${room.roomCode}`);
    } catch (err) {
      console.error("Create room failed:", err);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = () => {
    navigate("/join");
  };

  return (
    <>
      <input
        type="text"
        placeholder="Enter your Nickname"
        className="w-full mt-4 max-w-sm px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        disabled={loading}
      />
      {showError && (
        <p className="text-red-500 text-sm mt-1">
          Please enter a valid nickname or try again
        </p>
      )}
      <div className="flex flex-col items-center space-y-3 w-full max-w-sm mt-2">
        <button
          onClick={handleCreateRoom}
          className="bg-yellow-400 hover:bg-yellow-500 w-full py-2 font-semibold rounded-md shadow-md transition duration-200"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Room"}
        </button>

        <p className="text-sm text-gray-500">or</p>

        <button
          onClick={handleJoinRoom}
          className="bg-yellow-400 hover:bg-yellow-500 w-full py-2 font-semibold rounded-md shadow-md transition duration-200"
          disabled={loading}
        >
          Join Room
        </button>
      </div>
    </>
  );
}