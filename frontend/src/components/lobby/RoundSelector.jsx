import { useEffect, useState } from "react";
import axios from "axios";
import { useRoom } from "../../context/RoomContext";

const options = [10, 15, 20, 25];

export default function RoundSelector() {
  const { roomCode, selectedRounds, setSelectedRounds } = useRoom();
  const [selected, setSelected] = useState(selectedRounds || null);
  const [isHost, setIsHost] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // keep local selected in sync with context value
    setSelected(selectedRounds || null);
  }, [selectedRounds]);

  useEffect(() => {
    let mounted = true;
    if (!roomCode) {
      setIsHost(false);
      setChecking(false);
      return;
    }
    (async () => {
      try {
        setChecking(true);
        const res = await axios.get(`/api/v1/rooms/${encodeURIComponent(roomCode)}/is-host`, {
          withCredentials: true,
        });
        if (!mounted) return;
        setIsHost(Boolean(res?.data?.isHost));
      } catch (err) {
        setIsHost(false);
      } finally {
        if (mounted) setChecking(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [roomCode]);

  const onSelect = (opt) => {
    if (!isHost) return;
    setSelected(opt);
    // persist selection to RoomContext so Lobby can read it
    setSelectedRounds(opt);
  };

  return (
    <div className="text-center mt-4">
      <p className="text-sm font-[Sunflower] mb-2">How many Rounds?</p>
      <div className="grid grid-cols-2 gap-2 w-[160px] mx-auto">
        {options.map((opt) => {
          const active = selected === opt;
          const base = "py-1 rounded-md text-sm font-bold transition w-full";
          const hostEnabledClass = active ? "bg-yellow-600 text-white" : "bg-yellow-300 hover:bg-yellow-400 text-black";
          const disabledClass = !isHost && !checking ? "opacity-50 cursor-not-allowed" : "";
          return (
            <button
              key={opt}
              className={`${base} ${hostEnabledClass} ${disabledClass}`}
              onClick={() => onSelect(opt)}
              disabled={!isHost || checking}
              title={!isHost ? "Only host can select rounds" : `Select ${opt} rounds`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {!isHost && !checking && <p className="text-xs text-gray-500 mt-2">Only the host can select rounds</p>}
    </div>
  );
}
