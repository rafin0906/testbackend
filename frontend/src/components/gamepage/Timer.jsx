// src/components/gamepage/Timer.jsx
import { useEffect, useState } from 'react';

const Timer = ({ start = 30 }) => {
  const [timeLeft, setTimeLeft] = useState(start);

  useEffect(() => {
    if (timeLeft === 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  return (
    <div
      className="text-center text-gray-800 text-xl font-semibold my-4"
      style={{ fontFamily: 'Sunflower' }}
    >
      Timer : <span className="text-3xl font-bold">{timeLeft}</span> seconds
    </div>
  );
};

export default Timer;
