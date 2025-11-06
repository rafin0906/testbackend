import { useState } from "react";
import TitleHeader from "../components/join/TitleHeader";
import RoomCodeInput from "../components/join/RoomCodeInput";
import JoinButton from "../components/join/JoinButton";
import BackArrow from "../components/utility/BackArrow";

export default function Join() {
    const [roomCode, setRoomCode] = useState("");
    const [nickname, setNickname] = useState("");

    return (
        <div
            className="min-h-screen relative flex items-center justify-center bg-[#FFFDE7] bg-cover"
            style={{ backgroundImage: "url('/bg-doodles.png')" }}
        >
            <BackArrow />
            <div className="flex flex-col items-center justify-center space-y-3">
                <TitleHeader />
                <input
                    type="text"
                    placeholder="Enter your Nickname"
                    className="w-full mt-4 max-w-sm px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                />
                <RoomCodeInput value={roomCode} onChange={(e) => setRoomCode(e.target.value)} />
                <JoinButton roomCode={roomCode} nickname={nickname} />
            </div>
        </div>
    );
}
