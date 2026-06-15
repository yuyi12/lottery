interface BallProps {
  number: number;
  type: "red" | "blue";
  size?: "small" | "default";
}

export default function Ball({ number, type, size = "default" }: BallProps) {
  const isRed = type === "red";
  const sizeClass = size === "small" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold text-white ${sizeClass}`}
      style={{
        background: isRed
          ? "radial-gradient(circle at 35% 35%, #ff6b6b, #d93636)"
          : "radial-gradient(circle at 35% 35%, #4dabf7, #1c7ed6)",
        boxShadow: isRed
          ? "0 2px 4px rgba(217,54,54,0.4)"
          : "0 2px 4px rgba(28,126,214,0.4)",
      }}
    >
      {String(number).padStart(2, "0")}
    </span>
  );
}

export function RedBalls({ numbers, size }: { numbers: number[]; size?: "small" | "default" }) {
  return (
    <div className="flex gap-1.5">
      {numbers.map((n, i) => (
        <Ball key={i} number={n} type="red" size={size} />
      ))}
    </div>
  );
}

export function BlueBall({ number, size }: { number: number; size?: "small" | "default" }) {
  return <Ball number={number} type="blue" size={size} />;
}
