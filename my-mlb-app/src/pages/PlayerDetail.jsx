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

  const handleSelectPlayer = (player) => {
    setSearchTerm(player.Name);
    setSelectedPlayer(player);
    setFilteredPlayers([]);
  };

  const sendPlayerToBackend = () => {
    if (!selectedPlayer) {
      alert("請選擇一位球員！");
      return;
    }

    console.log("前端發送 ID:", selectedPlayer.id);

    fetch("http://127.0.0.1:5000/api/selected_player", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selectedPlayer.id }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("後端回應:", data);
        if (data.error) {
          alert(`錯誤: ${data.error}`);
        } else {
          navigate(`/playerDetail/${selectedPlayer.id}`); // 跳轉到球員詳細頁
        }
      })
      .catch((error) => console.error("Error sending player:", error));
  };

  if (!playerData || playerData.length === 0) {
    return <p>Loading player stats...</p>;
  }

  const playerType = playerData[0]?.Type || "unknown"; // 確保 `Type` 存在

  return (
    <div className="player-detail-container">
      {/* 搜尋框 */}
      <div className="search-box">
        <input
          type="text"
          placeholder="Search for a player..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        {filteredPlayers.length > 0 && (
          <ul className="suggestions">
            {filteredPlayers.map((player) => (
              <li key={player.id} onClick={() => handleSelectPlayer(player)}>
                {player.Name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <button onClick={sendPlayerToBackend} className="search-btn">
        Search
      </button>

      <h1 className="player-name">
        {playerData.length > 0 ? playerData[0].Name : "Loading..."}
      </h1>

      <div className="player-stats">
        {playerData[0].Type === "Batter" ? (
          <table className="stats-table">
            <thead>
              <tr>
                <th>Year</th>
                <th>Team</th>
                <th>PA</th>
                <th>AB</th>
                <th>H</th>
                <th>HR</th>
                <th>AVG</th>
                <th>OBP</th>
                <th>SLG</th>
              </tr>
            </thead>
            <tbody>
              {playerData.map((stat, index) => (
                <tr key={index}>
                  <td>{stat.Year}</td>
                  <td>{stat.Team}</td>
                  <td>{stat.PA}</td>
                  <td>{stat.AB}</td>
                  <td>{stat.H}</td>
                  <td>{stat.HR}</td>
                  <td>{stat.AVG}</td>
                  <td>{stat.OBP}</td>
                  <td>{stat.SLG}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : playerType === "Pitcher" ? (
          <table className="stats-table">
            <thead>
              <tr>
                <th>Year</th>
                <th>Team</th>
                <th>IP</th>
                <th>ERA</th>
                <th>WHIP</th>
                <th>SO</th>
                <th>BB</th>
                <th>W</th>
                <th>L</th>
              </tr>
            </thead>
            <tbody>
              {playerData.map((stat, index) => (
                <tr key={index}>
                  <td>{stat.Year}</td>
                  <td>{stat.Team}</td>
                  <td>{stat.IP}</td>
                  <td>{stat.ERA}</td>
                  <td>{stat.WHIP}</td>
                  <td>{stat.SO}</td>
                  <td>{stat.BB}</td>
                  <td>{stat.W}</td>
                  <td>{stat.L}</td>
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
  