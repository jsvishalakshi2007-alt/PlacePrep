export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div>
        <strong>PlacePrep</strong> &copy; {currentYear} &mdash; Structured Placement Preparation Tracker
      </div>
      <div style={{ display: "flex", gap: "16px" }}>
        <span>Privacy & Data Isolation Active</span>
        <span>Version 2.0.0-prod</span>
      </div>
    </footer>
  );
}
