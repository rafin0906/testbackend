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
  const [kingId, setKingId] = useState(null);

  // new UI states for role, private instruction, and round/game events
  const [myRole, setMyRole] = useState(null);
  const [privateInstruction, setPrivateInstruction] = useState(null);
  const [roundResultMessage, setRoundResultMessage] = useState(null);
  const [gameWinner, setGameWinner] = useState(null);

  // history of per-round scores: array of arrays [{ userId, points }, ...]
  const [roundsHistory, setRoundsHistory] = useState([]);

  const socketRef = useRef(null);
  const timerRef = useRef(null);

  // helper to determine current room code and user id (navigation may supply userId)
  const codeForThis = ctxRoomCode || paramRoomCode || location.state?.roomCode || null;
  const myUserId = location.state?.userId || null;

  // ensure we fetch fresh players from backend on mount / reload
  useEffect(() => {
    const code = codeForThis;
    if (!code) {
      console.warn("GamePage: no roomCode available to load players");
      return;
    }

    let mounted = true;
    (async () => {
      try {
        await loadPlayersByRoomCode(code);
        if (!mounted) return;
      } catch (err) {
        console.error("GamePage: failed to load players:", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [codeForThis, loadPlayersByRoomCode]);

  // create socket, join room and listen for round events
  useEffect(() => {
    const code = codeForThis;
    if (!code) return;

    const socket = io("http://localhost:8000", { withCredentials: true });
    socketRef.current = socket;

    socket.on("connect", () => {
      const navUserId = myUserId;

      if (navUserId) {
        socket.emit("register", { userId: navUserId, roomCode: code });
        // ensure DB has the newly-assigned socket.id when navigating -> reregister
        socket.emit("reregister", { userId: navUserId, roomCode: code });
        console.log("reregister emitted for userId from navigation:", navUserId, "roomCode:", code);
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
      // accept king info from server
      setKingId(payload?.king?.id || payload?.kingId || null);
      setPrivateInstruction(null); // reset private instruction each round
      setRoundResultMessage(null);
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

    // individual role assigned (sent privately to each client)
    socket.on("yourRole", (payload) => {
      console.log("yourRole:", payload);
      if (payload && payload.role) {
        setMyRole(payload.role);
      }
    });

    // police specific private instruction
    socket.on("policeInstruction", (payload) => {
      console.log("policeInstruction:", payload);
      setPrivateInstruction(payload?.instruction || null);
    });

    // round result -> stop timer and optionally show message
    socket.on("roundResult", (payload) => {
      console.log("roundResult:", payload);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setTimeLeft(0);
      setRoundResultMessage(payload?.message ?? null);

      // accept per-round playerScores if provided and append to history
      const playerScores = Array.isArray(payload?.playerScores) ? payload.playerScores : [];
      if (playerScores.length > 0) {
        setRoundsHistory((prev) => {
          // append this round's scores
          return [...prev, playerScores];
        });
      }

      // refresh players / leaderboard from server so UI reflects new scores
      if (code) {
        loadPlayersByRoomCode(code).catch((err) => console.error("Failed reload players:", err));
      }
    });

    // reveal roles to all in room (may be used to update player UI)
    socket.on("revealRoles", (payload) => {
      console.log("revealRoles:", payload);
      // payload is array like [{ name, role }, ...] — refresh players to pick up roles/scores
      if (code) {
        loadPlayersByRoomCode(code).catch((err) => console.error("Failed reload players:", err));
      }
    });

    // leaderboard event -> refresh players
    socket.on("leaderboard", (payload) => {
      console.log("leaderboard event:", payload);
      if (code) {
        loadPlayersByRoomCode(code).catch((err) => console.error("Failed reload players:", err));
      }
    });

    // game finished / winner
    socket.on("gameFinished", () => {
      console.log("gameFinished");
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setTimeLeft(null);
      setTotalTime(null);
    });

    socket.on("gameWinner", (payload) => {
      console.log("gameWinner:", payload);
      setGameWinner(payload ?? null);
      // refresh players/leaderboard
      if (code) {
        loadPlayersByRoomCode(code).catch((err) => console.error("Failed reload players:", err));
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("GamePage socket disconnected:", reason);
    });

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.off("roundStarted");
        socketRef.current.off("yourRole");
        socketRef.current.off("policeInstruction");
        socketRef.current.off("roundResult");
        socketRef.current.off("revealRoles");
        socketRef.current.off("leaderboard");
        socketRef.current.off("gameFinished");
        socketRef.current.off("gameWinner");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [codeForThis, myUserId, loadPlayersByRoomCode]);

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
    // append badges for host and king
    let displayName = baseName;
    if (p.isHost) displayName += " (Host)";
    if (p.id && kingId && p.id === kingId) displayName += " (King)";
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
        <RoleCard role={myRole} description={privateInstruction || instruction || ""} />
      </div>

      {/* LeaderBoard */}
      <div className="mt-4">
        <LeaderBoard roundsHistory={roundsHistory} />
      </div>
    </div>
  );
};

export default GamePage;
