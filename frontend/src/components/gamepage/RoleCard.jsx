import React from "react";
import kingIcon from "../../assets/images/king.png";
import policeIcon from "../../assets/images/police.png";
import chorIcon from "../../assets/images/chor.png";
import dakatIcon from "../../assets/images/dakat.png";

// map common role names to icons (case-insensitive)
const roleIcons = {
  king: kingIcon,
  police: policeIcon,
  chor: chorIcon,
  dakat: dakatIcon,
};

const RoleCard = ({ role, description }) => {
  // resolve icon by lowercased role
  const icon = role ? roleIcons[String(role).toLowerCase()] : null;

  return (
    <div className="bg-[#FFF297] rounded-xl px-10 py-6 text-center shadow-lg w-[310px] h-[191px] rotate-[-2.43deg]">
      <div className="text-xl font-bold font-lipighor mb-2">{role}</div>

      <div className="flex justify-center mb-2">
        {icon ? (
          <img src={icon} alt={`${role} icon`} className="w-10 h-10" />
        ) : (
          <img src={policeIcon} alt="role icon" className="w-10 h-10" />
        )}
      </div>

      <div className="font-lipighor text-lg">{description}</div>
    </div>
  );
};

export default RoleCard;
