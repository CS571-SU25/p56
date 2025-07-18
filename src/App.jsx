import { useState, useEffect } from "react";
import ConnectHandle from "./ConnectHandle";
import StorageManager from "./StorageManager";
import FolderNameModal from "./FolderNameModal";
import { getBaseURL } from "./utils"; 

import "./App.css";

function App() {
  const [credentials, setCredentials] = useState(null);
  const [activeView, setActiveView] = useState("Home");
  const [subdirs, setSubdirs] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  const [serverMode, setServerMode] = useState(() => localStorage.getItem("serverMode") || "local");
  useEffect(() => {
    localStorage.setItem("serverMode", serverMode);
  }, [serverMode]);

  const toggleServerMode = () => {
    setServerMode((prev) => (prev === "local" ? "lila" : "local"));
  };


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
  };

  const handleLogout = () => {
    setCredentials(null);
    setActiveView("Home");
    setSubdirs([]);
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

  return (
    <>
      {!credentials && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            textAlign: "center",
            zIndex: 99999,
          }}
        >
        </div>
      )}

      {!credentials && <ConnectHandle onSubmit={handleLoginSubmit} />}

      {credentials && (
        <div className="app-container">
          <aside className="sidebar">
            <div className="sidebar-top">
              <button
                className={activeView === "Home" ? "active" : ""}
                onClick={() => setActiveView("Home")}
              >
                <span>Home</span>
              </button>

              {Array.isArray(subdirs) &&
                subdirs.map((dir) => (
                  <button
                    key={dir}
                    className={activeView === dir ? "active" : ""}
                    onClick={() => setActiveView(dir)}
                  >
                    <span>{dir}</span>
                  </button>
                ))}
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
            <h3 className="welcome-header">Welcome, {credentials.username}!</h3>
            <StorageManager
              subdirectory={activeView}
              username={credentials.username}
              refreshSubdirs={fetchSubdirs}
              setActiveView={setActiveView}
            />
          </main>
        </div>
      )}


      <FolderNameModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleCreateFolder}
      />
    </>
  );
}

export default App;