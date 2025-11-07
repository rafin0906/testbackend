import React from "react";
import kingIcon from "../../assets/images/king.png";
import policeIcon from "../../assets/images/police.png";

const roleIcons = {
  ivRv: kingIcon,//রাজা
  cywjk: policeIcon,// পুলিশ 
};

export default function PlayerCard({ player }) {
  const { name, role, color, image } = player;

  return (
    <div
      className={`w-[180px] h-[67px] ${color} rounded-xl shadow-md flex items-center px-3 space-x-3`}
    >
      <img
        src={image}
        alt={name}
        className="w-10 h-10 rounded-full object-cover border-2 border-white"
      />
      <div className="flex flex-col justify-center">
        <p className="text-sm font-[Sunflower] leading-none">{name}</p>
        {role && (
          <div className="flex items-center mt-1 space-x-1">
            <img
              src={roleIcons[role]}
              alt={role}
              className="w-4 h-4"
            />
            <span className="text-xs">
              {role}</span>
          </div>
        )}
      </div>
    </div>
  );
}
