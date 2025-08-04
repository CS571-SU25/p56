import { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import ConnectHandle from "./ConnectHandle";
import StorageManager from "./StorageManager";
import FolderNameModal from "./FolderNameModal";
import ActivityPage from "./ActivityPage";
import { getBaseURL } from "./utils"; 

import "./App.css";

function App() {
  const [credentials, setCredentials] = useState(null);
  const [activeView, setActiveView] = useState("Home");
  const [subdirs, setSubdirs] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const navigate = useNavigate();

  const fetchSubdirs = () => {
    if (!credentials) return;

    fetch(`${getBaseURL()}subdirs?username=${encodeURIComponent(credentials.username)}`)
      .then((res) => res.json())
      .then((data) => {
        setSubdirs(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Failed to fetch subdirectories", err);
        setSubdirs([]);
      });
  };

  useEffect(() => {
    fetchSubdirs();
  }, [credentials]);

  const handleLoginSubmit = ({ username, password }) => {
    setCredentials({ username, password });
    navigate("/"); // ✅ Redirect to home
  };

  const handleLogout = () => {
    setCredentials(null);
    setActiveView("Home");
    setSubdirs([]);
    navigate("/"); // ✅ Redirect to home
  };

  const handleCreateFolder = (folderName) => {
    setModalVisible(false);
    fetch(`${getBaseURL()}create-folder?username=${encodeURIComponent(credentials.username)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderName }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          alert("Error creating folder: " + data.error);
        } else {
          fetchSubdirs();
        }
      })
      .catch((err) => {
        alert("Failed to create folder: " + err.message);
      });
  };

  if (!credentials) {
    return <ConnectHandle onSubmit={handleLoginSubmit} />;
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-top">
          <button
            className={activeView === "Home" ? "active" : ""}
            onClick={() => {
              setActiveView("Home");
              navigate("/");
            }}
          >
            Home
          </button>

          {Array.isArray(subdirs) &&
            subdirs.map((dir) => (
              <button
                key={dir}
                className={activeView === dir ? "active" : ""}
                onClick={() => {
                  setActiveView(dir);
                  navigate("/");
                }}
              >
                {dir}
              </button>
            ))}

          <button
            className={window.location.pathname === "/activity" ? "active" : ""}
            onClick={() => navigate("/activity")}
          >
            Activity Log
          </button>
        </div>

        <div className="sidebar-bottom">
          <button
            className="logout-btn"
            style={{ backgroundColor: "#2563eb", marginTop: "12px" }}
            onClick={() => setModalVisible(true)}
          >
            Add Folder
          </button>
          <button
            className="logout-btn"
            onClick={handleLogout}
            style={{ backgroundColor: "#eb2525ff", marginTop: "12px" }}
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <h3 className="welcome-header">Welcome, {credentials.username}!</h3>
                <StorageManager
                  subdirectory={activeView}
                  username={credentials.username}
                  refreshSubdirs={fetchSubdirs}
                  setActiveView={setActiveView}
                />
              </>
            }
          />
          <Route
            path="/activity"
            element={<ActivityPage username={credentials.username} />}
          />
        </Routes>
      </main>

      <FolderNameModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleCreateFolder}
      />
    </div>
  );
}

export default App;