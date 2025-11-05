// src/admin/Context/NotificationContext.jsx
// src/admin/Context/NotificationContext.jsx
import React, { createContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import API from "../../../api/api";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const socket = io(API.URL); // Make sure URL is correct
    socket.on("new-order", (order) => {
      setNotifications((prev) => {
        const updated = [order, ...prev];
        return updated.slice(0, 5); // Keep only top 5 recent orders
      });
    });
    return () => socket.disconnect();
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, setNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

