import React from "react";
import PlayerGrid from "../components/gamepage/PlayerGrid";
import RoleCard from "../components/gamepage/RoleCard";
import BackArrow from "../components/utility/BackArrow";
import Timer from "../components/gamepage/Timer"; // ✅ New
import LeaderBoard from "../components/gamepage/LeaderBoard"; // ✅ New

import demo1 from "../assets/demo_profile/demo1.png";
import demo2 from "../assets/demo_profile/demo2.png";
import demo3 from "../assets/demo_profile/demo3.png";
import demo4 from "../assets/demo_profile/demo4.png";

const GamePage = () => {
  const players = [
    { name: "Rafin (Host)", role: "ivRv", color: "bg-blue-200", image: demo1 },
    { name: "Piash", role: "cywjk", color: "bg-green-200", image: demo2 },
    { name: "Mahi", role: null, color: "bg-red-200", image: demo3 },
    { name: "Mim", role: null, color: "bg-purple-200", image: demo4 },
  ];

  return (
    <div
      className="min-h-screen bg-[#fffdee] bg-cover bg-center relative px-4 py-4"
      style={{ backgroundImage: "url('/bg-doodles.png')" }}
    >
      <BackArrow />

      {/* ✅ Timer */}
      <div className="flex justify-center mt-4">
        <Timer />
      </div>



      {/* Player Grid */}
      <div className="flex justify-center mt-10">
        <PlayerGrid players={players} />
      </div>

      {/* Role Card */}
      <div className="flex justify-center mt-16">
        <RoleCard role="cywjk" description="‡Pvi‡K Lyu‡Rv " />
      </div>

      {/* ✅ LeaderBoard */}
      <div className="mt-4">
        <LeaderBoard />
      </div>
    </div>
  );
};

export default GamePage;
