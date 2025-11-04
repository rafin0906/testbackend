import BackArrow from "../components/utility/BackArrow";
import TitleBanner from "../components/lobby/TitleBanner";
import PlayerList from "../components/lobby/PlayerList";
import RoundSelector from "../components/lobby/RoundSelector";
import StartButton from "../components/lobby/StartButton";


export default function Lobby() {


    return (
        <div
            className="min-h-screen relative flex items-center justify-center bg-[#FFFDE7] bg-cover"
            style={{ backgroundImage: "url('/bg-doodles.png')" }}
        >
            <BackArrow  />
            <div className="flex flex-col items-center space-y-4">
                <TitleBanner />
                <PlayerList />
                <RoundSelector />
                <StartButton />
            </div>
        </div>
    );
}