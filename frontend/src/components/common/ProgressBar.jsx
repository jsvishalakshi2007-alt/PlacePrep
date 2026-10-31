export default function ProgressBar({
  value = 0,
  max = 100,
  label,
  showPercentage = true,
  color = "var(--color-primary)",
  height = 8,
}) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  return (
    <div style={{ width: "100%", margin: "8px 0" }}>
      {(label || showPercentage) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "12px",
            marginBottom: "5px",
            color: "var(--color-text-secondary)",
          }}
        >
          {label && <span>{label}</span>}
          {showPercentage && <strong>{percentage}%</strong>}
        </div>
      )}
      <div
        style={{
          width: "100%",
          height: `${height}px`,
          backgroundColor: "var(--color-border-subtle)",
          borderRadius: "999px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: "100%",
            backgroundColor: color,
            borderRadius: "999px",
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}
