import BackArrow from "../components/utility/BackArrow";
import TitleBanner from "../components/lobby/TitleBanner";
import PlayerList from "../components/lobby/PlayerList";
import RoundSelector from "../components/lobby/RoundSelector";
import StartButton from "../components/lobby/StartButton";
import RoomCodeBox from "../components/lobby/RoomCodeBox";

import { useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useRoom } from "../context/RoomContext";
import { usePlayers } from "../context/PlayerContext";


export default function Lobby() {
    const { roomCode: paramRoomCode } = useParams(); // route: /lobby/:roomCode
    const { loadRoomByCode, setRoomCode } = useRoom();
    const { loadPlayersByRoomCode } = usePlayers();
    const location = useLocation();

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
        })();

        return () => {
            mounted = false;
        };
    }, [paramRoomCode, location.state?.roomCode, loadRoomByCode, loadPlayersByRoomCode, setRoomCode]);

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