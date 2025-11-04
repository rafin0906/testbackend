import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function BackArrow() {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1); // Go to previous page
    } else {
      navigate("/"); // Fallback if there's no history
    }
  };

  return (
    <button
      onClick={handleBack}
      className="absolute top-4 left-4 text-black text-xl hover:scale-105 transition"
    >
      <FaArrowLeft />
    </button>
  );
}
