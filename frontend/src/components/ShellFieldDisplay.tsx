interface ShellFieldProps {
  label: string;
  value: string | null;
}

export default function ShellFieldDisplay({ label, value }: ShellFieldProps) {
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
        boxShadow: "inset 0 0 25px rgba(199, 255, 0, 0.06)",
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
      {/* Title bar - full width yellow bar */}
      <div
        style={{
          background: "#393939",
          padding: "0.5rem 1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        {/* Terminal dots */}
        <div style={{ display: "flex", gap: "0.35rem" }}>
          <div style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: "#000000",
          }} />
          <div style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: "#000000",
          }} />
          <div style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: "#000000",
          }} />
        </div>

        {/* Label text */}
        <div
          style={{
            fontSize: "0.75rem",
            color: "#9dff00",
            textTransform: "lowercase",
            letterSpacing: "0.03em",
            fontWeight: 600,
          }}
        >
          {label}
        </div>
      </div>

      {/* Content area */}
      <div
        style={{
          padding: "1rem",
          color: "#e6e6e6",
          fontSize: "0.9rem",
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
          textAlign: "left",
          minHeight: "2.88em",
        }}
      >
        {typeof value === "string" && value.trim().length > 0
            ? value
            : "—"}
      </div>
    </div>
  );
}
