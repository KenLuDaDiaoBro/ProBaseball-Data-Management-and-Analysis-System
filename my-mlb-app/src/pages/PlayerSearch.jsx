import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function PlayerSearch() {
  const [players, setPlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/players")
      .then((response) => response.json())
      .then((data) => setPlayers(data))
      .catch((error) => console.error("Error fetching players:", error));
  }, []);

  useEffect(() => {
    if (searchTerm === "") {
      setFilteredPlayers([]);
    } else {
      const results = players
        .filter((player) =>
          player.Name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, 5);
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

    fetch("http://127.0.0.1:5000/api/selected_player", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: selectedPlayer.id }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          alert(`錯誤: ${data.error}`);
        } else {
          navigate(`/playerDetail/${selectedPlayer.id}`);
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

        <button
          className="player-search-submit-button"
          onClick={sendPlayerToBackend}
        >
          Submit
        </button>

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
