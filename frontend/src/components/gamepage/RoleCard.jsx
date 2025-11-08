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

  // show description only to the player who is Police (case-insensitive)
  const isPoliceViewer = role && String(role).toLowerCase() === "police";

  return (
    <div className="bg-[#FFF297] rounded-xl px-10 py-6 text-center shadow-lg w-[310px] h-[191px] rotate-[-2.43deg]">
      <div className="text-xl font-bold font-lipighor mb-2">{role} (You)</div>

      <div className="flex justify-center mb-2">
        {icon ? (
          <img src={icon} alt={`${role} icon`} className="w-15 h-15" />
        ) : (
          // preserve layout when no icon available
          <div className="w-15 h-15" aria-hidden="true" />
        )}
      </div>

      {/* description visible only to Police; others see an empty line to preserve layout */}
      {isPoliceViewer ? (
        <div className="font-lipighor text-lg">{description}</div>
      ) : (
        <div className="font-lipighor text-lg">&nbsp;</div>
      )}
    </div>
  );
};

export default RoleCard;
