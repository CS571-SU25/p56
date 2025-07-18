import React, { useState } from "react";
import { getBaseURL } from "./utils"; 

export default function FolderNameModal({ visible, onClose, onSubmit }) {
  const [folderName, setFolderName] = useState("");

  if (!visible) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (folderName.trim() === "") return;
    onSubmit(folderName.trim());
    setFolderName("");
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="loginthingy" onClick={(e) => e.stopPropagation()}>
        <h2>Create New Folder</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Folder name..."
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            autoFocus
          />
          <button type="submit">Create Folder</button>
        </form>
      </div>
    </div>
  );
}