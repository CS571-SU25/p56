import React from "react";
import { getBaseURL } from "./utils"; 
export default function ConfirmModal({ visible, onClose, onConfirm, message }) {
    if (!visible) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="loginthingy" onClick={(e) => e.stopPropagation()}>
                <h2>Confirm</h2>
                <p style={{ marginBottom: "1em" }}>{message}</p>
                <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "1rem" }}>
                    <button onClick={onClose} style={{ backgroundColor: "#9ca3af" }}>
                        Cancel
                    </button>
                    <button onClick={onConfirm} style={{ backgroundColor: "#ef4444" }}>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}