import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function PlayerDetail() {
  const { id } = useParams(); // 取得 URL 中的球員 ID
  const navigate = useNavigate(); // 用於頁面跳轉
  const [playerData, setPlayerStats] = useState([]); // 存儲球員數據
  const [searchTerm, setSearchTerm] = useState(""); // 存儲搜尋關鍵字
  const [players, setPlayers] = useState([]); // 存儲所有球員列表
  const [filteredPlayers, setFilteredPlayers] = useState([]); // 篩選後的球員
  const [selectedPlayer, setSelectedPlayer] = useState(null); // 存儲選擇的球員

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
        } else {
          setPlayerStats([]); // 避免 undefined
        }
      })
      .catch((error) => {
        console.error("Error fetching player details:", error);
        setPlayerStats([]);
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

  if (!playerData.length) return <p>Loading player stats...</p>;

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
                <th>BB</th><th>SO</th><th>WHIP</th><th>Chase%</th><th>Whiff%</th>
                <th>GB</th><th>FB</th><th>G/F</th>
              </tr>
            </thead>
            <tbody>
              {playerData.map((stat, index) => (
                <tr key={index}>
                  <td>{stat.Year}</td><td>{stat.Team}</td><td>{stat.W}</td><td>{stat.L}</td><td>{stat.ERA}</td>
                  <td>{stat.IP}</td><td>{stat.H}</td><td>{stat.R}</td><td>{stat.ER}</td><td>{stat.HR}</td>
                  <td>{stat.BB}</td><td>{stat.SO}</td><td>{stat.WHIP}</td><td>{stat.Chase}</td><td>{stat.Whiff}</td>
                  <td>{stat.GB}</td><td>{stat.FB}</td><td>{stat.GF}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Unknown player type</p>
        )}
      </div>
    </div>
    
  );
}

export default PlayerDetail;
  