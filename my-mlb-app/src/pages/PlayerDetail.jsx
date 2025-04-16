import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StatGauge from "./StatGauge";
import {
  CircularProgressbarWithChildren,
  buildStyles
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

function PlayerDetail() {
  const { id } = useParams(); // 取得 URL 中的球員 ID
  const navigate = useNavigate(); // 用於頁面跳轉
  const [playerData, setPlayerStats] = useState([]); // 存儲球員數據
  const [searchTerm, setSearchTerm] = useState(""); // 存儲搜尋關鍵字
  const [players, setPlayers] = useState([]); // 存儲所有球員列表
  const [filteredPlayers, setFilteredPlayers] = useState([]); // 篩選後的球員
  const [allPlayersData, setAllPlayersData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(2024);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/selected_player", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    })
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPlayerStats(data);
  
          // 取得最大年份作為預設 selectedYear
          const years = data.map(p => p.Year).filter(y => typeof y === 'number');
          const maxYear = Math.max(...years);
          setSelectedYear(maxYear);
        } else {
          setPlayerStats([]);
          setSelectedYear(null); // 清除年份選擇
        }
      })
      .catch((error) => {
        console.error("Error fetching player details:", error);
        setPlayerStats([]);
        setSelectedYear(null);
      });
  }, [id]);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/players")
      .then((response) => response.json())
      .then((data) => setPlayers(data))
      .catch((error) => console.error("Error fetching players:", error));
  }, []);

  // 搜尋功能
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredPlayers([]); // 搜尋欄為空則清空建議列表
    } else {
      const results = players
        .filter((player) =>
          player.Name.toLowerCase().includes(searchTerm.trim().toLowerCase())
        )
        .slice(0, 5); // 只顯示前 5 個結果
      setFilteredPlayers(results);
    }
  }, [searchTerm, players]);

  // 選擇球員時自動跳轉
  const handleSelectPlayer = (player) => {
    setSearchTerm(""); // 清空搜尋框
    setFilteredPlayers([]);
    navigate(`/playerDetail/${player.id}`); // 直接跳轉
  };

  useEffect(() => {
    if (selectedYear) {
      getGaugeData();
    }
  }, [selectedYear]);

  fetch(`http://127.0.0.1:5000/api/players_stats?year=${selectedYear}`)
  .then(response => response.json())
  .then(data => {
    // 根據年份篩選到的數據
    setAllPlayersData(data);
  })
  .catch(error => {
    console.error("Error fetching stats:", error);
  });

  const getGaugeData = () => {
    if (!players.length || !playerData.length || !allPlayersData.length) return [];
  
    const current = playerData.find((p) => Number(p.Year) === Number(selectedYear));
    console.log("🧪 current:", current);
    console.log("📅 selectedYear:", selectedYear);
    console.log("🧮 allPlayersData sample:", allPlayersData.slice(0, 5));
    const type = current.Type;
  
    if (!current || !type) return [];
  
    let fields = [];
    let lowerIsBetter = {};
  
    if (type === "Batter") {
      fields = ["AVG", "OBP", "SLG", "OPS"];
    } else if (type === "Pitcher") {
      fields = ["ERA", "WHIP", "K9", "BB9"];
      lowerIsBetter = { ERA: true, WHIP: true, BB9: true, K9: false };
    }

  
    return fields.map((field) => {
      const currentValue = parseFloat(current[field]);
      const allValues = allPlayersData
        .filter((p) => p.Type === type && p.Year === selectedYear)
        .map((p) => parseFloat(p[field]))
        .filter((n) => !isNaN(n));
  
      const isLowerBetter = lowerIsBetter[field] || false;
      const sorted = [...allValues].sort((a, b) => isLowerBetter ? a - b : b - a);
      const rank = sorted.findIndex(val => val === currentValue);
      const percent = rank === -1 ? 0 : Math.round(((sorted.length - rank) / sorted.length) * 100);

      console.log(current)
      
      console.log("📊 field:", fields, "currentValue:", currentValue, "allValues:", allValues);
  
      return { field, value: currentValue, percent };
    });
  };

  const getColorByPercent = (percent) => {
    if (percent >= 90) return "#3b82f6"; // 藍
    if (percent >= 70) return "#10b981"; // 綠
    if (percent >= 40) return "#facc15"; // 黃
    return "#ef4444"; // 紅
  };

  if (!playerData.length) return <p>Loading player stats...</p>;

  const gaugeData = getGaugeData();

  return (
    <div className="player-detail-container">
      {/* 搜尋框 */}
      <div className="player-detail-search-box">
        <input
          type="text"
          placeholder="Search for a player..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="player-detail-search-input"
        />
        {filteredPlayers.length > 0 && (
          <ul className="player-detail-suggestions">
            {filteredPlayers.map((player) => (
              <li key={player.id} onClick={() => handleSelectPlayer(player)}>
                {player.Name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <h1 className="player-detail-player-name">
        {playerData.length > 0 ? playerData[0].Name : "Loading..."}
      </h1>

      <div style={{ marginBottom: "16px" }}>
        <label htmlFor="yearSelect" style={{ marginRight: "8px", fontWeight: "bold" }}>Select Year:</label>
        <select
          id="yearSelect"
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          style={{ padding: "4px 8px", borderRadius: "6px", fontWeight: "bold" }}
        >
          {Array.from(new Set(playerData.map((p) => p.Year)))
            .sort((a, b) => b - a)
            .map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
        </select>
      </div>

      <div className="gauge-wrapper">
        {gaugeData.map((item, index) => (
          <div className="gauge-item" key={index}>
            <CircularProgressbarWithChildren
              value={item.percent}
              styles={buildStyles({
                pathColor: getColorByPercent(item.percent),
                trailColor: "#d1d5db"
              })}
            >
              <div style={{ fontSize: 36, fontWeight: "bold", marginBottom: 8 }}>
                {item.percent}
              </div>
              <strong style={{ fontSize: 16, fontWeight: "bold" }}>{item.field}</strong>
            </CircularProgressbarWithChildren>
          </div>
        ))}
      </div>

      <div className="player-detail-player-stats">
        {playerData[0].Type === "Batter" ? (
          <table className="player-detail-stats-table">
            <thead>
              <tr>
                <th>Year</th><th>Team</th><th>PA</th><th>AB</th><th>H</th>
                <th>2B</th><th>3B</th><th>HR</th><th>RBL</th><th>SO</th>
                <th>BB</th><th>SB</th><th>CS</th><th>AVG</th><th>OBP</th>
                <th>SLG</th><th>OPS</th><th>Chase%</th><th>Whiff%</th><th>GB</th>
                <th>FB</th><th>G/F</th><th>Sprint</th>
              </tr>
            </thead>
            <tbody>
              {playerData.map((stat, index) => (
                <tr key={index}>
                  <td>{stat.Year}</td><td>{stat.Team}</td><td>{stat.PA}</td><td>{stat.AB}</td><td>{stat.H}</td>
                  <td>{stat.H2}</td><td>{stat.H3}</td><td>{stat.HR}</td><td>{stat.RBL}</td><td>{stat.SO}</td>
                  <td>{stat.BB}</td><td>{stat.SB}</td><td>{stat.CS}</td><td>{stat.AVG}</td><td>{stat.OBP}</td>
                  <td>{stat.SLG}</td><td>{stat.OPS}</td><td>{stat.Chase}</td><td>{stat.Whiff}</td><td>{stat.GB}</td>
                  <td>{stat.FB}</td><td>{stat.GF}</td><td>{stat.Sprint}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : playerData[0].Type === "Pitcher" ? (
          <table className="player-detail-stats-table">
            <thead>
              <tr>
                <th>Year</th><th>Team</th><th>W</th><th>L</th><th>ERA</th>
                <th>IP</th><th>H</th><th>R</th><th>ER</th><th>HR</th>
                <th>SO</th><th>K9</th><th>BB</th><th>BB9</th><th>WHIP</th>
                <th>Chase%</th><th>Whiff%</th><th>GB</th><th>FB</th><th>G/F</th>
              </tr>
            </thead>
            <tbody>
              {playerData.map((stat, index) => (
                <tr key={index}>
                  <td>{stat.Year}</td><td>{stat.Team}</td><td>{stat.W}</td><td>{stat.L}</td><td>{stat.ERA}</td>
                  <td>{stat.IP}</td><td>{stat.H}</td><td>{stat.R}</td><td>{stat.ER}</td><td>{stat.HR}</td>
                  <td>{stat.SO}</td><td>{stat.K9}</td><td>{stat.BB}</td><td>{stat.BB9}</td><td>{stat.WHIP}</td>
                  <td>{stat.Chase}</td><td>{stat.Whiff}</td><td>{stat.GB}</td><td>{stat.FB}</td><td>{stat.GF}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Unknown player type</p>
        )}
      </div>

      <button className="back-button" onClick={() => navigate(-1)}>←</button>

      <img
        className="home-icon"
        src="/home-icon.svg" // 建議放 public 目錄
        alt="Home"
        onClick={() => navigate("/")}
        style={{ height: "30px" }}
      />
    </div>
    
  );
}

export default PlayerDetail;
  