import React from "react";
import PlayerCard from "./PlayerCard";

export default function PlayerGrid({ players }) {
  return (
    <div className="grid grid-cols-2 gap-5">
      {players.map((player, idx) => (
        <PlayerCard key={idx} player={player} />
      ))}
    </div>
  );
}
