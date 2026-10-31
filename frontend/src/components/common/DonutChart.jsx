export default function DonutChart({
  segments = [],
  total = 0,
  label = "Total",
  emptyMessage = "No data recorded yet",
  onSegmentSelect,
}) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;

  const validSegments = segments.filter((s) => s.count > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ position: "relative", width: 140, height: 140 }}>
        <svg viewBox="0 0 120 120" width="140" height="140">
          {/* Base track */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            stroke="var(--color-border-subtle)"
            strokeWidth="14"
          />

          {total > 0 &&
            validSegments.map((segment) => {
              const length = (segment.count / total) * circumference;
              const currentOffset = accumulatedOffset;
              accumulatedOffset += length;

              return (
                <circle
                  key={segment.label}
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="transparent"
                  stroke={segment.color}
                  strokeWidth="14"
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-currentOffset}
                  transform="rotate(-90 60 60)"
                  style={{
                    cursor: onSegmentSelect ? "pointer" : "default",
                    transition: "stroke-width 0.2s ease",
                  }}
                  onClick={() => onSegmentSelect?.(segment.label)}
                >
                  <title>{`${segment.label}: ${segment.count}`}</title>
                </circle>
              );
            })}
        </svg>

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <strong style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", lineHeight: 1 }}>
            {total}
          </strong>
          <span style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "3px" }}>
            {label}
          </span>
        </div>
      </div>

      {total === 0 ? (
        <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "10px" }}>
          {emptyMessage}
        </p>
      ) : (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "10px",
            marginTop: "14px",
          }}
        >
          {segments.map((s) => (
            <div
              key={s.label}
              onClick={() => onSegmentSelect?.(s.label)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "12px",
                cursor: onSegmentSelect ? "pointer" : "default",
              }}
            >
              <span
                style={{
                  width: "9px",
                  height: "9px",
                  borderRadius: "50%",
                  backgroundColor: s.color,
                }}
              />
              <span style={{ color: "var(--color-text-secondary)" }}>
                {s.label}: <strong>{s.count}</strong>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
