import { useState } from "react";
import TitleHeader from "../components/join/TitleHeader";
import RoomCodeInput from "../components/join/RoomCodeInput";
import JoinButton from "../components/join/JoinButton";
import BackArrow from "../components/utility/BackArrow";
import NicknameInput from "../components/home/NicknameInput";

export default function Join() {
    const [roomCode, setRoomCode] = useState("");

    return (
        <div
            className="min-h-screen relative flex items-center justify-center bg-[#FFFDE7] bg-cover"
            style={{ backgroundImage: "url('/bg-doodles.png')" }}
        >
            <BackArrow />
            <div className="flex flex-col items-center justify-center space-y-3">
                <TitleHeader />
                <NicknameInput />
                <RoomCodeInput value={roomCode} onChange={(e) => setRoomCode(e.target.value)} />
                <JoinButton roomCode={roomCode} />
            </div>
        </div>
    );
}
