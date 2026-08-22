import { useEffect, useRef, useState } from "react";

interface Props {
  children: string;
  highlightColor?: string;
  baseColor?: string;
  style?: React.CSSProperties;
}

export default function ScrollTextHighlight({
  children,
  highlightColor = "#3b82f6",
  baseColor = "#6b7280",
  style,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // Start highlighting when element enters viewport, finish at center
      const start = vh;
      const end = vh * 0.3;
      const p = 1 - (rect.top - end) / (start - end);
      setProgress(Math.max(0, Math.min(1, p)));
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const words = children.split(" ");
  const highlightedCount = Math.round(progress * words.length);

  return (
    <div
      ref={ref}
      style={{
        transition: "color 0.1s",
        ...style,
      }}
    >
      {words.map((word, i) => (
        <span
          key={i}
          style={{
            color: i < highlightedCount ? highlightColor : baseColor,
            transition: "color 0.15s ease",
            marginRight: "0.3em",
          }}
        >
          {word}
        </span>
      ))}
    </div>
  );
}
