import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { teamColors } from "../constants/teamColors";

const METRICS = ["AVG", "OBP", "SLG", "OPS", "ERA", "WHIP", "K9", "BB9"];
const ASC = ["ERA", "WHIP", "BB9"];

function TeamDetail() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [yearList, setYearList] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [batters, setBatters] = useState([]);
  const [pitchers, setPitchers] = useState([]);
  const [leagueStats, setLeagueStats] = useState([]);
  const [teamRanks, setTeamRanks] = useState({});
  const teamColor = teamColors[code];

  // 拿整隊統計
  useEffect(() => {
    fetch(`http://127.0.0.1:5000/api/team_stats?team=${code}`)
      .then(res => res.json())
      .then(({ batters, pitchers }) => {
        setBatters(batters);
        setPitchers(pitchers);
        // 建立年份清單
        const years = Array.from(
          new Set([
            ...batters.map(b => b.Year),
            ...pitchers.map(p => p.Year)
          ])
        ).sort((a,b) => b - a);
        setYearList(years);
        if (years.length) setSelectedYear(years[0]);
      })
      .catch(console.error);
  }, [code]);

  useEffect(() => {
    if (!selectedYear) return;
    fetch(`http://127.0.0.1:5000/api/league_team_stats?year=${selectedYear}`)
      .then(res => res.json())
      .then(data => setLeagueStats(data))
      .catch(console.error);
  }, [selectedYear]);

  useEffect(() => {
    if (!leagueStats.length) return;
    const ranks = {};
    METRICS.forEach(metric => {
      const sorted = [...leagueStats].sort((a, b) =>
        ASC.includes(metric)
          ? a[metric] - b[metric]
          : b[metric] - a[metric]
      );
      const idx = sorted.findIndex(row => row.Team === code);
      if (idx !== -1) ranks[metric] = idx + 1;
    });
    setTeamRanks(ranks);
  }, [leagueStats, code]);

  function getOrdinal(n) {
    const s = ["th","st","nd","rd"],
          v = n % 100;
    return n + (s[(v-20)%10] || s[v] || s[0]);
  }

  // 過濾當年
  const filteredBatters = useMemo(() =>
    batters.filter(b => b.Year === selectedYear),
    [batters, selectedYear]
  );

  const filteredPitchers = useMemo(() =>
    pitchers.filter(p => p.Year === selectedYear),
    [pitchers, selectedYear]
  );

  const metrics = [
    { key: "AVG",  label: "AVG",  betterHigh: true },
    { key: "OBP",  label: "OBP",  betterHigh: true },
    { key: "SLG",  label: "SLG",  betterHigh: true },
    { key: "OPS",  label: "OPS",  betterHigh: true },
    { key: "ERA",  label: "ERA",  betterHigh: false },
    { key: "WHIP", label: "WHIP", betterHigh: false },
    { key: "K9",   label: "K9",   betterHigh: true },
    { key: "BB9",  label: "BB9",  betterHigh: false },
  ];

  const getBatterSummary = () => {
    const summary = {
      PA: 0, AB: 0, H: 0, H2: 0, H3: 0, HR: 0, RBI: 0, SO: 0,
      BB: 0, SB: 0, CS: 0, AVG: 0, OBP: 0, SLG: 0, OPS: 0,
      Chase: 0, Whiff: 0, GB: 0, FB: 0, GF: 0
    };
  
    filteredBatters.forEach(b => {
      summary.PA += Number(b.PA) || 0;
      summary.AB += Number(b.AB) || 0;
      summary.H += Number(b.H) || 0;
      summary.H2 += Number(b.H2) || 0;
      summary.H3 += Number(b.H3) || 0;
      summary.HR += Number(b.HR) || 0;
      summary.RBI += Number(b.RBI) || 0;
      summary.SO += Number(b.SO) || 0;
      summary.BB += Number(b.BB) || 0;
      summary.SB += Number(b.SB) || 0;
      summary.CS += Number(b.CS) || 0;
      summary.OBP += parseFloat(b.OBP) * Number(b.PA) || 0;
      summary.Chase += parseFloat(b.Chase) * Number(b.PA) || 0;
      summary.Whiff += parseFloat(b.Whiff) * Number(b.PA) || 0;
      summary.GB += parseFloat(b.GB) * Number(b.PA) || 0;
      summary.FB += parseFloat(b.FB) * Number(b.PA) || 0;
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
  
    filteredPitchers.forEach(stat => {
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
      summary.Chase += parseFloat(stat.Chase) * parseIP(stat.IP) || 0;
      summary.Whiff += parseFloat(stat.Whiff) * parseIP(stat.IP) || 0;
      summary.GB += parseFloat(stat.GB) * parseIP(stat.IP) || 0;
      summary.FB += parseFloat(stat.FB) * parseIP(stat.IP) || 0;
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

  const batterSummary = getBatterSummary();
  const pitcherSummary = getPitcherSummary();

  return (
    <div className="team-detail-container">
      <button className="back-button" onClick={() => navigate(-1)}>←</button>
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
        {METRICS.map((m) => {
          const rank = teamRanks[m] || 31;           // 若沒資料就放在末端
          const pct   = ((31 - rank) / 30) * 100;    // 1st -> 100%, 30th -> ~3.3%
          
          return (
            <div key={m} className="team-detail-rank-cell">
              <div className="metric-label">{m}</div>
              <div className="metric-value">{leagueStats.find(t => t.Team===code)[m].toFixed(3)}</div>
              <div className="metric-bar">
                <div
                  className="metric-bar-fill"
                  style={{
                    width: `${pct}%`, 
                    backgroundColor: teamColor,
                  }}
                />
              </div>
              <div className="metric-rank">{getOrdinal(rank)}</div>
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
                  <td>{b.Name}</td><td>{b.PA}</td><td>{b.AB}</td><td>{b.H}</td>
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
                <td>{batterSummary.PA}</td><td>{batterSummary.AB}</td><td>{batterSummary.H}</td><td>{batterSummary.H2}</td><td>{batterSummary.H3}</td>
                <td>{batterSummary.HR}</td><td>{batterSummary.RBI}</td><td>{batterSummary.SO}</td><td>{batterSummary.BB}</td><td>{batterSummary.SB}</td>
                <td>{batterSummary.CS}</td><td>{batterSummary.AVG}</td><td>{batterSummary.OBP}</td><td>{batterSummary.SLG}</td><td>{batterSummary.OPS}</td>
                <td>{batterSummary.Chase}</td><td>{batterSummary.Whiff}</td><td>{batterSummary.GB}</td><td>{batterSummary.FB}</td><td>{batterSummary.GF}</td>
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
                  <td>{p.Name}</td><td>{p.W}</td><td>{p.L}</td><td>{p.ERA.toFixed(2)}</td>
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
                <td>{pitcherSummary.W}</td><td>{pitcherSummary.L}</td><td>{pitcherSummary.ERA}</td><td>{pitcherSummary.IP}</td>
                <td>{pitcherSummary.H}</td><td>{pitcherSummary.R}</td><td>{pitcherSummary.ER}</td><td>{pitcherSummary.HR}</td>
                <td>{pitcherSummary.SO}</td><td>{pitcherSummary.K9}</td><td>{pitcherSummary.BB}</td><td>{pitcherSummary.BB9}</td><td>{pitcherSummary.WHIP}</td>
                <td>{pitcherSummary.Chase}</td><td>{pitcherSummary.Whiff}</td><td>{pitcherSummary.GB}</td><td>{pitcherSummary.FB}</td><td>{pitcherSummary.GF}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default TeamDetail;
