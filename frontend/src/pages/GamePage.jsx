import React, { useEffect, useRef, useState } from "react";
import PlayerGrid from "../components/gamepage/PlayerGrid";
import RoleCard from "../components/gamepage/RoleCard";
import BackArrow from "../components/utility/BackArrow";
// removed Timer import - replaced with inline synced timer UI
import LeaderBoard from "../components/gamepage/LeaderBoard";

import demo1 from "../assets/demo_profile/demo1.png";
import demo2 from "../assets/demo_profile/demo2.png";
import demo3 from "../assets/demo_profile/demo3.png";
import demo4 from "../assets/demo_profile/demo4.png";

import { usePlayers } from "../context/PlayerContext";
import { useRoom } from "../context/RoomContext";
import { useParams, useLocation } from "react-router-dom";
import { io } from "socket.io-client";

const GamePage = () => {
  const { players, loadPlayersByRoomCode } = usePlayers(); // players: [{ id, name, isHost }, ...]
  const { roomCode: ctxRoomCode } = useRoom();
  const { roomCode: paramRoomCode } = useParams();
  const location = useLocation();

  // Timer state: timeLeft (seconds) and totalTime for progress calculation
  const [timeLeft, setTimeLeft] = useState(null);
  const [totalTime, setTotalTime] = useState(null);
  const [roundNumber, setRoundNumber] = useState(null);
  const [instruction, setInstruction] = useState(null);

  const socketRef = useRef(null);
  const timerRef = useRef(null);

  // ensure we fetch fresh players from backend on mount / reload
  useEffect(() => {
    const code = ctxRoomCode || paramRoomCode || location.state?.roomCode || null;
    if (!code) {
      console.warn("GamePage: no roomCode available to load players");
      return;
    }

    let mounted = true;
    (async () => {
      try {
        await loadPlayersByRoomCode(code);
        if (!mounted) return;
        // console.log("GamePage: loaded players for roomCode:", code);
      } catch (err) {
        console.error("GamePage: failed to load players:", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [ctxRoomCode, paramRoomCode, location.state?.roomCode, loadPlayersByRoomCode]);

  // create socket, join room and listen for round events
  useEffect(() => {
    const code = ctxRoomCode || paramRoomCode || location.state?.roomCode || null;
    if (!code) return;

    const socket = io("http://localhost:8000", { withCredentials: true });
    socketRef.current = socket;

    socket.on("connect", () => {
      // console.log("GamePage socket connected:", socket.id);
      const navUserId = location.state?.userId;
      if (navUserId) {
        socket.emit("register", { userId: navUserId, roomCode: code });
      } else {
        socket.emit("joinRoomSocket", { roomCode: code });
      }
    });

    // start timer when backend announces a new round
    socket.on("roundStarted", (payload) => {
      console.log("roundStarted payload:", payload);
      const seconds =
        typeof payload?.time === "number"
          ? payload.time
          : (payload?.time && Number.parseInt(payload.time, 10)) || 15;
      // set both totalTime and timeLeft so UI can compute progress
      setTotalTime(seconds);
      setRoundNumber(payload?.roundNumber ?? null);
      setInstruction(payload?.instruction ?? null);
      setTimeLeft(seconds);

      // clear any existing interval
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // start countdown that updates every second
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });

    // roundResult / gameFinished -> clear timer
    socket.on("roundResult", () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setTimeLeft(0);
    });

    socket.on("gameFinished", () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setTimeLeft(null);
      setTotalTime(null);
    });

    socket.on("disconnect", (reason) => {
      // console.log("GamePage socket disconnected:", reason);
    });

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.off();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [ctxRoomCode, paramRoomCode, location.state?.roomCode, location.state?.userId]);

  useEffect(() => {
    if (!Array.isArray(players)) return;
    // console.log("Player IDs:", players.map((p, i) => ({ slot: i + 1, id: p?.id || "" })));
  }, [players]);

  const images = [demo1, demo2, demo3, demo4];
  const colors = ["bg-blue-200", "bg-green-200", "bg-red-200", "bg-purple-200"];

  // Build exactly 4 slots for the grid, using PlayerContext data when available
  const playersForGrid = Array.from({ length: 4 }).map((_, idx) => {
    const p = Array.isArray(players) && players[idx] ? players[idx] : { id: "", name: "", isHost: false };
    const baseName = p.name && p.name.trim() ? p.name : `Waiting ${idx + 1}`;
    const displayName = p.isHost ? `${baseName} (Host)` : baseName;
    return {
      id: p.id || "",
      name: displayName,
      role: null,
      color: colors[idx],
      image: images[idx],
    };
  });

  // compute progress percentage for display
  const progressPercent =
    typeof timeLeft === "number" && typeof totalTime === "number" && totalTime > 0
      ? Math.max(0, Math.min(100, Math.round((timeLeft / totalTime) * 100)))
      : 0;

  return (
    <div
      className="min-h-screen bg-[#fffdee] bg-cover bg-center relative px-4 py-4"
      style={{ backgroundImage: "url('/bg-doodles.png')" }}
    >
      <BackArrow />

      {/* Inline Timer UI (synchronized with backend via socket events) */}
      <div className="flex flex-col items-center mt-4">
        <div className="flex items-center space-x-6">
          <div className="w-36 h-36 rounded-full bg-white shadow flex items-center justify-center">
            <div className="text-center">
              <div className="text-xs text-gray-500">Round</div>
              <div className="text-2xl font-bold">{roundNumber ?? "-"}</div>
              <div className="text-sm text-gray-600 mt-1">{instruction ? String(instruction) : "Waiting..."}</div>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="text-sm text-gray-600 mb-2">Time Left</div>
            <div className="text-4xl font-extrabold">{timeLeft !== null ? timeLeft : "-"}</div>
            <div className="w-48 h-3 bg-gray-200 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-yellow-400 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">{totalTime ? `${progressPercent}%` : ""}</div>
          </div>
        </div>
      </div>

      {/* Player Grid */}
      <div className="flex justify-center mt-10">
        <PlayerGrid players={playersForGrid} />
      </div>

      {/* Role Card */}
      <div className="flex justify-center mt-16">
        <RoleCard role={null} description={instruction || ""} />
      </div>

      {/* LeaderBoard */}
      <div className="mt-4">
        <LeaderBoard />
      </div>
    </div>
  );
};

export default GamePage;
