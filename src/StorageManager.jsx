import { useEffect, useState } from "react";
import ConfirmModal from "./ConfirmModal";
import "./StorageManager.css";
import { getBaseURL } from "./utils";

function formatFileSize(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function StorageManager({ subdirectory, username, refreshSubdirs, setActiveView }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [pendingFolderDelete, setPendingFolderDelete] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!username) return;

    const baseParams = `username=${encodeURIComponent(username)}`;
    const url =
      subdirectory === "Home"
        ? `${getBaseURL()}files?${baseParams}`
        : `${getBaseURL()}files?dir=${encodeURIComponent(subdirectory)}&${baseParams}`;

    setLoading(true);
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setFiles(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching files:", err);
        setFiles([]);
        setLoading(false);
      });
  }, [subdirectory, username]);

  const handleDownload = (filename) => {
    const baseParams = `username=${encodeURIComponent(username)}`;
    const url =
      subdirectory === "Home"
        ? `${getBaseURL()}download/${filename}?${baseParams}`
        : `${getBaseURL()}download/${subdirectory}/${filename}?${baseParams}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.blob();
      })
      .then((blob) => {
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch((err) => console.error("Download error:", err));
  };

  const handleDeleteFile = (filename) => {
    setPendingDelete(filename);
    setConfirmVisible(true);
  };

  const confirmDelete = () => {
    const baseParams = `username=${encodeURIComponent(username)}`;

    if (pendingFolderDelete) {
      const url = `${getBaseURL()}delete-folder?username=${encodeURIComponent(
        username
      )}&dir=${encodeURIComponent(subdirectory)}`;

      fetch(url, { method: "DELETE" })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            alert("Failed to delete folder: " + data.error);
          } else {
            if (typeof refreshSubdirs === "function") refreshSubdirs();
            if (typeof setActiveView === "function") setActiveView("Home");
          }
          setConfirmVisible(false);
          setPendingFolderDelete(false);
        })
        .catch((err) => {
          alert("Delete failed: " + err.message);
          setConfirmVisible(false);
          setPendingFolderDelete(false);
        });
    } else if (pendingDelete) {
      const filename = pendingDelete;
      const url =
        subdirectory === "Home"
          ? `${getBaseURL()}delete-file?${baseParams}&file=${encodeURIComponent(filename)}`
          : `${getBaseURL()}delete-file?dir=${encodeURIComponent(subdirectory)}&${baseParams}&file=${encodeURIComponent(filename)}`;

      fetch(url, { method: "DELETE" })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            alert("Failed to delete file: " + data.error);
          } else {
            setFiles(prev => prev.filter(f => f.name !== filename));
          }
          setConfirmVisible(false);
          setPendingDelete(null);
        })
        .catch((err) => {
          alert("Delete failed: " + err.message);
          setConfirmVisible(false);
          setPendingDelete(null);
        });
    }
  };

  const handleUpload = (fileList) => {
    if (!fileList || fileList.length === 0) return;

    const baseParams = `username=${encodeURIComponent(username)}`;
    const uploadUrl =
      subdirectory === "Home"
        ? `${getBaseURL()}upload?${baseParams}`
        : `${getBaseURL()}upload?dir=${encodeURIComponent(subdirectory)}&${baseParams}`;

    const newUploads = Array.from(fileList).map((file) => ({
      name: file.name,
      progress: 0,
      started: Date.now()
    }));
    setUploadingFiles(prev => [...prev, ...newUploads]);

    const uploadPromises = Array.from(fileList).map((file) => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append("file", file);

        xhr.open("POST", uploadUrl, true);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setUploadingFiles((prev) =>
              prev.map((item) =>
                item.name === file.name
                  ? { ...item, progress: (event.loaded / event.total) * 100 }
                  : item
              )
            );
          }
        };

        xhr.onload = () => resolve();
        xhr.onerror = () => reject();
        xhr.send(formData);
      });
    });

    Promise.all(uploadPromises)
      .then(() => {
        const refreshUrl =
          subdirectory === "Home"
            ? `${getBaseURL()}files?${baseParams}`
            : `${getBaseURL()}files?dir=${encodeURIComponent(subdirectory)}&${baseParams}`;
        return fetch(refreshUrl);
      })
      .then((res) => res.json())
      .then((data) => {
        setFiles(data);
        setTimeout(() => setUploadingFiles([]), 1000);
      })
      .catch((err) => {
        console.error("Upload error:", err);
        setTimeout(() => setUploadingFiles([]), 1000);
      });
  };

  const handleDeleteCurrentFolder = () => {
    if (subdirectory === "Home") return;
    setPendingFolderDelete(true);
    setConfirmVisible(true);
  };

  return (
    <>
      <div className="upload-bar" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {subdirectory !== "Home" && (
          <button
            onClick={handleDeleteCurrentFolder}
            style={{
              backgroundColor: "#ef4444",
              color: "white",
              borderRadius: "8px",
              padding: "10px 20px",
              cursor: "pointer",
              fontSize: "14px",
              border: "none",
            }}
          >
            Delete Folder
          </button>
        )}
      </div>

      {loading ? (
        <p>Loading files...</p>
      ) : (
        <div className="grid-container">
          {files.map((file) => (
            <div key={file.name} className="file-tile">
              <strong>{file.name}</strong>
              <small>
                {new Date(file.created).toLocaleString()} — {formatFileSize(file.size)}
              </small>
              <button className="download-btn" onClick={() => handleDownload(file.name)}>
                Download
              </button>
              <button className="delete-btn" onClick={() => handleDeleteFile(file.name)}>
                Delete
              </button>
            </div>
          ))}

          <div
            className="file-tile upload-tile drop-zone"
            onClick={() => document.getElementById("upload-input").click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleUpload(e.dataTransfer.files);
            }}
            style={{
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              border: "2px dashed #aaa",
              padding: "20px",
              borderRadius: "10px",
              color: "#aaa"
            }}
          >
            <span style={{ fontSize: "3rem" }}>📁</span>
            <span>Click or drop files here!</span>
          </div>

          <input
            id="upload-input"
            type="file"
            style={{ display: "none" }}
            multiple
            onChange={(e) => handleUpload(e.target.files)}
          />
        </div>
      )}

      <ConfirmModal
        visible={confirmVisible}
        onClose={() => {
          setConfirmVisible(false);
          setPendingDelete(null);
          setPendingFolderDelete(false);
        }}
        onConfirm={confirmDelete}
        message={
          pendingFolderDelete
            ? `Are you sure you want to delete the folder "${subdirectory}"?`
            : `Are you sure you want to delete "${pendingDelete}"?`
        }
      />


      {uploadingFiles.length > 0 && (
        <div style={{
          position: "fixed",
          bottom: "16px",
          right: "16px",
          width: "280px",
          background: "rgba(31, 41, 55, 0.6)", // dark translucent
          color: "#fff",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.25)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          zIndex: 1000
        }}>
          <h4 style={{ marginTop: 0, marginBottom: "12px", fontSize: "15px", fontWeight: "500", color: "#e5e7eb" }}>
            Uploading...
          </h4>
          {uploadingFiles.map((file) => {
            const percent = Math.floor(file.progress);
            const elapsed = (Date.now() - file.started) / 1000;
            const eta = percent > 0 ? (elapsed / (percent / 100) - elapsed) : 0;

            return (
              <div key={file.name} style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "13px", marginBottom: "4px", color: "#d1d5db" }}>
                  {file.name} — {percent}% {eta > 0 && `(ETA: ${Math.ceil(eta)}s)`}
                </div>
                <div style={{
                  height: "6px",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "4px",
                  overflow: "hidden"
                }}>
                  <div style={{
                    width: `${percent}%`,
                    background: "linear-gradient(to right, #720dbbff, #e03bf6ff)",
                    height: "100%",
                    transition: "width 0.3s ease"
                  }}></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

export default StorageManager;