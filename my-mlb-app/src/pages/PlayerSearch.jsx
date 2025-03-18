import { useState, useEffect } from "react";

function PlayerSearch() {
  const [players, setPlayers] = useState([]); // 存放所有球員名稱
  const [searchTerm, setSearchTerm] = useState(""); // 使用者輸入的搜尋關鍵字
  const [filteredPlayers, setFilteredPlayers] = useState([]); // 搜尋結果

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

  return (
    <div className="container">
      <h2>Search for a Player</h2>
      {/* 搜尋輸入框 */}
      <input
        type="text"
        placeholder="Enter player name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      {/* 顯示搜尋結果 */}
      {filteredPlayers.length > 0 && (
        <ul className="suggestions">
          {filteredPlayers.map((player, index) => (
            <li key={index}>{player.Name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PlayerSearch;