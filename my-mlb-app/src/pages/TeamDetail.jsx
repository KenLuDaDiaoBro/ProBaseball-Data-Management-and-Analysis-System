import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { teamColors } from "../constants/teamColors";

const METRICS = ["AVG", "OBP", "SLG", "OPS", "ERA", "WHIP", "K9", "BB9"];
const ASC = ["ERA", "WHIP", "BB9"];

function TeamDetail() {
  const { code } = useParams();
  const navigate = useNavigate();

  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOptions, setFilteredOptions] = useState([]);

  const [yearList, setYearList] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [batters, setBatters] = useState([]);
  const [pitchers, setPitchers] = useState([]);
  const [leagueStats, setLeagueStats] = useState([]);
  const [teamRanks, setTeamRanks] = useState({});
  const teamColor = teamColors[code];

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/players")
      .then(r => r.json())
      .then(setPlayers)
      .catch(console.error);

    fetch("http://127.0.0.1:5000/api/teams")
      .then(r => r.json())
      .then(setTeams)
      .catch(console.error);
  }, []);

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
    fetch(`http://127.0.0.1:5000/api/team_stats?team=${code}`)
      .then(r => r.json())
      .then(({ batters, pitchers }) => {
        setBatters(batters);
        setPitchers(pitchers);
        const years = Array.from(new Set([...batters, ...pitchers].map(x => x.Year)))
          .sort((a,b) => b - a);
        setYearList(years);
        if (years.length) setSelectedYear(years[0]);
      })
      .catch(console.error);
  }, [code]);

  useEffect(() => {
    if (!selectedYear) return;
    fetch(`http://127.0.0.1:5000/api/league_team_stats?year=${selectedYear}`)
      .then(r => r.json())
      .then(setLeagueStats)
      .catch(console.error);
  }, [selectedYear]);

  const teamData = useMemo(() => {
    // 找到該隊全年累計數據
    return leagueStats.find(t => t.Team === code) || {};
  }, [leagueStats, code]);

  useEffect(() => {
    if (!leagueStats.length) return;
    const ranks = {};
    METRICS.forEach(m => {
      const sorted = [...leagueStats].sort((a,b) =>
        ASC.includes(m) ? a[m] - b[m] : b[m] - a[m]
      );
      const idx = sorted.findIndex(r => r.Team === code);
      if (idx !== -1) ranks[m] = idx + 1;
    });
    setTeamRanks(ranks);
  }, [leagueStats, code]);

  const filteredBatters = useMemo(
    () => batters.filter(b => b.Year === selectedYear),
    [batters, selectedYear]
  );
  const filteredPitchers = useMemo(
    () => pitchers.filter(p => p.Year === selectedYear),
    [pitchers, selectedYear]
  );

  function getOrdinal(n) {
    const s=["th","st","nd","rd"], v=n%100;
    return n + (s[(v-20)%10]||s[v]||s[0]);
  }

  const handlePlayerClick = (name, team, year) => {
    fetch(
      `http://127.0.0.1:5000/api/player_lookup?` +
      new URLSearchParams({ name, team, year})
    )
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => {
        if (data.id) {
          navigate(`/playerDetail/${data.id}`);
        } else {
          console.error("No id returned");
        }
      })
      .catch((err) => {
        console.error("Lookup error:", err);
        alert("找不到這位球員的詳細資料");
      });
  };


  return (
    <div className="team-detail-container">
      <div className="fixed-header-bg" />
      <button className="back-button" onClick={()=>navigate(-1)}>←</button>
      <div className="home-image">
        <img
          className="home-icon"
          src="/home-icon.svg"
          alt="Home"
          onClick={() => navigate("/")}
        />
      </div>

      <div className="search-box">
        <input
          type="text"
          placeholder="Search for a player or a team..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        {filteredOptions.length > 0 && (
          <ul className="search-suggestions">
            {filteredOptions.map((opt, i) => (
              <li
                key={i}
                className="search-suggestion-item"
                onClick={() => handleSelectOption(opt)}  // ← 呼叫改成 handleSelectOption
              >
                {opt.type === "player" ? opt.Name : opt.code}
             </li>
            ))}
          </ul>
       )}
      </div>

      <h1 className="team-detail-title">{code}</h1>
      <div className="team-detail-year-select-wrapper">
        <label htmlFor="yearSelect" className="team-detail-year-label">Year:</label>
        <select
          id="yearSelect"
          className="team-detail-year-dropdown"
          value={selectedYear || ''}
          onChange={e => setSelectedYear(Number(e.target.value))}
        >
          {yearList.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* ====== 排名小卡 2×4 ====== */}
      <div className="team-detail-rank-grid">
        {METRICS.map(m => {
          // 這邊用 teamData 取值，不會再直接呼叫 find
          const stat = teamData[m];
          const rank = teamRanks[m] || 31; 
          const pct = ((31 - rank) / 30) * 100;

          return (
            <div key={m} className="team-detail-rank-cell">
              <div className="metric-label">{m}</div>
              <div className="metric-value">
                {stat != null ? stat : "—"}
              </div>
              <div className="metric-bar">
                <div
                  className="metric-bar-fill"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: teamColor || "#888", // fallback 顏色
                  }}
                />
              </div>
              <div className="metric-rank">
                {rank <= 30 ? getOrdinal(rank) : "—"}
              </div>
            </div>
          );
        })}
      </div>

      {/* ====== 資料表格 ====== */}

      <div className="team-detail-stats-wrapper">
        <h2 className="team-detail-subtitle">Batters</h2>
        <div className="team-detail-section">
          <table className="team-detail-stats-table">
            <thead>
              <tr>
                <th>Player</th><th>PA</th><th>AB</th><th>H</th>
                <th>2B</th><th>3B</th><th>HR</th><th>RBI</th><th>SO</th>
                <th>BB</th><th>SB</th><th>CS</th><th>AVG</th><th>OBP</th>
                <th>SLG</th><th>OPS</th><th>Chase%</th><th>Whiff%</th><th>GB</th>
                <th>FB</th><th>G/F</th><th>Sprint</th>
              </tr>
            </thead>
            <tbody>
              {filteredBatters.map((b,i) => (
                <tr key={i}>
                  <td className="player-link-button"
                    onClick={() =>
                      handlePlayerClick(
                        b.Name,
                        code,
                        selectedYear
                      )
                    }>
                      {b.Name}
                  </td>
                  <td>{b.PA}</td><td>{b.AB}</td><td>{b.H}</td>
                  <td>{b.H2}</td><td>{b.H3}</td><td>{b.HR}</td><td>{b.RBI}</td><td>{b.SO}</td>
                  <td>{b.BB}</td><td>{b.SB}</td><td>{b.CS}</td>
                  <td>{parseFloat(b.AVG).toFixed(3)}</td>
                  <td>{parseFloat(b.OBP).toFixed(3)}</td>
                  <td>{parseFloat(b.SLG).toFixed(3)}</td>
                  <td>{parseFloat(b.OPS).toFixed(3)}</td>
                  <td>{parseFloat(b.Chase).toFixed(1)}</td>
                  <td>{parseFloat(b.Whiff).toFixed(1)}</td>
                  <td>{parseFloat(b.GB).toFixed(1)}</td>
                  <td>{parseFloat(b.FB).toFixed(1)}</td>
                  <td>{parseFloat(b.GF).toFixed(2)}</td>
                  <td>{parseFloat(b.Sprint).toFixed(1)}</td>
                </tr>
              ))}
              <tr className="player-detail-summary-row">
                <td>Total</td>
                <td>{teamData.PA}</td><td>{teamData.AB}</td><td>{teamData.H}</td><td>{teamData.H2}</td><td>{teamData.H3}</td>
                <td>{teamData.HR}</td><td>{teamData.RBI}</td><td>{teamData.SO}</td><td>{teamData.BB}</td><td>{teamData.SB}</td>
                <td>{teamData.CS}</td><td>{teamData.AVG}</td><td>{teamData.OBP}</td><td>{teamData.SLG}</td><td>{teamData.OPS}</td>
                <td>{teamData.Chase}</td><td>{teamData.Whiff}</td><td>{teamData.GB}</td><td>{teamData.FB}</td><td>{teamData.GF}</td>
                <td>/</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 className="team-detail-subtitle">Pitchers</h2>
        <div className="team-detail-section">
          <table className="team-detail-stats-table">
            <thead>
              <tr>
                <th>Name</th><th>W</th><th>L</th><th>ERA</th>
                <th>IP</th><th>H</th><th>R</th><th>ER</th><th>HR</th>
                <th>SO</th><th>K9</th><th>BB</th><th>BB9</th><th>WHIP</th>
                <th>Chase%</th><th>Whiff%</th><th>GB</th><th>FB</th><th>G/F</th>
              </tr>
            </thead>
            <tbody>
              {filteredPitchers.map((p, index) => (
                <tr key={index} className={p.Team && p.Team.includes("Team") ? "team-row" : ""}>
                  <td className="player-link-button"
                    onClick={() =>
                      handlePlayerClick(
                        p.Name,
                        code,
                        selectedYear
                      )
                    }>
                      {p.Name}
                  </td>
                  <td>{p.W}</td><td>{p.L}</td><td>{p.ERA.toFixed(2)}</td>
                  <td>{p.IP.toFixed(1)}</td><td>{p.H}</td><td>{p.R}</td><td>{p.ER}</td><td>{p.HR}</td>
                  <td>{p.SO}</td><td>{p.K9.toFixed(2)}</td><td>{p.BB}</td><td>{p.BB9.toFixed(2)}</td><td>{p.WHIP.toFixed(2)}</td>
                  <td>{isNaN(parseFloat(p.Chase)) ? "N/A" : parseFloat(p.Chase).toFixed(1)}</td>
                  <td>{isNaN(parseFloat(p.Whiff)) ? "N/A" : parseFloat(p.Whiff).toFixed(1)}</td>
                  <td>{isNaN(parseFloat(p.GB)) ? "N/A" : parseFloat(p.GB).toFixed(1)}</td>
                  <td>{isNaN(parseFloat(p.FB)) ? "N/A" : parseFloat(p.FB).toFixed(1)}</td>
                  <td>{isNaN(parseFloat(p.GF)) ? "N/A" : parseFloat(p.GF).toFixed(2)}</td>
                </tr>
              ))}
              <tr className="player-detail-summary-row">
                <td>Total</td>
                <td>{teamData.W}</td><td>{teamData.L}</td><td>{teamData.ERA}</td><td>{teamData.IP}</td>
                <td>{teamData.PH}</td><td>{teamData.R}</td><td>{teamData.ER}</td><td>{teamData.PHR}</td>
                <td>{teamData.PSO}</td><td>{teamData.K9}</td><td>{teamData.PBB}</td><td>{teamData.BB9}</td><td>{teamData.WHIP}</td>
                <td>{teamData.PChase}</td><td>{teamData.PWhiff}</td><td>{teamData.PGB}</td><td>{teamData.PFB}</td><td>{teamData.PGF}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default TeamDetail;
