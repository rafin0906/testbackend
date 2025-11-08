import React from "react";
import kingIcon from "../../assets/images/king.png";
import policeIcon from "../../assets/images/police.png";

const roleIcons = {
  ivRv: kingIcon,//রাজা
  cywjk: policeIcon,// পুলিশ 
};

export default function PlayerCard({ player, onClick, isClickable = false, isPoliceViewer = false, policeId, myUserId = null }) {
  const { name, role, color, image, id } = player;

  const clickableClass = isClickable ? "cursor-pointer hover:scale-[1.02] active:scale-[0.99] transition-transform" : "";
  const outline = isClickable ? "ring-2 ring-yellow-300" : "";

  const isYou = myUserId && String(id) === String(myUserId);

  return (
    <div
      onClick={(e) => {
        if (!isClickable) return;
        // prevent weird double events
        e.preventDefault();
        if (typeof onClick === "function") onClick(id);
      }}
      className={`w-[180px] h-[67px] ${color} rounded-xl shadow-md flex items-center px-3 space-x-3 ${clickableClass} ${outline}`}
      role={isClickable ? "button" : "group"}
      aria-disabled={!isClickable}
    >
      <img
        src={image}
        alt={name}
        className="w-10 h-10 rounded-full object-cover border-2 border-white"
      />
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-2">
          <p className="text-sm font-[Sunflower] leading-none">{name}</p>
          {isYou && (
            <span className="text-[10px] bg-white/90 text-gray-800 px-2 py-0.5 rounded-full font-medium">
              You
            </span>
          )}
        </div>
        {role && (
          <div className="flex items-center mt-1 space-x-1">
            <img
              src={roleIcons[role]}
              alt={role}
              className="w-4 h-4"
            />
            <span className="text-xs">{role}</span>
          </div>
        )}
        {/* If this viewer is police, visually indicate which player is current police (should be elsewhere) */}
        {isPoliceViewer && policeId && String(id) === String(policeId) && (
          <div className="text-[10px] text-yellow-800 mt-1"></div>
        )}
      </div>
    </div>
  );
}
