import BackArrow from "../components/utility/BackArrow";
import TitleBanner from "../components/lobby/TitleBanner";
import PlayerList from "../components/lobby/PlayerList";
import RoundSelector from "../components/lobby/RoundSelector";
import StartButton from "../components/lobby/StartButton";
import RoomCodeBox from "../components/lobby/RoomCodeBox";

import { useEffect, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import { useRoom } from "../context/RoomContext";
import { usePlayers } from "../context/PlayerContext";

export default function Lobby() {
    const { roomCode: paramRoomCode } = useParams(); // route: /lobby/:roomCode
    const { loadRoomByCode, setRoomCode } = useRoom();
    const { loadPlayersByRoomCode, setPlayers } = usePlayers();
    const location = useLocation();

    const socketRef = useRef(null);

    useEffect(() => {
        const code = paramRoomCode || location.state?.roomCode || null;
        console.log("Lobby useEffect code:", code);
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
                    console.log("socket connected:", socket.id);
                    // register this socket to a user on the server so server can map socketId -> user
                    const userId = location.state?.userId;
                    console.log("registering socket with userId:", userId);
                    if (userId) {
                        socket.emit("register", { userId, roomCode: code });
                    } else {
                        console.warn("no userId available in location.state — socket not registered");
                    }
                });

                // receive updated player list from server (if implemented)
                socket.on("playerList", (data) => {
                    if (!mounted) return;
                    console.log("playerList payload:", data);

                    // accept either an array or an object with .players
                    const list = Array.isArray(data) ? data : Array.isArray(data?.players) ? data.players : null;
                    if (!list) return;

                    // map server players to UI form: [{ id, name, isHost }, ...]
                    const mapped = list.slice(0, 4).map((p) => ({
                        id: p._id || p.id || "",
                        name: p.name || "",
                        isHost: !!p.isHost,
                    }));
                    while (mapped.length < 4) mapped.push({ id: "", name: "", isHost: false });

                    setPlayers(mapped);
                    console.log("mapped players:", mapped);
                });

                // optional: handle other realtime events if needed
                socket.on("roundStarted", (payload) => {
                    console.log("roundStarted", payload);
                });
                socket.on("policeInstruction", (payload) => {
                    console.log("policeInstruction", payload);
                });
                socket.on("disconnect", (reason) => {
                    console.log("socket disconnected:", reason);
                });
            }
        })();

        return () => {
            mounted = false;
            if (socketRef.current) {
                socketRef.current.off(); // remove all listeners
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [paramRoomCode, location.state?.roomCode, loadRoomByCode, loadPlayersByRoomCode, setRoomCode, setPlayers]);

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
                <StartButton />
            </div>
        </div>
    );
}