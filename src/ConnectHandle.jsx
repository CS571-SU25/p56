import { useState } from 'react';
import NotificationBanner from './NotificationBanner';
import "./ConnectHandle.css";
import { getBaseURL } from "./utils"; 

function ConnectHandle({ onSubmit }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notification, setNotification] = useState(null);

  const showNotification = (msg, type = "info") => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showNotification("Please fill in both fields!", "error");
      return;
    }

    const res = await fetch(`${getBaseURL()}login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (data.success) {
      onSubmit({ username, password });
    } else {
      showNotification(data.error || "Login failed", "error");
    }
  };

  const handleRegister = async () => {
    if (!username.trim() || !password.trim()) {
      showNotification("Please fill in both fields!", "error");
      return;
    }

    const res = await fetch(`${getBaseURL()}register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (data.success) {
      showNotification("Account created successfully! You can now log in.", "success");
    } else {
      showNotification(data.error || "Account creation failed", "error");
    }
  };

  const buttonStyle = {
    width: "100%",
    padding: "10px",
    fontSize: "15px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    marginTop: "10px",
  };

  return (
    <>
      <NotificationBanner
        message={notification?.message}
        type={notification?.type}
        onClose={() => setNotification(null)}
      />

      <div className="modal-backdrop">
        <div className="loginthingy">
          <form
            onSubmit={handleLogin}
            method="POST"
            action="/login"
            autoComplete="on"
          >
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={username}
              placeholder="Username..."
              onChange={(e) => setUsername(e.target.value)}
            />

            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              placeholder="Password..."
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="submit"
              style={{
                ...buttonStyle,
                backgroundColor: "#2563eb",
                color: "white"
              }}
            >
              Login
            </button>
          </form>
          <button
            type="button"
            onClick={handleRegister}
            style={{
              ...buttonStyle,
              backgroundColor: "#8b5cf6",
              color: "white"
            }}
          >
            Create Account
          </button>
        </div>
      </div>
    </>
  );
}

export default ConnectHandle;