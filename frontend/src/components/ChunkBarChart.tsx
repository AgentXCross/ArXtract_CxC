import { useState } from "react";

interface ChunkScore {
  text: string;
  score: number;
  chunk_index: number;
}

interface ChunkBarChartProps {
  chunks: ChunkScore[];
}

export default function ChunkBarChart({ chunks }: ChunkBarChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const maxScore = 10;
  const barHeight = 40;
  const gap = 12;
  const labelWidth = 90;

  return (
    <div
      style={{
        marginTop: "1.25rem",
        background: "#0f0f0f",
        border: "1px solid #2a2a2a",
        borderRadius: 10,
        overflow: "hidden",
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        transition: "box-shadow 0.3s ease, border-color 0.3s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 0 5px rgba(199, 255, 0, 0.6)";
        e.currentTarget.style.borderColor = "#c7ff00";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "#2a2a2a";
      }}
    >
      {/* Title bar */}
      <div
        style={{
          background: "#c7ff00",
          padding: "0.5rem 1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", gap: "0.35rem" }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#000" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#000" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#000" }} />
        </div>
        <div style={{
          fontSize: "0.75rem",
          color: "#000",
          textTransform: "lowercase",
          letterSpacing: "0.03em",
          fontWeight: 600,
        }}>
          chunk_relevance_scores
        </div>
      </div>

      {/* Chart content */}
      <div style={{ padding: "1.25rem 1.5rem" }}>
        {/* Axis ticks */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          marginLeft: labelWidth,
          marginBottom: "0.5rem",
          fontSize: "0.75rem",
          color: "#bdbdbd",
        }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(tick => (
            <span key={tick}>{tick}</span>
          ))}
        </div>

        {/* Bars */}
        {chunks.map((chunk, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: i < chunks.length - 1 ? gap : 0,
            }}
          >
            {/* Label */}
            <div style={{
              width: labelWidth,
              flexShrink: 0,
              textAlign: "right",
              paddingRight: "1rem",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "#dfdfdf",
            }}>
              Chunk {chunk.chunk_index}
            </div>

            {/* Bar container */}
            <div
              style={{
                flex: 1,
                height: barHeight,
                background: "#1a1a1a",
                borderRadius: 6,
                position: "relative",
                cursor: "pointer",
                overflow: "hidden",
              }}
              onClick={() => setSelectedIndex(selectedIndex === i ? null : i)}
            >
              {/* Bar fill */}
              <div style={{
                width: `${(chunk.score / maxScore) * 100}%`,
                height: "100%",
                background: "linear-gradient(90deg, #c7ff00, #39ff14)",
                borderRadius: 6,
                boxShadow: selectedIndex === i
                  ? "0 0 16px rgba(57, 255, 20, 0.7), 0 0 32px rgba(57, 255, 20, 0.4)"
                  : "0 0 8px rgba(57, 255, 20, 0.3)",
                transition: "box-shadow 0.2s ease",
                display: "flex",
                alignItems: "center",
                paddingLeft: "0.75rem",
                minWidth: "fit-content",
              }}>
                <span style={{
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "#000",
                  whiteSpace: "nowrap",
                }}>
                  {chunk.score.toFixed(3)}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Selected chunk text */}
        {selectedIndex !== null && (
          <div style={{
            marginTop: "1.25rem",
            padding: "1rem 1.25rem",
            background: "#111",
            border: "1px solid #c8c8c8",
            borderRadius: 8,
            boxShadow: "0 0 20px rgba(57, 255, 20, 0.2)",
          }}>
            <p style={{
              margin: 0,
              marginBottom: "0.5rem",
              fontWeight: 700,
              fontSize: "0.85rem",
              color: "#bcff14",
              alignItems: "left"
            }}>
              Chunk {chunks[selectedIndex].chunk_index} — Score: {chunks[selectedIndex].score.toFixed(3)} / 10
            </p>
            <p style={{
              margin: 0,
              fontSize: "0.9rem",
              lineHeight: 1.6,
              color: "#ddd",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              alignContent: "left"
            }}>
              {chunks[selectedIndex].text}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
