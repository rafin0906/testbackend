import BackArrow from "../components/utility/BackArrow";
import TitleBanner from "../components/lobby/TitleBanner";
import PlayerList from "../components/lobby/PlayerList";
import RoundSelector from "../components/lobby/RoundSelector";
import RoomCodeBox from "../components/lobby/RoomCodeBox";

import { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import { useRoom } from "../context/RoomContext";
import { usePlayers } from "../context/PlayerContext";

export default function Lobby() {
    const { roomCode: paramRoomCode } = useParams(); // route: /lobby/:roomCode
    const { loadRoomByCode, setRoomCode, selectedRounds } = useRoom();
    const { loadPlayersByRoomCode, setPlayers } = usePlayers();
    const location = useLocation();

    const socketRef = useRef(null);
    const navigate = useNavigate();
    const [startError, setStartError] = useState(null);

    // host check state
    const [isHost, setIsHost] = useState(false);
    const [checkingHost, setCheckingHost] = useState(true);

    useEffect(() => {
        const code = paramRoomCode || location.state?.roomCode || null;
        if (!code) return;

        let mounted = true;
        setRoomCode(code);

        (async () => {
            try {
                await loadRoomByCode(code);
                if (!mounted) return;
                await loadPlayersByRoomCode(code);
            } catch (err) {
                console.error("Failed to load lobby data:", err);
            }

            // create socket connection AFTER room/players loaded
            if (!socketRef.current) {
                const socket = io("http://localhost:8000", { withCredentials: true });
                socketRef.current = socket;

                socket.on("connect", () => {
                    const userId = location.state?.userId;
                    if (userId) {
                        socket.emit("register", { userId, roomCode: code });
                    } else {
                        console.warn("no userId available in location.state — socket not registered");
                    }
                });

                socket.on("playerList", (data) => {
                    if (!mounted) return;
                    const list = Array.isArray(data) ? data : Array.isArray(data?.players) ? data.players : null;
                    if (!list) return;
                    const mapped = list.slice(0, 4).map((p) => ({
                        id: p._id || p.id || "",
                        name: p.name || "",
                        isHost: !!p.isHost,
                    }));
                    while (mapped.length < 4) mapped.push({ id: "", name: "", isHost: false });
                    setPlayers(mapped);
                });

                // redirect all room members when host starts the game
                socket.on("gameStarted", (payload) => {
                    if (!mounted) return;
                    console.log("gameStarted payload:", payload);
                    const code = payload?.roomCode || payload?.roomId || paramRoomCode || location.state?.roomCode;
                    if (code) {
                        navigate(`/game/${code}`);
                    }
                });
            }
        })();

        return () => {
            mounted = false;
            if (socketRef.current) {
                socketRef.current.off();
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [paramRoomCode, location.state?.roomCode, loadRoomByCode, loadPlayersByRoomCode, setRoomCode, setPlayers]);

    // separate effect to check host privilege (so UI can disable start button)
    useEffect(() => {
        const code = paramRoomCode || location.state?.roomCode || null;
        if (!code) {
            setIsHost(false);
            setCheckingHost(false);
            return;
        }
        let mounted = true;
        setCheckingHost(true);
        axios
            .get(`/api/v1/rooms/${encodeURIComponent(code)}/is-host`, { withCredentials: true })
            .then((res) => {
                if (!mounted) return;
                setIsHost(Boolean(res?.data?.isHost));
            })
            .catch(() => {
                if (!mounted) return;
                setIsHost(false);
            })
            .finally(() => {
                if (!mounted) return;
                setCheckingHost(false);
            });
        return () => {
            mounted = false;
        };
    }, [paramRoomCode, location.state?.roomCode]);

    const handleStart = async () => {
        const code = paramRoomCode || location.state?.roomCode || null;
        const rounds = selectedRounds;

        if (!code) {
            setStartError("Room code missing. Cannot start the game.");
            return;
        }
        if (!rounds) {
            setStartError("Please select the number of rounds before starting the game.");
            return;
        }

        // optional client-side guard: prevent non-host from calling start
        if (!isHost) {
            setStartError("Only the host can start the game.");
            return;
        }

        setStartError(null);
        try {
            await axios.get(`/api/v1/rooms/${encodeURIComponent(code)}/start/${encodeURIComponent(rounds)}`, {
                withCredentials: true,
            });
            // DO NOT navigate to a plain "/game" (missing roomCode)
            // Let the socket "gameStarted" handler perform navigation for all clients,
            // or uncomment the next line to navigate host immediately to the correct route:
            // navigate(`/game/${code}`);
        } catch (err) {
            const message =
                err?.response?.data?.message ||
                err?.message ||
                (typeof err === "string" ? err : "An unknown error occurred");
            console.error("start game failed:", message, err);
            setStartError(message);
        }
    };

    return (
        <div
            className="min-h-screen relative flex items-center justify-center bg-[#FFFDE7] bg-cover"
            style={{ backgroundImage: "url('/bg-doodles.png')" }}
        >
            <BackArrow />
            <div className="flex flex-col items-center space-y-4">
                <TitleBanner />
                <PlayerList />
                <RoundSelector />
                <RoomCodeBox />

                <button
                    className={`mt-4 py-2 px-8 rounded-md shadow-md font-bold text-black font-[Sunflower] transition ${isHost && !checkingHost ? "bg-yellow-400 hover:bg-yellow-500" : "bg-gray-300 cursor-not-allowed opacity-70"
                        }`}
                    onClick={handleStart}
                    disabled={!isHost || checkingHost}
                >
                    Start Game
                </button>

                {!checkingHost && !isHost && (
                    <p className="text-xs text-gray-600 mt-2">Only the host can start the game.</p>
                )}

                {/* Friendly error UI: show only message text */}
                {startError && (
                    <div className="mt-3 w-[320px] rounded-md border border-red-200 bg-red-50 px-4 py-3">
                        <div className="flex items-start space-x-2">
                            <svg
                                className="w-5 h-5 text-red-600 mt-0.5"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728" />
                            </svg>
                            <div>
                                <p className="font-semibold text-red-700">Error</p>
                                <p className="text-sm text-red-700 mt-1 break-words">{startError}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}