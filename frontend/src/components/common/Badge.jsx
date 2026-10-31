export default function Badge({
  children,
  variant = "green",
  className = "",
  style = {},
}) {
  let badgeClass;

  switch (variant) {
    case "applied":
      badgeClass = "badge-applied";
      break;
    case "online-test":
    case "Online Test":
      badgeClass = "badge-online-test";
      break;
    case "interview":
    case "Interview":
      badgeClass = "badge-interview";
      break;
    case "offer":
    case "Offer":
      badgeClass = "badge-offer";
      break;
    case "rejected":
    case "Rejected":
      badgeClass = "badge-rejected";
      break;
    case "scheduled":
    case "Scheduled":
      badgeClass = "badge-scheduled";
      break;
    case "completed":
    case "Completed":
      badgeClass = "badge-completed";
      break;
    case "cancelled":
    case "Cancelled":
      badgeClass = "badge-cancelled";
      break;
    case "easy":
    case "Easy":
      badgeClass = "badge-easy";
      break;
    case "medium":
    case "Medium":
      badgeClass = "badge-medium";
      break;
    case "hard":
    case "Hard":
      badgeClass = "badge-hard";
      break;
    case "blue":
      badgeClass = "badge-blue";
      break;
    case "amber":
      badgeClass = "badge-amber";
      break;
    case "red":
      badgeClass = "badge-red";
      break;
    case "purple":
      badgeClass = "badge-purple";
      break;
    case "green":
    default:
      badgeClass = "badge-green";
      break;
  }

  return (
    <span className={`badge ${badgeClass} ${className}`} style={style}>
      {children}
    </span>
  );
}
