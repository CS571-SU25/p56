import { useEffect, useState } from "react";
import { getBaseURL } from "./utils";

export default function ActivityPage({ username }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (!username) return;

    fetch(`${getBaseURL()}activity-log?username=${encodeURIComponent(username)}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLogs(data);
      })
      .catch(err => console.error("Failed to fetch logs", err));
  }, [username]);

  return (
    <div style={{ padding: "24px" }}>
      <h2>Activity History</h2>
      {logs.length === 0 ? (
        <p>No activity yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {logs.map((log, index) => (
            <li key={index} style={{ marginBottom: "12px", background: "#1f2937", padding: "12px", borderRadius: "8px", color: "#f9fafb" }}>
              <div><strong>{log.action.toUpperCase()}</strong> — {log.filename}</div>
              <small>{new Date(log.timestamp).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}