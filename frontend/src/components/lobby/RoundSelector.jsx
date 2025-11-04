const options = [10, 20, 30, 40];

export default function RoundSelector() {
  return (
    <div className="text-center mt-4">
      <p className="text-sm font-[Sunflower] mb-2">How many Rounds?</p>
      <div className="grid grid-cols-2 gap-2 w-[160px] mx-auto">
        {options.map((opt) => (
          <button
            key={opt}
            className="bg-yellow-300 hover:bg-yellow-400 py-1 rounded-md text-sm font-bold transition"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
