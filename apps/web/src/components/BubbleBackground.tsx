/**
 * Chunk 3: slow-moving decorative bubbles (pointer-events none).
 * Deterministic layout so React Strict Mode does not reshuffle bubbles.
 */
const BUBBLES: { size: number; left: string; top: string; dur: number; delay: number; opacity: number }[] = [
  { size: 120, left: "8%", top: "12%", dur: 92, delay: -12, opacity: 0.22 },
  { size: 68, left: "72%", top: "8%", dur: 78, delay: -40, opacity: 0.18 },
  { size: 200, left: "55%", top: "38%", dur: 110, delay: -65, opacity: 0.12 },
  { size: 52, left: "22%", top: "58%", dur: 70, delay: -8, opacity: 0.2 },
  { size: 95, left: "85%", top: "52%", dur: 88, delay: -55, opacity: 0.16 },
  { size: 140, left: "3%", top: "78%", dur: 98, delay: -30, opacity: 0.14 },
  { size: 76, left: "42%", top: "6%", dur: 82, delay: -70, opacity: 0.17 },
  { size: 160, left: "88%", top: "22%", dur: 105, delay: -5, opacity: 0.11 },
  { size: 44, left: "48%", top: "72%", dur: 74, delay: -48, opacity: 0.19 },
  { size: 110, left: "15%", top: "35%", dur: 90, delay: -22, opacity: 0.15 },
  { size: 88, left: "62%", top: "68%", dur: 86, delay: -38, opacity: 0.16 },
  { size: 58, left: "92%", top: "75%", dur: 72, delay: -60, opacity: 0.18 },
  { size: 180, left: "28%", top: "18%", dur: 100, delay: -85, opacity: 0.1 },
  { size: 64, left: "75%", top: "42%", dur: 80, delay: -15, opacity: 0.17 },
];

export default function BubbleBackground() {
  return (
    <div className="bubble-bg" aria-hidden>
      {BUBBLES.map((b, i) => (
        <span
          key={i}
          className="bubble"
          style={{
            width: b.size,
            height: b.size,
            left: b.left,
            top: b.top,
            opacity: b.opacity,
            animationDuration: `${b.dur}s`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
