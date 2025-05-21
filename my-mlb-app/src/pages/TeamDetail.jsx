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
    
      const scoredPlayers = players
        .map((p) => {
          const name = p.Name.toLowerCase();
          let score = 0;
          if (name.startsWith(term)) score += 2;
          else if (name.includes(term)) score += 1;
          return { ...p, score, type: 'player' };
        })
        .filter((p) => p.score > 0);
    
      const scoredTeams = teams
        .map((t) => {
          const code = t.code.toLowerCase();
          let score = 0;
          if (code.startsWith(term)) score += 2;
          else if (code.includes(term)) score += 1;
          return { ...t, score, type: 'team' };
        })
        .filter((t) => t.score > 0);
    
      const combined = [...scoredPlayers, ...scoredTeams]
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
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
      setFilteredOptions([]);
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
          const stat = teamData[m];
          const rank = teamRanks[m] || 31; 
          const pct = ((31 - rank) / 30) * 100;

          return (
            <div key={m} className="team-detail-rank-cell">
              <div className="team-detail-metric-label">{m}</div>
              <div className="team-detail-metric-value">
                {stat != null
                  ? ["ERA", "WHIP", "K9", "BB9"].includes(m)
                    ? parseFloat(stat).toFixed(2)
                    : parseFloat(stat).toFixed(3)
                  : "—"}
              </div>
              <div className="team-detail-metric-bar">
                <div
                  className="team-detail-metric-bar-fill"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: teamColor || "#888",
                  }}
                />
              </div>
              <div className="team-detail-metric-rank">
                {rank <= 30 ? getOrdinal(rank) : "—"}
              </div>
            </div>
          );
        })}
      </div>

      <div className="team-detail-stats-wrapper">
        <h2 className="team-detail-subtitle">Batters</h2>
        <div className="team-detail-section">
          <table className="team-detail-stats-table">
            <thead>
              <tr>
                <th>Player</th>
                <th
                  onClick={() => navigate(
                    `/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=PA`
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  PA
                </th>
                <th
                  onClick={() => navigate(
                    `/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=AB`
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  AB
                </th>
                <th
                  onClick={() => navigate(
                    `/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=H`
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  H
                </th>
                <th
                  onClick={() => navigate(
                    `/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=H2`
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  2B
                </th>
                <th
                  onClick={() => navigate(
                    `/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=H3`
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  3B
                </th>
                <th
                  onClick={() => navigate(
                    `/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=HR`
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  HR
                </th>
                <th
                  onClick={() => navigate(
                    `/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=RBI`
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  RBI
                </th>
                <th
                  onClick={() => navigate(
                    `/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=SO`
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  SO
                </th>
                <th
                  onClick={() => navigate(
                    `/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=BB`
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  BB
                </th>
                <th
                  onClick={() => navigate(
                    `/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=SB`
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  SB
                </th><th
                  onClick={() => navigate(
                    `/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=CS`
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  CS
                </th>
                <th
                  onClick={() => navigate(
                    `/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=AVG`
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  AVG
                </th>
                <th
                  onClick={() => navigate(
                    `/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=OBP`
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  OBP
                </th>
                <th
                  onClick={() => navigate(
                    `/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=SLG`
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  SLG
                </th>
                <th
                  onClick={() => navigate(
                    `/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=OPS`
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  OPS
                </th>
                <th
                  onClick={() => navigate(
                    `/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=Chase`
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  Chase%
                </th>
                <th
                  onClick={() => navigate(
                    `/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=Whiff`
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  Whiff%
                </th>
                <th
                  onClick={() => navigate(
                    `/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=GB`
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  GB
                </th>
                <th
                  onClick={() => navigate(
                    `/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=FB`
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  FB
                </th>
                <th
                  onClick={() => navigate(
                    `/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=GF`
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  G/F
                </th>
                <th
                  onClick={() => navigate(
                    `/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=Sprint`
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  Sprint
                </th>
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
                <td>{teamData.CS}</td>
                <td>{parseFloat(teamData.AVG).toFixed(3)}</td>
                <td>{parseFloat(teamData.OBP).toFixed(3)}</td>
                <td>{parseFloat(teamData.SLG).toFixed(3)}</td>
                <td>{parseFloat(teamData.OPS).toFixed(3)}</td>
                <td>{parseFloat(teamData.Chase).toFixed(1)}</td>
                <td>{parseFloat(teamData.Whiff).toFixed(1)}</td>
                <td>{parseFloat(teamData.GB).toFixed(1)}</td>
                <td>{parseFloat(teamData.FB).toFixed(1)}</td>
                <td>{parseFloat(teamData.GF).toFixed(2)}</td>
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
                <th>Name</th>
                <th
                  onClick={() => navigate(
                    `/LeaderBoardDetail?type=pitcher&year=${selectedYear}&sortKey=W`
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  W
                </th>
                <th
                  onClick={() => navigate(
                    `/LeaderBoardDetail?type=pitcher&year=${selectedYear}&sortKey=L`
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  L
                </th>
                <th>
                  ERA
                </th>
                <th>IP</th>
                <th
                  onClick={() => navigate(
                    `/LeaderBoardDetail?type=pitcher&year=${selectedYear}&sortKey=H`
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  H
                </th>
                <th
                  onClick={() => navigate(
                    `/LeaderBoardDetail?type=pitcher&year=${selectedYear}&sortKey=R`
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  R
                </th>
                <th
                  onClick={() => navigate(
                    `/LeaderBoardDetail?type=pitcher&year=${selectedYear}&sortKey=ER`
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  ER
                </th>
                <th
                  onClick={() => navigate(
                    `/LeaderBoardDetail?type=pitcher&year=${selectedYear}&sortKey=HR`
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  HR
                </th>
                <th
                  onClick={() => navigate(
                    `/LeaderBoardDetail?type=pitcher&year=${selectedYear}&sortKey=SO`
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  SO
                </th>
                <th
                  onClick={() => navigate(
                    `/LeaderBoardDetail?type=pitcher&year=${selectedYear}&sortKey=K9`
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  K/9
                </th>
                <th
                  onClick={() => navigate(
                    `/LeaderBoardDetail?type=pitcher&year=${selectedYear}&sortKey=BB`
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  BB
                </th>
                <th
                  onClick={() => navigate(
                    `/LeaderBoardDetail?type=pitcher&year=${selectedYear}&sortKey=BB9`
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  BB/9
                </th>
                <th
                  onClick={() => navigate(
                    `/LeaderBoardDetail?type=pitcher&year=${selectedYear}&sortKey=WHIP`
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  WHIP
                </th>
                <th
                  onClick={() => navigate(
                    `/LeaderBoardDetail?type=pitcher&year=${selectedYear}&sortKey=Chase`
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  Chase%
                </th>
                <th
                  onClick={() => navigate(
                    `/LeaderBoardDetail?type=pitcher&year=${selectedYear}&sortKey=Whiff`
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  Whiff%
                </th>
                <th
                  onClick={() => navigate(
                    `/LeaderBoardDetail?type=pitcher&year=${selectedYear}&sortKey=GB`
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  GB
                </th>
                <th
                  onClick={() => navigate(
                    `/LeaderBoardDetail?type=pitcher&year=${selectedYear}&sortKey=FB`
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  FB
                </th>
                <th
                  onClick={() => navigate(
                    `/LeaderBoardDetail?type=pitcher&year=${selectedYear}&sortKey=GF`
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  G/F
                </th>
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
                  <td>{p.SO}</td><td>{parseFloat(p.K9).toFixed(2)}</td>
                  <td>{p.BB}</td><td>{parseFloat(p.BB9).toFixed(2)}</td>
                  <td>{parseFloat(p.WHIP).toFixed(2)}</td>
                  <td>{parseFloat(p.Chase).toFixed(1)}</td>
                  <td>{parseFloat(p.Whiff).toFixed(1)}</td>
                  <td>{parseFloat(p.GB).toFixed(1)}</td>
                  <td>{parseFloat(p.FB).toFixed(1)}</td>
                  <td>{parseFloat(p.GF).toFixed(2)}</td>
                </tr>
              ))}
              <tr className="player-detail-summary-row">
                <td>Total</td>
                <td>{teamData.W}</td><td>{teamData.L}</td><td>{teamData.ERA}</td><td>{teamData.IP}</td>
                <td>{teamData.PH}</td><td>{teamData.R}</td><td>{teamData.ER}</td><td>{teamData.PHR}</td>
                <td>{teamData.PSO}</td><td>{parseFloat(teamData.K9).toFixed(2)}</td>
                <td>{teamData.PBB}</td><td>{parseFloat(teamData.BB9).toFixed(2)}</td>
                <td>{parseFloat(teamData.WHIP).toFixed(2)}</td>
                <td>{parseFloat(teamData.PChase).toFixed(1)}</td>
                <td>{parseFloat(teamData.PWhiff).toFixed(1)}</td>
                <td>{parseFloat(teamData.PGB).toFixed(1)}</td>
                <td>{parseFloat(teamData.PFB).toFixed(1)}</td>
                <td>{parseFloat(teamData.PGF).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default TeamDetail;
