import { FaArrowLeft } from "react-icons/fa";

export default function BackArrow() {
  return (
    <button className="absolute top-4 left-4 text-black text-xl hover:scale-105 transition">
      <FaArrowLeft />
    </button>
  );
}
