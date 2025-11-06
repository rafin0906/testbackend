import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { useRoom } from "../../context/RoomContext";
import { usePlayers } from "../../context/PlayerContext";

export default function JoinButton({ roomCode: propRoomCode, nickname: propNickname }) {
  const navigate = useNavigate();
  const { setRoomCode } = useRoom();
  const { players, setPlayers } = usePlayers();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    const roomCode = (propRoomCode || "").trim();
    const nickname = (propNickname || "").trim();

    if (!roomCode) {
      setError("Please enter a valid room code!");
      return;
    }
    if (!nickname) {
      setError("Please enter your nickname!");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await axios.post(
        "/api/v1/rooms/join",
        { name: nickname, roomCode },
        { withCredentials: true }
      );

      const user = res?.data?.user;
      const room = res?.data?.room;
      if (!user || !room || !room.roomCode) {
        throw new Error("Invalid response from server");
      }

      // persist roomCode in context (so other pages can read it)
      setRoomCode(room.roomCode);

      // update players context: place joined user in first empty slot
      setPlayers((prev = []) => {
        const next = Array.isArray(prev) ? prev.slice() : [];
        // ensure 4 slots
        while (next.length < 4) next.push({ name: "", isHost: false });
        const emptyIdx = next.findIndex((p) => !p || !p.name);
        const targetIdx = emptyIdx !== -1 ? emptyIdx : next.length - 1;
        next[targetIdx] = { name: user.name || nickname, isHost: user.isHost || false };
        return next;
      });

      // navigate to lobby
      navigate(`/lobby/${room.roomCode}`, { state: { nickname } });
    } catch (err) {
      console.error("Join room failed:", err);
      setError(err?.response?.data?.message || "Failed to join room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {error && (
        <div className="text-red-600 text-sm mb-2 font-[Sunflower]">{error}</div>
      )}

      <button
        className="w-[240px] mt-3 py-2 rounded-md bg-yellow-400 text-black font-bold shadow-md hover:bg-yellow-500 transition-all font-[Sunflower]"
        onClick={handleJoin}
        disabled={loading}
      >
        {loading ? "Joining..." : "Join"}
      </button>
    </div>
  );
}
