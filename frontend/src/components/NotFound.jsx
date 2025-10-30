import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./css/NotFound.module.css";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <h2>404 - Page Not Found</h2>
      <p>The page you're looking for doesn’t exist.</p>
      <button className={styles.button} onClick={() => navigate("/")}>
        Go Home
      </button>
    </div>
  );
};

export default NotFound;
