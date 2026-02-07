interface AbstractScoreGaugeProps {
  score: number; // 0–100
  abstractText: string;
}

export default function AbstractScoreGauge({ score, abstractText }: AbstractScoreGaugeProps) {
  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = Math.min(score, 100);
  const offset = circumference - (filled / 100) * circumference;

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
        e.currentTarget.style.boxShadow = "0 0 20px rgba(199, 255, 0, 0.6)";
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
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        }}>
          abstract_relevance_score
        </div>
      </div>

      {/* Gauge + Abstract side by side */}
      <div style={{
        display: "flex",
        alignItems: "center",
        padding: "1.5rem",
        gap: "1.5rem",
      }}>
        {/* Gauge */}
        <div style={{
          position: "relative",
          flexShrink: 0,
          width: size,
          height: size,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}>
          <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
            {/* Background track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#1a1a1a"
              strokeWidth={strokeWidth}
            />
            {/* Filled arc */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{
                filter: "drop-shadow(0 0 6px rgba(199, 255, 0, 0.6))",
                transition: "stroke-dashoffset 0.6s ease",
              }}
            />
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#c7ff00" />
                <stop offset="100%" stopColor="#39ff14" />
              </linearGradient>
            </defs>
          </svg>

          {/* Score text centered */}
          <div style={{
            position: "absolute",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}>
            <span style={{
              fontSize: "2.2rem",
              fontWeight: 700,
              color: "#e6e6e6",
              lineHeight: 1,
            }}>
              {score.toFixed(1)}
            </span>
            <span style={{
              fontSize: "0.75rem",
              color: "#666",
              marginTop: "0.25rem",
            }}>
              / 100
            </span>
          </div>
        </div>

        {/* Abstract text */}
        <div style={{
          flex: 1,
          fontSize: "0.85rem",
          lineHeight: 1.7,
          color: "#dddddd",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          textAlign: "left",
        }}>
          {abstractText}
        </div>
      </div>
    </div>
  );
}
