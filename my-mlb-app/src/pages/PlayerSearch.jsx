import { useState, useEffect } from "react";

function PlayerSearch() {
  const [players, setPlayers] = useState([]); // 存放所有球員名稱
  const [searchTerm, setSearchTerm] = useState(""); // 使用者輸入的搜尋關鍵字
  const [filteredPlayers, setFilteredPlayers] = useState([]); // 搜尋結果
  const [selectedPlayer, setSelectedPlayer] = useState(null); // 存選中的球員

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
      setFilteredPlayers([]); // 如果輸入框是空的，清空建議
    } else {
      const results = players
        .filter((player) => 
          player.Name.toLowerCase().includes(searchTerm.toLowerCase()) // 依據名稱過濾
        )
        .slice(0, 5); // 只顯示前 5 個匹配的結果
      setFilteredPlayers(results);
    }
  }, [searchTerm, players]);

  // 處理點擊球員名稱，將其填入輸入框
  const handleSelectPlayer = (playerName) => {
    setSearchTerm(playerName);
    setSelectedPlayer(playerName);
    setFilteredPlayers([]); // 清空建議列表
  };

  // 按鈕點擊事件，將選擇的球員回傳後端
  const sendPlayerToBackend = () => {
    if (!selectedPlayer) {
      alert("請選擇一位球員！");
      return;
    }

    fetch("http://127.0.0.1:5000/api/selected_player", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: selectedPlayer }),
    })
      .then((response) => response.json())
      .then((data) => alert(`後端回應: ${data.message}`))
      .catch((error) => console.error("Error sending player:", error));
  };

  return (
    <div className="wrap">
      <div className="search-container">
        <h2>Search a Player</h2>

        {/* 搜尋輸入框 */}
        <input
          type="text"
          className="search-input"
          placeholder="Enter player name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* 顯示搜尋結果 */}
        {filteredPlayers.length > 0 && (
          <ul className="suggestions">
            {filteredPlayers.map((player, index) => (
              <li key={index} className="suggestion-item" onClick={() => handleSelectPlayer(player.Name)}>
                {player.Name}
              </li>
            ))}
          </ul>
        )}

        {/* 送出按鈕 */}
        <button className="submit-button" onClick={sendPlayerToBackend}>
          Submit
        </button>

        {/* 顯示選擇的球員 */}
        {selectedPlayer && <p className="selected-player">已選擇: {selectedPlayer}</p>}
      </div>
    </div>
    
  );
}

export default PlayerSearch;

// my-mlb-app
// npm run dev