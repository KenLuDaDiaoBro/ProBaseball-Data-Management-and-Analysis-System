import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";

function TeamDetail() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [yearList, setYearList] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [batters, setBatters] = useState([]);
  const [pitchers, setPitchers] = useState([]);

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

  // 過濾當年
  const filteredBatters = useMemo(() =>
    batters.filter(b => b.Year === selectedYear),
    [batters, selectedYear]
  );
  const filteredPitchers = useMemo(() =>
    pitchers.filter(p => p.Year === selectedYear),
    [pitchers, selectedYear]
  );

  // 計算 Total
  const batterTotal = useMemo(() => {
    return filteredBatters.reduce((sum, b) => ({
      PA: sum.PA + Number(b.PA),
      AB: sum.AB + Number(b.AB),
      H:  sum.H  + Number(b.H),
      RBI: sum.RBI + Number(b.RBI),
      SO:  sum.SO + Number(b.SO),
      BB:  sum.BB + Number(b.BB),
      ...sum
    }), { PA:0, AB:0, H:0, RBI:0, SO:0, BB:0 });
  }, [filteredBatters]);

  const pitcherTotal = useMemo(() => {
    return filteredPitchers.reduce((sum, p) => ({
      W: sum.W + Number(p.W),
      L: sum.L + Number(p.L),
      H: sum.H + Number(p.H),
      R: sum.R + Number(p.R),
      ER: sum.ER + Number(p.ER),
      SO: sum.SO + Number(p.SO),
      BB: sum.BB + Number(p.BB),
      ...sum
    }), { W:0, L:0, H:0, R:0, ER:0, SO:0, BB:0 });
  }, [filteredPitchers]);

  return (
    <div className="team-detail-container">
      <button className="back-button" onClick={() => navigate(-1)}>←</button>
      <h1 className="team-detail-title">{code} - {selectedYear}</h1>
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

      <div className="team-detail-stats-wrapper">
        <h2 className="team-detail-subtitle">Batters</h2>
        <table className="team-detail-stats-table">
          <thead>
            <tr>
              <th>Player</th><th>PA</th><th>AB</th><th>H</th><th>RBI</th><th>SO</th><th>BB</th>
            </tr>
          </thead>
          <tbody>
            {filteredBatters.map((b,i) => (
              <tr key={i}>
                <td>{b.Name}</td><td>{b.PA}</td><td>{b.AB}</td><td>{b.H}</td><td>{b.RBI}</td><td>{b.SO}</td><td>{b.BB}</td>
              </tr>
            ))}
            <tr className="team-detail-summary-row">
              <td>Total</td><td>{batterTotal.PA}</td><td>{batterTotal.AB}</td><td>{batterTotal.H}</td>
              <td>{batterTotal.RBI}</td><td>{batterTotal.SO}</td><td>{batterTotal.BB}</td>
            </tr>
          </tbody>
        </table>

        <h2 className="team-detail-subtitle">Pitchers</h2>
        <table className="team-detail-stats-table">
          <thead>
            <tr>
              <th>Player</th><th>W</th><th>L</th><th>H</th><th>R</th><th>ER</th><th>SO</th><th>BB</th>
            </tr>
          </thead>
          <tbody>
            {filteredPitchers.map((p,i) => (
              <tr key={i}>
                <td>{p.Name}</td><td>{p.W}</td><td>{p.L}</td><td>{p.H}</td><td>{p.R}</td><td>{p.ER}</td><td>{p.SO}</td><td>{p.BB}</td>
              </tr>
            ))}
            <tr className="team-detail-summary-row">
              <td>Total</td><td>{pitcherTotal.W}</td><td>{pitcherTotal.L}</td><td>{pitcherTotal.H}</td>
              <td>{pitcherTotal.R}</td><td>{pitcherTotal.ER}</td><td>{pitcherTotal.SO}</td><td>{pitcherTotal.BB}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TeamDetail;
