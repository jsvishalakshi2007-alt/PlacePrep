export default function StatCard({
  icon,
  iconColor = "green",
  label,
  value,
  secondaryText,
  onClick,
}) {
  return (
    <div
      className="stat-card"
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      {icon && <div className={`stat-icon ${iconColor}`}>{icon}</div>}
      <div className="stat-info">
        <span className="stat-label">{label}</span>
        <div className="stat-value">{value}</div>
        {secondaryText && (
          <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
            {secondaryText}
          </span>
        )}
      </div>
    </div>
  );
}
