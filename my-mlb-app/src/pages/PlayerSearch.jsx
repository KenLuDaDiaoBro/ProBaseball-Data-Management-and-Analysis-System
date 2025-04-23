import React, { useState, useEffect } from "react"; 
import { useNavigate } from "react-router-dom";

function PlayerSearch() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOptions, setFilteredOptions] = useState([]);
  const navigate = useNavigate();

  // 拉球員
  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/players")
      .then((r) => r.json())
      .then(setPlayers)
      .catch(console.error);
  }, []);

  // 拉球隊
  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/teams")
      .then((r) => r.json())
      .then(setTeams)
      .catch(console.error);
  }, []);

  // 打分＋合併＋排序＋Top5
  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      setFilteredOptions([]);
      return;
    }

    const scoreList = (items, keyGetter, type) =>
      items
        .map((it) => {
          const key = keyGetter(it).toLowerCase();
          let score = 0;
          if (key.startsWith(term)) score += 2;
          else if (key.includes(term)) score += 1;
          return { ...it, score, type };
        })
        .filter((it) => it.score > 0);

    const scoredPlayers = scoreList(players, (p) => p.Name, "player");
    const scoredTeams   = scoreList(teams,   (t) => t.code,  "team");

    const combined = [...scoredPlayers, ...scoredTeams]
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const aKey = a.type === "player" ? a.Name : a.code;
        const bKey = b.type === "player" ? b.Name : b.code;
        return aKey.localeCompare(bKey);
      })
      .slice(0, 5)
      .map(({ score, ...rest }) => rest);

    setFilteredOptions(combined);
  }, [searchTerm, players, teams]);

  // 點選建議
  const handleSelect = (opt) => {
    if (opt.type === "player") {
      fetch("http://127.0.0.1:5000/api/selected_player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: opt.id }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.error) alert(data.error);
          else navigate(`/playerDetail/${opt.id}`);
        })
        .catch(console.error);
    } else {
      navigate(`/team/${opt.code}`);
    }
    setSearchTerm("");
    setFilteredOptions([]);
  };

  return (
    <div className="player-search-wrap">
      <div className="navigation-icons">
        <button className="back-button" onClick={() => navigate(-1)}>←</button>
        <img
          className="home-icon"
          src="/home-icon.svg"
          alt="Home"
          onClick={() => navigate("/")}
        />
      </div>

      {/* 新增一層只包 input + suggestions 的 wrapper */}
      <div className="player-search-body">
        <h2 className="player-search-title">Search</h2>
        <input
          type="text"
          className="player-search-input"
          placeholder="Search for a player or a team..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {filteredOptions.length > 0 && (
          <ul className="player-search-suggestions">
            {filteredOptions.map((opt, i) => (
              <li
                key={i}
                className="player-search-suggestion-item"
                onClick={() => handleSelect(opt)}
              >
                {opt.type === "player" ? opt.Name : opt.code}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default PlayerSearch;