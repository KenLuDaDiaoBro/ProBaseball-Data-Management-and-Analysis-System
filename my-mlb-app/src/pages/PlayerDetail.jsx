import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  const [teams, setTeams] = useState([]);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [allPlayersData, setAllPlayersData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const updatedStats = [...playerData];
  const yearsWithTeams = useMemo(() => {
    return new Set(
      playerData
        .filter((stat) => stat.Team && stat.Team.includes("Teams"))
        .map((stat) => stat.Year)
    );
  }, [playerData]);

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

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/teams")
      .then((res) => res.json())
      .then((data) => setTeams(data))   // data = [{ code: 'LAD', name: 'Los Angeles Dodgers' }, ...]
      .catch(console.error);
  }, []);

  // 搜尋功能
  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      setFilteredOptions([]);
      return;
    }
  
    // 1. 球員打分
    const scoredPlayers = players
      .map((p) => {
        const name = p.Name.toLowerCase();
        let score = 0;
        if (name.startsWith(term)) score += 2;
        else if (name.includes(term)) score += 1;
        return { ...p, score, type: 'player' };
      })
      .filter((p) => p.score > 0);
  
    // 2. 球隊打分
    const scoredTeams = teams
      .map((t) => {
        const code = t.code.toLowerCase();
        let score = 0;
        if (code.startsWith(term)) score += 2;
        else if (code.includes(term)) score += 1;
        return { ...t, score, type: 'team' };
      })
      .filter((t) => t.score > 0);
  
    // 3. 合併、排序、取前 5
    const combined = [...scoredPlayers, ...scoredTeams]
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        // 同分就按名字/代號
        const aKey = a.type === 'player' ? a.Name : a.code;
        const bKey = b.type === 'player' ? b.Name : b.code;
        return aKey.localeCompare(bKey);
      })
      .slice(0, 5)
      .map(({ score, ...rest }) => rest);
  
    setFilteredOptions(combined);
  }, [searchTerm, players, teams]);

  // 選擇下拉選項 (player 或 team) 時跳轉
 const handleSelectOption = (opt) => {
   setSearchTerm("");
   setFilteredOptions([]);      // ← 這裡清空 filteredOptions
   if (opt.type === "player") {
    navigate(`/playerDetail/${opt.id}`);
   } else {
    navigate(`/team/${opt.code}`);
   }
 };

  useEffect(() => {
    if (selectedYear) {
      fetch(`http://127.0.0.1:5000/api/players_stats?year=${selectedYear}`)
        .then(response => response.json())
        .then(data => {
          setAllPlayersData(data);
        })
        .catch(error => {
          console.error("Error fetching stats:", error);
        });
    }
  }, [selectedYear]); // ✅ 修改：依賴 selectedYear

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

  const gaugeData = getGaugeData();

  const getBatterSummary = () => {
    const summary = {
      PA: 0, AB: 0, H: 0, H2: 0, H3: 0, HR: 0, RBI: 0, SO: 0,
      BB: 0, SB: 0, CS: 0, AVG: 0, OBP: 0, SLG: 0, OPS: 0,
      Chase: 0, Whiff: 0, GB: 0, FB: 0, GF: 0
    };
  
    playerData.forEach(stat => {
      summary.Chase += parseFloat(stat.Chase) * Number(stat.PA) || 0;
      summary.Whiff += parseFloat(stat.Whiff) * Number(stat.PA) || 0;
      summary.GB += parseFloat(stat.GB) * Number(stat.PA) || 0;
      summary.FB += parseFloat(stat.FB) * Number(stat.PA) || 0;

      if (stat.Team && stat.Team.includes("Team")) return;
  
      summary.PA += Number(stat.PA) || 0;
      summary.AB += Number(stat.AB) || 0;
      summary.H += Number(stat.H) || 0;
      summary.H2 += Number(stat.H2) || 0;
      summary.H3 += Number(stat.H3) || 0;
      summary.HR += Number(stat.HR) || 0;
      summary.RBI += Number(stat.RBI) || 0;
      summary.SO += Number(stat.SO) || 0;
      summary.BB += Number(stat.BB) || 0;
      summary.SB += Number(stat.SB) || 0;
      summary.CS += Number(stat.CS) || 0;
      summary.OBP += parseFloat(stat.OBP) * Number(stat.PA) || 0;
    });
  
    summary.AVG = (summary.H / summary.AB).toFixed(3) || 0;
    summary.OBP = (summary.OBP / summary.PA).toFixed(3);
    summary.SLG = ((summary.H + summary.H2 + 2 * summary.H3 + 3 * summary.HR) / summary.AB).toFixed(3) || 0;
    summary.OPS = (Number(summary.OBP) + Number(summary.SLG)).toFixed(3) || 0;
    summary.Chase = (summary.Chase / summary.PA).toFixed(1);
    summary.Whiff = (summary.Whiff / summary.PA).toFixed(1);
    summary.GB = (summary.GB / summary.PA).toFixed(1);
    summary.FB = (summary.FB / summary.PA).toFixed(1);
    summary.GF = (summary.GB / summary.FB).toFixed(2);
  
    return summary;
  };
  
  function parseIP(ipStr) {
    const ip = parseFloat(ipStr);
    if (isNaN(ip)) return 0;
  
    const fullInnings = Math.floor(ip);
    const outs = Math.round((ip - fullInnings) * 10);

    return fullInnings * 3 + outs;
  }

  function formatIPFromOuts(outs) {
    const innings = Math.floor(outs / 3);
    const remainingOuts = outs % 3;
    return `${innings}.${remainingOuts}`;
  }
  
  const getPitcherSummary = () => {
    const summary = {
      W: 0, L: 0, ERA: 0, IP: 0, H: 0, R: 0, ER: 0, HR: 0,
      SO: 0, K9: 0, BB: 0, BB9: 0, WHIP: 0, Chase: 0,
      Whiff: 0, GB: 0, FB: 0, GF: 0
    };
  
    playerData.forEach(stat => {
      summary.Chase += parseFloat(stat.Chase) * parseIP(stat.IP) || 0;
      summary.Whiff += parseFloat(stat.Whiff) * parseIP(stat.IP) || 0;
      summary.GB += parseFloat(stat.GB) * parseIP(stat.IP) || 0;
      summary.FB += parseFloat(stat.FB) * parseIP(stat.IP) || 0;

      if (stat.Team && stat.Team.includes("Team")) return;

      summary.W += Number(stat.W) || 0;
      summary.L += Number(stat.L) || 0;
      summary.IP += parseIP(stat.IP) || 0;
      summary.H += Number(stat.H) || 0;
      summary.R += Number(stat.R) || 0;
      summary.ER += Number(stat.ER) || 0;
      summary.HR += Number(stat.HR) || 0;
      summary.SO += Number(stat.SO) || 0;
      summary.BB += Number(stat.BB) || 0;
      summary.WHIP += parseFloat(stat.WHIP) * parseIP(stat.IP) / 3 || 0;
    });
  
    summary.ERA = (summary.ER / summary.IP * 27).toFixed(2);
    summary.K9 = (summary.SO / summary.IP * 27).toFixed(2);
    summary.BB9 = (summary.BB / summary.IP * 27).toFixed(2);
    summary.WHIP = (summary.WHIP / summary.IP * 3).toFixed(2);
    summary.Chase = (summary.Chase / summary.IP).toFixed(1);
    summary.Whiff = (summary.Whiff / summary.IP).toFixed(1);
    summary.GB = (summary.GB / summary.IP).toFixed(1);
    summary.FB = (summary.FB / summary.IP).toFixed(1);
    summary.IP = formatIPFromOuts(summary.IP);
    summary.GF = (summary.GB / summary.FB).toFixed(2);
  
    return summary;
  };

  updatedStats.forEach(r => {
    if (yearsWithTeams.has(r.Year) && !r.Team.includes("Teams")) {
      r.Chase = "/";
      r.Whiff = "/";
      r.GB = "/";
      r.FB = "/";
      r.GF = "/";
    }
  });

  if (!playerData.length) return <p>Loading player stats...</p>;

  const batterSummary = playerData[0].Type === "Batter" ? getBatterSummary() : null;
  const pitcherSummary = playerData[0].Type === "Pitcher" ? getPitcherSummary() : null;

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
        {filteredOptions.length > 0 && (
          <ul className="player-search-suggestions">
            {filteredOptions.map((opt, i) => (
              <li
                key={i}
                className="player-search-suggestion-item"
                onClick={() => handleSelectOption(opt)}  // ← 呼叫改成 handleSelectOption
              >
                {opt.type === "player" ? opt.Name : opt.code}
             </li>
            ))}
          </ul>
       )}
      </div>

      <h1 className="player-detail-player-name">
        {playerData.length > 0 ? playerData[0].Name : "Loading..."}
      </h1>

      <div className="player-detail-year-select-wrapper">
        <label htmlFor="yearSelect" className="player-detail-year-select-label">Select Year:</label>
        <select
          id="yearSelect"
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="player-detail-year-select-dropdown"
        >
          {Array.from(new Set(playerData.map(p => p.Year)))
            .sort((a, b) => b - a)
            .map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
        </select>
      </div>

      <div className="player-detail-gauge-wrapper">
        {gaugeData.map((item, index) => (
          <div className="player-detail-gauge-item" key={index}>
            <CircularProgressbarWithChildren
              value={item.percent}
              styles={buildStyles({
                pathColor: getColorByPercent(item.percent),
                trailColor: "#d1d5db"
              })}
            >
              <div className="player-detail-gauge-percent">{item.percent}</div>
              <strong className="player-detail-gauge-label">{item.field}</strong>
            </CircularProgressbarWithChildren>
          </div>
        ))}
      </div>

      <div className="player-detail-stats-wrapper">
        {playerData[0].Type === "Batter" ? (
          <table className="player-detail-stats-table">
            <thead>
              <tr>
                <th>Year</th><th>Team</th><th>PA</th><th>AB</th><th>H</th>
                <th>2B</th><th>3B</th><th>HR</th><th>RBI</th><th>SO</th>
                <th>BB</th><th>SB</th><th>CS</th><th>AVG</th><th>OBP</th>
                <th>SLG</th><th>OPS</th><th>Chase%</th><th>Whiff%</th><th>GB</th>
                <th>FB</th><th>G/F</th><th>Sprint</th>
              </tr>
            </thead>
            <tbody>
              {playerData.map((stat, index) => (
                <tr key={index} className={stat.Team && stat.Team.includes("Team") ? "team-row" : ""}>
                  <td>{stat.Year}</td><td>{stat.Team}</td><td>{stat.PA}</td><td>{stat.AB}</td><td>{stat.H}</td>
                  <td>{stat.H2}</td><td>{stat.H3}</td><td>{stat.HR}</td><td>{stat.RBI}</td><td>{stat.SO}</td>
                  <td>{stat.BB}</td><td>{stat.SB}</td><td>{stat.CS}</td><td>{stat.AVG}</td><td>{stat.OBP}</td>
                  <td>{stat.SLG}</td><td>{stat.OPS}</td><td>{stat.Chase}</td><td>{stat.Whiff}</td><td>{stat.GB}</td>
                  <td>{stat.FB}</td><td>{stat.GF}</td><td>{stat.Sprint}</td>
                </tr>
              ))}
              <tr className="summary-row">
                <td colSpan={2}>Career</td>
                <td>{batterSummary.PA}</td><td>{batterSummary.AB}</td><td>{batterSummary.H}</td><td>{batterSummary.H2}</td><td>{batterSummary.H3}</td>
                <td>{batterSummary.HR}</td><td>{batterSummary.RBI}</td><td>{batterSummary.SO}</td><td>{batterSummary.BB}</td><td>{batterSummary.SB}</td>
                <td>{batterSummary.CS}</td><td>{batterSummary.AVG}</td><td>{batterSummary.OBP}</td><td>{batterSummary.SLG}</td><td>{batterSummary.OPS}</td>
                <td>{batterSummary.Chase}</td><td>{batterSummary.Whiff}</td><td>{batterSummary.GB}</td><td>{batterSummary.FB}</td><td>{batterSummary.GF}</td>
                <td>/</td>
              </tr>
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
                <tr key={index} className={stat.Team && stat.Team.includes("Team") ? "team-row" : ""}>
                  <td>{stat.Year}</td><td>{stat.Team}</td><td>{stat.W}</td><td>{stat.L}</td><td>{stat.ERA}</td>
                  <td>{stat.IP}</td><td>{stat.H}</td><td>{stat.R}</td><td>{stat.ER}</td><td>{stat.HR}</td>
                  <td>{stat.SO}</td><td>{stat.K9}</td><td>{stat.BB}</td><td>{stat.BB9}</td><td>{stat.WHIP}</td>
                  <td>{yearsWithTeams.has(stat.Year) && !stat.Team.includes("Teams") ? "/" : stat.Chase}</td>
                  <td>{stat.Whiff}</td><td>{stat.GB}</td><td>{stat.FB}</td><td>{stat.GF}</td>
                </tr>
              ))}
              <tr className="summary-row">
                <td colSpan={2}>Career</td>
                <td>{pitcherSummary.W}</td><td>{pitcherSummary.L}</td><td>{pitcherSummary.ERA}</td><td>{pitcherSummary.IP}</td><td>{pitcherSummary.H}</td>
                <td>{pitcherSummary.R}</td><td>{pitcherSummary.ER}</td><td>{pitcherSummary.HR}</td><td>{pitcherSummary.SO}</td><td>{pitcherSummary.K9}</td>
                <td>{pitcherSummary.BB}</td><td>{pitcherSummary.BB9}</td><td>{pitcherSummary.WHIP}</td><td>{pitcherSummary.Chase}</td><td>{pitcherSummary.Whiff}</td>
                <td>{pitcherSummary.GB}</td><td>{pitcherSummary.FB}</td><td>{pitcherSummary.GF}</td>
              </tr>
            </tbody>
          </table>
        ) : (
          <p>Unknown player type</p>
        )}
      </div>

      <button className="back-button" onClick={() => navigate(-1)}>←</button>

      <div className="player-detail-image">
        <img
          className="home-icon"
          src="/home-icon.svg"
          alt="Home"
          onClick={() => navigate("/")}
        />
      </div>
      
    </div>
    
  );
}

export default PlayerDetail;
  