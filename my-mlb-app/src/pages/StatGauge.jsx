import React from "react";
import {
  CircularProgressbar,
  buildStyles
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

const StatGauge = ({ percentage, label, value, color }) => {
  return (
    <div style={{ width: 120, margin: 10 }}>
      <CircularProgressbar
        value={percentage}
        text={`${percentage.toFixed(1)}%`}
        styles={buildStyles({
          pathColor: color,
          textColor: "#333",
          trailColor: "#eee"
        })}
      />
      <div style={{ textAlign: "center", marginTop: 5 }}>
        <strong>{label}</strong>
        <div>{value}</div>
      </div>
    </div>
  );
};

export default StatGauge;