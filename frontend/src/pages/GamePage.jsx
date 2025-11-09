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
  const [policeId, setPoliceId] = useState(null);

  // notification when a new round starts
  const [roundNotification, setRoundNotification] = useState(null);
  const notificationTimeoutRef = useRef(null);
  const [notificationVisible, setNotificationVisible] = useState(false);

  // new UI states for role, private instruction, and round/game events
  const [myRole, setMyRole] = useState(null);
  const [privateInstruction, setPrivateInstruction] = useState(null);
  const [roundResultMessage, setRoundResultMessage] = useState(null);
  const [gameWinner, setGameWinner] = useState(null);
  // show/hide winner overlay
  const [showWinnerVisible, setShowWinnerVisible] = useState(false);
  const winnerAutoHideRef = useRef(null);

  // history of per-round scores: array of arrays [{ userId, points }, ...]
  const [roundsHistory, setRoundsHistory] = useState([]);

  // reveal roles UI state
  const [revealRolesData, setRevealRolesData] = useState(null);
  const [revealVisible, setRevealVisible] = useState(false);
  const revealTimeoutRef = useRef(null);

  // new verdict state for round-result card
  const [verdictVisible, setVerdictVisible] = useState(false);
  const [verdictMessageState, setVerdictMessageState] = useState(null);
  const verdictTimeoutRef = useRef(null);

  const socketRef = useRef(null);
  const timerRef = useRef(null);

  // helper to determine current room code and user id (navigation may supply userId)
  const codeForThis = ctxRoomCode || paramRoomCode || location.state?.roomCode || null;
  const myUserId = location.state?.userId || null;

    // ✅ Add this right here
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    const handleKeyDown = (event) => {
      if ((event.ctrlKey && event.key === "r") || event.key === "F5") {
        event.preventDefault();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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

    const socket = io("https://chorpolice.onrender.com/", { withCredentials: true });
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
      // accept king and police info from server
      setKingId(payload?.king?.id || payload?.kingId || null);
      setPoliceId(payload?.police?.id || payload?.policeId || null);
      setPrivateInstruction(null); // reset private instruction each round
      setRoundResultMessage(null);
      setTimeLeft(seconds);

      // show a responsive user notification like "Round 3 started"
      const roundNum = payload?.roundNumber ?? payload?.round ?? "-";
      const text = `Round ${roundNum} started`;
      // clear any previous timeout
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
        notificationTimeoutRef.current = null;
      }
      // set text and animate pop-in from top; auto-hide after 2.5s
      setRoundNotification(text);
      setNotificationVisible(true);
      notificationTimeoutRef.current = setTimeout(() => {
        setNotificationVisible(false);
        // wait for exit animation to finish before clearing text
        setTimeout(() => {
          setRoundNotification(null);
        }, 300);
        notificationTimeoutRef.current = null;
      }, 2500);

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

      // show verdict card in middle based on payload.isCorrect and payload.targetRole
      const targetRole = payload?.targetRole || payload?.targetrole || payload?.role || "target";
      const isCorrect = Boolean(payload?.isCorrect);
      const verdictText = isCorrect
        ? `Congratulation, ${targetRole} caught`
        : `Sad, ${targetRole} fled away.`;

      // clear any previous verdict timeout
      if (verdictTimeoutRef.current) {
        clearTimeout(verdictTimeoutRef.current);
        verdictTimeoutRef.current = null;
      }
      setVerdictMessageState(verdictText);
      setVerdictVisible(true);
      // auto-hide after 3s
      verdictTimeoutRef.current = setTimeout(() => {
        setVerdictVisible(false);
        // small delay before clearing text so exit animation can run
        setTimeout(() => setVerdictMessageState(null), 200);
        verdictTimeoutRef.current = null;
      }, 3000);

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
      // store payload for UI and auto-show the reveal card
      setRevealRolesData(payload || null);
      setRevealVisible(true);

      // auto-hide after 5s (clear any previous timeout)
      if (revealTimeoutRef.current) {
        clearTimeout(revealTimeoutRef.current);
        revealTimeoutRef.current = null;
      }
      revealTimeoutRef.current = setTimeout(() => {
        setRevealVisible(false);
        // wait a bit then clear data
        setTimeout(() => setRevealRolesData(null), 300);
        revealTimeoutRef.current = null;
      }, 5000);

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
      // show winner overlay when game finishes (gameWinner will be populated by gameWinner event)
      setShowWinnerVisible(true);
    });

    socket.on("gameWinner", (payload) => {
      console.log("gameWinner:", payload);
      setGameWinner(payload ?? null);
      // ensure overlay is visible if gameWinner arrives after gameFinished
      setShowWinnerVisible(true);
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
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
        notificationTimeoutRef.current = null;
      }
      if (revealTimeoutRef.current) {
        clearTimeout(revealTimeoutRef.current);
        revealTimeoutRef.current = null;
      }
      if (verdictTimeoutRef.current) {
        clearTimeout(verdictTimeoutRef.current);
        verdictTimeoutRef.current = null;
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
    // remove host badge entirely; append KIng and Police labels when ids match
    let displayName = baseName;
    if (p.id && kingId && String(p.id) === String(kingId)) displayName += " (KIng)";
    if (p.id && policeId && String(p.id) === String(policeId)) displayName += " (Police)";
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

  // handle clicking a player card (police-only action)
  const handlePlayerClick = (guessedUserId) => {
    if (!socketRef.current) return;
    if (!myUserId) return;
    // quick client-side guard: only allow if this client is police
    if (myRole !== "Police") return;
    // can't guess yourself
    if (!guessedUserId || String(guessedUserId) === String(myUserId)) return;

    // emit policeGuess to server (server will validate police privilege)
    socketRef.current.emit("policeGuess", {
      roomId: codeForThis,
      policeId: myUserId,
      guessedUserId,
    });
    console.log("policeGuess emitted:", { roomId: codeForThis, policeId: myUserId, guessedUserId });
  };

  return (
    <div
      className="min-h-screen bg-[#fffdee] bg-cover bg-center relative px-4 py-4"
      style={{ backgroundImage: "url('/bg-doodles.png')" }}
    >
      {/* Top popping notification (appears from top, auto-hides) */}
      <div
        aria-live="polite"
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ease-out pointer-events-none ${notificationVisible ? "translate-y-0 opacity-100 scale-100" : "-translate-y-12 opacity-0 scale-95"
          }`}
      >
        <div
          className="bg-[#FFF297] rounded-xl px-8 py-4 text-center shadow-lg w-[320px]"
          style={{ fontFamily: "LipighorBangla" }}
        >
          <div className="text-xl font-bold">{roundNotification}</div>
        </div>
      </div>

    

      {/* Reveal Roles Card (responsive) */}
      <div
        aria-live="polite"
        className={`fixed inset-0 z-50 flex items-start justify-center pointer-events-none px-4 pt-8 transition-all duration-300 ${revealVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"
          }`}
      >
        <div
          className="pointer-events-auto w-full max-w-md bg-white rounded-xl shadow-lg p-4 sm:p-6"
          style={{ fontFamily: "Sunflower" }}
        >
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold">Round Reveal</div>
            <div className="text-sm text-gray-500">Revealed</div>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(() => {
              // normalize payload: array of { role, name } or { role, userId }
              const arr = Array.isArray(revealRolesData) ? revealRolesData : [];
              const getName = (item) => item?.name || item?.displayName || item?.username || "";
              const chor = arr.find((r) => String(r.role).toLowerCase() === "chor");
              const dakat = arr.find((r) => String(r.role).toLowerCase() === "dakat");
              return (
                <>
                  <div className="bg-yellow-50 rounded-md p-3 flex flex-col items-start">
                    <div className="text-xs text-gray-500">Chor</div>
                    <div className="text-sm font-semibold">{chor ? getName(chor) : "-"}</div>
                  </div>
                  <div className="bg-yellow-50 rounded-md p-3 flex flex-col items-start">
                    <div className="text-xs text-gray-500">Dakat</div>
                    <div className="text-sm font-semibold">{dakat ? getName(dakat) : "-"}</div>
                  </div>
                </>
              );
            })()}
          </div>


        </div>
      </div>

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
        <PlayerGrid
          players={playersForGrid}
          onPlayerClick={handlePlayerClick}
          myUserId={myUserId}
          myRole={myRole}
          policeId={policeId}
        />
      </div>

      {/* Notification OR Role Card (same spot) */}
      <div className="flex justify-center mt-16">
        <RoleCard role={myRole} description={privateInstruction || instruction || ""} />
      </div>

      {/* LeaderBoard */}
      <div className="mt-4">
        <LeaderBoard roundsHistory={roundsHistory} />
      </div>

      {/* Winner Overlay */}
      {showWinnerVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300"
            style={{ opacity: gameWinner ? 0.25 : 0.2 }}
            onClick={() => setShowWinnerVisible(false)}
          />
          {/* card */}
          <div
            className={`relative z-10 mx-4 w-full max-w-lg transform transition-all duration-350 ${showWinnerVisible
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 -translate-y-6"
              }`}
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-gradient-to-tr from-yellow-50 via-amber-50 to-orange-50 border border-yellow-200 rounded-2xl shadow-[0_8px_25px_rgba(0,0,0,0.35)] p-5 sm:p-8 text-center">

              <div className="text-sm text-yellow-700 font-medium">Game Over</div>
              <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-black drop-shadow-sm">
                {gameWinner && Array.isArray(gameWinner.winners)
                  ? gameWinner.winners.length > 1
                    ? "Winners!"
                    : "Winner!"
                  : "Winner"}
              </div>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3">
                {gameWinner && Array.isArray(gameWinner.winners) && gameWinner.winners.length > 0 ? (
                  gameWinner.winners.map((w, i) => (
                    <div
                      key={String(w.id || w._id || i)}
                      className="bg-white/90 rounded-lg px-4 py-3 min-w-[140px] flex flex-col items-center border border-yellow-200 shadow-md hover:shadow-lg transition-shadow"
                    >
                      <div className="text-xs text-gray-500">Player</div>
                      <div className="text-lg font-semibold text-black mt-1">
                        {w.name || w.displayName || w.id}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-black">Results incoming...</div>
                )}
              </div>

              {/* optional leaderboard snippet */}
              {gameWinner && Array.isArray(gameWinner.leaderboard) && (
                <div className="mt-4 bg-white/60 rounded-lg p-3 text-left text-sm text-black max-h-40 overflow-auto border border-yellow-200">
                  <div className="font-semibold mb-2 text-yellow-900">Leaderboard</div>
                  <ol className="list-decimal pl-5 space-y-1">
                    {gameWinner.leaderboard.map((p) => (
                      <li key={String(p.id)} className="flex justify-between">
                        <span>{p.name}</span>
                        <span className="font-semibold">{p.score}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="mt-5 flex justify-center gap-3">
                <button
                  onClick={() => setShowWinnerVisible(false)}
                  className="px-4 py-2 rounded-md bg-yellow-400 hover:bg-yellow-500 text-white font-semibold shadow-md transition-all duration-150"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verdict card shown briefly after a round finishes */}
      {verdictVisible && verdictMessageState && (
        <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
          <div
            className="absolute inset-0 bg-black/10 transition-opacity duration-200"
            style={{ backdropFilter: "blur(2px)" }}
          />
          <div
            className={`relative z-50 pointer-events-auto mx-4 w-full max-w-md transform transition-all duration-250 ${verdictVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
            role="status"
            aria-live="polite"
          >
            <div className="bg-gradient-to-tr from-yellow-50 via-amber-50 to-orange-50 border border-yellow-200 rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.35)] p-5 sm:p-6 text-center">
              <div
                className="text-xl sm:text-2xl font-bold mb-1 text-black-800 drop-shadow-sm"
                style={{ fontFamily: "Sunflower, sans-serif" }}
              >
                {verdictMessageState}
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default GamePage;
