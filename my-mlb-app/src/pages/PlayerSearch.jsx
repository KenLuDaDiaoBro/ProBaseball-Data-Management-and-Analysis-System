import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function PlayerSearch() {
  const [players, setPlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/players")
      .then((response) => response.json())
      .then((data) => setPlayers(data))
      .catch((error) => console.error("Error fetching players:", error));
  }, []);

  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      setFilteredPlayers([]);
      return;
    }

    const scored = players
      .map((player) => {
        const name = player.Name.toLowerCase();
        let score = 0;
        if (name.startsWith(term)) score += 2;
        else if (name.includes(term)) score += 1;
        return { ...player, score };
      })
      .filter((p) => p.score > 0)
      .sort((a, b) =>
        b.score !== a.score
          ? b.score - a.score
          : a.Name.localeCompare(b.Name)
      )
      .slice(0, 5)
      .map(({ score, ...p }) => p);

    setFilteredPlayers(scored);
  }, [searchTerm, players]);

  // 點選建議後直接發送並跳轉
  const handleSelectPlayer = (player) => {
    fetch("http://127.0.0.1:5000/api/selected_player", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: player.id }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          alert(`錯誤: ${data.error}`);
        } else {
          navigate(`/playerDetail/${player.id}`);
        }
      })
      .catch((error) => console.error("Error sending player:", error));
  };

  return (
    <div className="player-search-wrap">
      {/* 導航區 */}
      <div className="navigation-icons">
        <button className="back-button" onClick={() => navigate(-1)}>←</button>
        <img
          className="home-icon"
          src="/home-icon.svg"
          alt="Home"
          onClick={() => navigate("/")}
        />
      </div>

      {/* 搜尋區 */}
      <div className="player-search-container">
        <h2>Search a Player</h2>

        <input
          type="text"
          className="player-search-input"
          placeholder="Enter player name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {filteredPlayers.length > 0 && (
          <ul className="player-search-suggestions">
            {filteredPlayers.map((player, index) => (
              <li
                key={index}
                className="player-search-suggestion-item"
                onClick={() => handleSelectPlayer(player)}
              >
                {player.Name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default PlayerSearch;