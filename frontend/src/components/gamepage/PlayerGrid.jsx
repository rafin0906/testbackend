import React from "react";
import PlayerCard from "./PlayerCard";

export default function PlayerGrid({ players, onPlayerClick, myUserId, myRole, policeId }) {
  return (
    <div className="grid grid-cols-2 gap-5">
      {players.map((player, idx) => (
        <PlayerCard
          key={idx}
          player={player}
          onClick={() => {
            if (typeof onPlayerClick === "function") onPlayerClick(player.id);
          }}
          // pass extra props so card can style itself when clickable
          isClickable={Boolean(onPlayerClick) && myRole === "Police" && String(player.id) !== String(myUserId)}
          isPoliceViewer={myRole === "Police"}
          myUserId={myUserId}
          policeId={policeId}
        />
      ))}
    </div>
  );
}
