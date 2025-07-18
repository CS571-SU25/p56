import React, { useEffect, useState } from 'react';
import { getBaseURL } from "./utils"; 

function NotificationBanner({ message, type = 'info', onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timeout = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [message, onClose]);

  if (!message) return null;

  const backgroundColors = {
    info: '#2563eb',
    success: '#10b981',
    error: '#ef4444',
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: visible ? '20px' : '-400px',
        maxWidth: '320px',
        transition: 'right 0.3s ease-in-out',
        backgroundColor: backgroundColors[type],
        color: 'white',
        padding: '12px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(onClose, 300);
        }}
        style={{
          marginLeft: '10px',
          background: 'transparent',
          border: 'none',
          color: 'white',
          fontSize: '18px',
          cursor: 'pointer',
        }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

export default NotificationBanner;