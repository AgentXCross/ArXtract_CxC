import { useEffect, useRef, useState, useCallback, useId } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  themeVariables: {
    primaryColor: "transparent",
    primaryTextColor: "#c7ff00",
    primaryBorderColor: "#c7ff00",
    lineColor: "#c7ff0088",
    secondaryColor: "transparent",
    tertiaryColor: "transparent",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: "14px",
    nodeBorder: "#c7ff00",
    mainBkg: "transparent",
    nodeTextColor: "#c7ff00",
  },
  flowchart: {
    htmlLabels: true,
    curve: "basis",
    padding: 20,
  },
});

const CHART_DEF = `flowchart LR
  A[Input: arXiv Paper]
  B[Input: User Research Prompt]
  A --> C[Extract arXiv ID]
  C --> D[Fetch PDF Bytes]
  D --> E["Parse PDF to Text (Remove symbols, delete references)"]
  E --> F["Chunk by Words (Store in memory)"]
  E --> G["LLM Call"]
  G --> H["Output: Key Sections"]
  B --> I["LLM Expands User Prompt"]
  I --> J["Transformer Embedding Model"]
  J --> K["Compute Cosine Similarity"]
  K --> L["Clamp negatives to 0, Multiply score by 100"]
  L --> M["Average Similarity Score"]
  A --> N["Fetch Paper Abstract"]
  N --> J
  N --> O["LLM Computes Similarity"]
  I --> O
  O --> M
  I --> P["Embedding Model"]
  F --> P
  P --> Q["Compute Cosine Similarity"]
  Q --> R["Take top 20, LLM filters for top 5"]
  R --> S["Output: Relevance Score Section"]
  M --> S
  B --> T["LLM Extracts Keywords"]
  T --> U["API Call to arXiv"]
  U --> V["Return top 5 matches"]
  V --> W["Fetch abtracts of the 5 matches"]
  W --> X["Embedding Model"]
  B --> Y["LLM Expands User Prompt"]
  Y --> X
  X --> Z["Compute Cosine Similarities and Rank"]
  Z --> a["Output: Related Papers Section"]
  b["Input: Use Input for Further Querying"]
  b --> c["Embedding Model"]
  F --> c
  c --> d["Compute Cosine Similarities and take Top 15"]
  d --> e["Pass to LLM to respond"]
  e --> f["Output: Research Query Section"]

  classDef io fill:#c7ff00,stroke:#c7ff00,color:#000,font-weight:700
  class A,B,b io
  class H,S,a,f io
`;

export default function ModelFlowchart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const reactId = useId();
  const mermaidId = "mermaid-" + reactId.replace(/:/g, "");

  useEffect(() => {
    const el = svgContainerRef.current;
    if (!el) return;

    // Remove any stale element mermaid may have left behind
    const stale = document.getElementById(mermaidId);
    if (stale) stale.remove();

    let cancelled = false;

    mermaid
      .render(mermaidId, CHART_DEF)
      .then(({ svg }) => {
        if (cancelled) return;
        el.innerHTML = svg;
        const svgEl = el.querySelector("svg");
        if (svgEl) {
          svgEl.style.maxWidth = "none";
          svgEl.style.height = "auto";
        }
      })
      .catch((err) => {
        if (!cancelled) console.error("Mermaid render error:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [mermaidId]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale((prev) => {
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      return Math.min(Math.max(prev + delta, 0.1), 8);
    });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const resetView = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  return (
    <div style={{
      background: "#0f0f0f",
      border: "1px solid #2a2a2a",
      borderRadius: 10,
      overflow: "hidden",
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
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
      {/* Terminal title bar */}
      <div style={{
        background: "#c7ff00",
        padding: "0.5rem 1rem",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
      }}>
        <div style={{ display: "flex", gap: "0.35rem" }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#000" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#000" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#000" }} />
        </div>
        <div style={{
          fontSize: "0.75rem",
          color: "#000",
          letterSpacing: "0.03em",
          fontWeight: 600,
        }}>
          model_flowchart
        </div>
      </div>

      {/* Zoom controls */}
      <div style={{
        display: "flex",
        gap: "0.5rem",
        padding: "0.5rem 1rem",
        borderBottom: "1px solid #2a2a2a",
        alignItems: "center",
      }}>
        <button onClick={() => setScale((s) => Math.min(s + 0.2, 8))} style={zoomBtnStyle}>+</button>
        <button onClick={() => setScale((s) => Math.max(s - 0.2, 0.1))} style={zoomBtnStyle}>−</button>
        <button onClick={resetView} style={zoomBtnStyle}>reset</button>
        <span style={{ color: "#666", fontSize: "0.75rem", marginLeft: "0.5rem" }}>
          {Math.round(scale * 100)}%
        </span>
      </div>

      {/* Flowchart canvas */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          height: 400,
          overflow: "hidden",
          cursor: isDragging.current ? "grabbing" : "grab",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          ref={svgContainerRef}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: "center center",
            transition: isDragging.current ? "none" : "transform 0.1s ease-out",
          }}
        />
      </div>
    </div>
  );
}

const zoomBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #333",
  color: "#c7ff00",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  fontSize: "0.8rem",
  padding: "0.25rem 0.6rem",
  borderRadius: 4,
  cursor: "pointer",
  outline: "none",
};
