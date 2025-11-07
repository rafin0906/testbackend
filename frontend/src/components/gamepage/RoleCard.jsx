import React from "react";
import policeIcon from "../../assets/images/police.png";

const RoleCard = ({ role, description }) => {
  console.log("RoleCard props:", { role, description });
  return (
    <div className="bg-[#FFF297] rounded-xl px-10 py-6 text-center shadow-lg w-[310px] h-[191px] rotate-[-2.43deg]">
      <div className="text-xl font-bold font-lipighor mb-2" 
      >{role}</div>
      <div className="flex justify-center mb-2">
        <img src={policeIcon} alt="role icon" className="w-10 h-10" />
      </div>
      <div className="font-lipighor text-lg"
        
      >{description}</div>
    </div>
  );
};

export default RoleCard;
