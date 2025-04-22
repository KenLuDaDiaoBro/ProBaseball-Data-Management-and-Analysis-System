import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CircularProgressbarWithChildren,
  buildStyles
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

function TeamDetail() {
    const { code } = useParams();
  
    return <div>正在看 {code} 的戰績…</div>;
}

export default TeamDetail;