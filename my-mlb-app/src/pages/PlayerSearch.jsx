import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function PlayerSearch() {
  const [players, setPlayers] = useState([]); // 存放球員列表
  const [searchTerm, setSearchTerm] = useState(""); // 搜尋關鍵字
  const [filteredPlayers, setFilteredPlayers] = useState([]); // 篩選結果
  const [selectedPlayer, setSelectedPlayer] = useState(null); // 存選中的球員
  const navigate = useNavigate(); // 用於程式導航（跳轉頁面）

  // 從後端 API 抓取球員資料
  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/players")
      .then((response) => response.json())
      .then((data) => setPlayers(data))
      .catch((error) => console.error("Error fetching players:", error));
  }, []);

  // 當使用者輸入時，更新搜尋結果
  useEffect(() => {
    if (searchTerm === "") {
      setFilteredPlayers([]); // 清空搜尋結果
    } else {
      const results = players
        .filter((player) =>
          player.Name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, 5); // 只顯示前 5 個匹配的結果
      setFilteredPlayers(results);
    }
  }, [searchTerm, players]);

  // 處理點擊球員名稱，選擇該球員
  const handleSelectPlayer = (player) => {
    setSearchTerm(player.Name);
    setSelectedPlayer(player); // 設定選擇的球員，包含 ID 和 Name
    setFilteredPlayers([]); // 清空建議列表
  };

  // 按鈕點擊事件，將選擇的球員 ID 傳給後端
  const sendPlayerToBackend = () => {
    if (!selectedPlayer) {
      alert("請選擇一位球員！");
      return;
    }

    console.log("前端發送 ID:", selectedPlayer.id); // 確保這裡不是 undefined

    fetch("http://127.0.0.1:5000/api/selected_player", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: selectedPlayer.id }), // 傳 ID
    })
    .then((response) => response.json())
    .then((data) => {
      console.log("後端回應:", data);
      alert(`後端回應: ${JSON.stringify(data)}`);
      if (data.error) {
        alert(`錯誤: ${data.error}`);
      } else {
        navigate(`/playerDetail/${selectedPlayer.id}`); // ⭐ 跳轉到球員詳細頁
      }
    })
    .catch((error) => console.error("Error sending player:", error));
};

  return (
    <div className="player-search-wrap">
      <div className="player-search-container">
        <h2>Search a Player</h2>

        {/* 搜尋輸入框 */}
        <input
          type="text"
          className="player-search-input"
          placeholder="Enter player name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* 顯示搜尋結果 */}
        {filteredPlayers.length > 0 && (
          <ul className="player-search-suggestions">
            {filteredPlayers.map((player, index) => (
              <li key={index} className="player-search-suggestion-item" onClick={() => handleSelectPlayer(player)}>
                {player.Name}
              </li>
            ))}
          </ul>
        )}

        {/* 送出按鈕 */}
        <button className="player-search-submit-button" onClick={sendPlayerToBackend}>
          Submit
        </button>

        {/* 顯示選擇的球員 */}
        {selectedPlayer && (
          <p className="player-search-selected-player">
            已選擇: {selectedPlayer.Name} (ID: {selectedPlayer.id})
          </p>
        )}
      </div>
    </div>
  );
}

export default PlayerSearch;