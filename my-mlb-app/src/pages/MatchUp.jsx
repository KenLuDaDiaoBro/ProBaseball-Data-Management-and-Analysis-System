import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PitchTypePieChart from '../components/PitchTypePieChart';
import PitcherHeatMap from '../components/PitcherHeatmap';

function MatchUp() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [pitcherInput, setPitcherInput] = useState("");
  const [batterInput, setBatterInput] = useState("");
  const [selectedPitcher, setSelectedPitcher] = useState(null);
  const [selectedBatter, setSelectedBatter] = useState(null);
  const [isPitcherFocused, setIsPitcherFocused] = useState(false);
  const [isBatterFocused, setIsBatterFocused] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [filteredPitchers, setFilteredPitchers] = useState([]);
  const [filteredBatters, setFilteredBatters] = useState([]);
  const navigate = useNavigate();

  const [matchupData, setMatchupData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [noDataFound, setNoDataFound] = useState(false);
  const [yearStats, setYearStats] = useState({});
  const [totalPitch, setTotalPitch] = useState({
    PZ1: 0, PZ2: 0, PZ3: 0, PZ4: 0, PZ5: 0, PZ6: 0, PZ7: 0, PZ8: 0, PZ9: 0,
    PZLU: 0, PZRU: 0, PZLD: 0, PZRD: 0
  });

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

  // Pitcher search
  useEffect(() => {
    const term = pitcherInput.trim().toLowerCase();
    if (!term) return setFilteredPitchers([]);

    const matches = players
      .filter((p) => p.Type === "Pitcher")
      .map((p) => {
        const name = p.Name.toLowerCase();
        let score = 0;
        if (name.startsWith(term)) score += 2;
        else if (name.includes(term)) score += 1;
        return { ...p, score };
      })
      .filter((p) => p.score > 0)
      .sort((a, b) => b.score - a.score || a.Name.localeCompare(b.Name))
      .slice(0, 5);

    setFilteredPitchers(matches);
  }, [pitcherInput, players]);

  // Batter search
  useEffect(() => {
    const term = batterInput.trim().toLowerCase();
    if (!term) return setFilteredBatters([]);

    const matches = players
      .filter((p) => p.Type !== "Pitcher")
      .map((p) => {
        const name = p.Name.toLowerCase();
        let score = 0;
        if (name.startsWith(term)) score += 2;
        else if (name.includes(term)) score += 1;
        return { ...p, score };
      })
      .filter((p) => p.score > 0)
      .sort((a, b) => b.score - a.score || a.Name.localeCompare(b.Name))
      .slice(0, 5);

    setFilteredBatters(matches);
  }, [batterInput, players]);
      
  const handleSelectOption = (opt) => {
    setSearchTerm("");
    setFilteredOptions([]);
    if (opt.type === "player") {
    navigate(`/playerDetail/${opt.id}`);
    } else {
    navigate(`/team/${opt.code}`);
    }
  };

  const handleSelectPitcher = (p) => {
    setPitcherInput(p.Name);
    setSelectedPitcher(p);
    setFilteredPitchers([]);
    setIsPitcherFocused(false);
  };

  const handleSelectBatter = (b) => {
    setBatterInput(b.Name);
    setSelectedBatter(b);
    setFilteredBatters([]);
    setIsBatterFocused(false);
  };

  const handleSubmit = async () => {
    if (selectedPitcher && selectedBatter) {
      try {
        setIsLoading(true);
        setNoDataFound(false);
        const response = await fetch(
          `http://127.0.0.1:5000/api/matchup?pitcher=${selectedPitcher.id}&batter=${selectedBatter.id}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch matchup data");
        }
        const data = await response.json();
        if (data.length === 0) {
          setIsLoading(false);
          setNoDataFound(true);
          setMatchupData([]);
        } else {
          setMatchupData(data);
        }
      } catch (error) {
        console.error("Error fetching matchup:", error);
        alert("取得對戰資料時發生錯誤");
      }
    } else {
      alert("請選擇一位投手與一位打者");
    }
  };

  useEffect(() => {
    if (!matchupData || matchupData.length === 0) return;

    const statsByYear = {};
    const newTotalPitch = {
      PZ1: 0, PZ2: 0, PZ3: 0, PZ4: 0, PZ5: 0, PZ6: 0, PZ7: 0, PZ8: 0, PZ9: 0,
      PZLU: 0, PZRU: 0, PZLD: 0, PZRD: 0
    };

    matchupData.forEach(row => {
      const year = new Date(row.game_date).getFullYear();
      if (year < 2021 || year > 2024) return; // Skip other years

      if (!statsByYear[year]) {
        statsByYear[year] = {
          PA: 0, AB: 0, H: 0, '2B': 0, '3B': 0, HR: 0,
          SO: 0, BB: 0, HBP: 0, TB: 0
        };
      }

      const s = statsByYear[year];
      const event = row.events?.toLowerCase() || '';

      if (event !== '') s.PA++;
      if (!['walk', 'hit_by_pitch', 'sac_fly', 'sac_bunt', 'intent_walk'].includes(event) && event !== '') s.AB++;
      if (['single', 'double', 'triple', 'home_run'].includes(event)) {
        s.H++;
        if (event === 'double') { s['2B']++; s.TB += 2; }
        else if (event === 'triple') { s['3B']++; s.TB += 3; }
        else if (event === 'home_run') { s.HR++; s.TB += 4; }
        else { s.TB += 1; }
      }
      if (event === 'strikeout') s.SO++;
      if (event === 'walk') s.BB++;
      if (event === 'hit_by_pitch') s.HBP++;

      const zone = row.zone;
      if (zone >= 1 && zone <= 9) {
        newTotalPitch[`PZ${zone}`]++;
      } else if (zone === 11) {
        newTotalPitch.PZLU++;
      } else if (zone === 12) {
        newTotalPitch.PZRU++;
      } else if (zone === 13) {
        newTotalPitch.PZLD++;
      } else if (zone === 14) {
        newTotalPitch.PZRD++;
      }
    });

    const total = Object.values(statsByYear).reduce((sum, year) => {
      for (let key in year) {
        sum[key] = (sum[key] || 0) + year[key];
      }
      return sum;
    }, {});
    console.log("Total pitch:", totalPitch);
    statsByYear['Total'] = total;
    setYearStats(statsByYear);
    setTotalPitch(newTotalPitch);
    setIsLoading(false);
  }, [matchupData]);

  return (
    <div className="matchup-container">
      <h1 className="matchup-title">Matchup Search</h1>
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
            onClick={() => handleSelectOption(opt)}
          >
            {opt.type === "player" ? opt.Name : opt.code}
          </li>
          ))}
        </ul>
      )}
      </div>
      <div className="matchup-search-section">
        {/* Pitcher search */}
        <label className="matchup-search-label">Pitcher:</label>
        <div className="matchup-search-box">
          <input
            type="text"
            placeholder="Search for a pitcher..."
            value={pitcherInput}
            onChange={(e) => setPitcherInput(e.target.value)}
            onFocus={() => setIsPitcherFocused(true)}
            onBlur={() => setTimeout(() => setIsPitcherFocused(false), 150)}
            className="search-input"
          />
          {filteredPitchers.length > 0 && isPitcherFocused && (
            <ul className="matchup-search-suggestions">
              {filteredPitchers.map((p, i) => (
                <li
                  key={i}
                  className="matchup-search-suggestion-item"
                  onMouseDown={() => handleSelectPitcher(p)}
                >
                  {p.Name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Batter search */}
        <label className="matchup-search-label">Batter:</label>
        <div className="matchup-search-box">
          <input
            type="text"
            placeholder="Search for a batter..."
            value={batterInput}
            onChange={(e) => setBatterInput(e.target.value)}
            onFocus={() => setIsBatterFocused(true)}
            onBlur={() => setTimeout(() => setIsBatterFocused(false), 150)}
            className="search-input"
          />
          {filteredBatters.length > 0 && isBatterFocused && (
            <ul className="matchup-search-suggestions">
              {filteredBatters.map((b, i) => (
                <li
                  key={i}
                  className="matchup-search-suggestion-item"
                  onMouseDown={() => handleSelectBatter(b)}
                >
                  {b.Name}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button className="matchup-submit-button" onClick={handleSubmit}>Submit</button>
      </div>
      
      <div className="matchup-table-wrapper">
        {isLoading ? (
          <p style={{ marginTop: '200px' }}>Loading…</p>
        ) : noDataFound ? (
          <p style={{ marginTop: '200px' }}>Data No found</p>
        ) : (
          matchupData.length > 0 && (
            <div className="matchup-result">
              <h3 className="matchup-result-label">Matchup Results</h3>
              <table className="matchup-table">
                <thead>
                  <tr>
                    <th>Year</th>
                    <th onClick={() => navigate(`/LeaderBoardDetail?type=batter&year=&sortKey=PA`)}>PA</th>
                    <th onClick={() => navigate(`/LeaderBoardDetail?type=batter&year=&sortKey=AB`)}>AB</th>
                    <th onClick={() => navigate(`/LeaderBoardDetail?type=batter&year=&sortKey=H`)}>H</th>
                    <th onClick={() => navigate(`/LeaderBoardDetail?type=batter&year=&sortKey=H2`)}>2B</th>
                    <th onClick={() => navigate(`/LeaderBoardDetail?type=batter&year=&sortKey=H3`)}>3B</th>
                    <th onClick={() => navigate(`/LeaderBoardDetail?type=batter&year=&sortKey=HR`)}>HR</th>
                    <th onClick={() => navigate(`/LeaderBoardDetail?type=batter&year=&sortKey=SO`)}>SO</th>
                    <th onClick={() => navigate(`/LeaderBoardDetail?type=batter&year=&sortKey=BB`)}>BB</th>
                    <th>HBP</th>
                    <th onClick={() => navigate(`/LeaderBoardDetail?type=batter&year=&sortKey=AVG`)}>AVG</th>
                    <th onClick={() => navigate(`/LeaderBoardDetail?type=batter&year=&sortKey=OBP`)}>OBP</th>
                    <th onClick={() => navigate(`/LeaderBoardDetail?type=batter&year=&sortKey=SLG`)}>SLG</th>
                    <th onClick={() => navigate(`/LeaderBoardDetail?type=batter&year=&sortKey=OPS`)}>OPS</th>
                  </tr>
                </thead>
                <tbody>
                  {['2021', '2022', '2023', '2024', 'Total'].map(year => {
                    const s = yearStats[year];
                    if (!s) return null;

                    const AVG = s.AB ? (s.H / s.AB).toFixed(3) : '-';
                    const OBP = (s.AB + s.BB + s.HBP) ? ((s.H + s.BB + s.HBP) / (s.AB + s.BB + s.HBP)).toFixed(3) : '-';
                    const SLG = s.AB ? (s.TB / s.AB).toFixed(3) : '-';
                    const OPS = (OBP !== '-' && SLG !== '-') ? (parseFloat(OBP) + parseFloat(SLG)).toFixed(3) : '-';

                    return (
                      <tr key={year}>
                        <td>{year}</td>
                        <td>{s.PA}</td><td>{s.AB}</td><td>{s.H}</td><td>{s['2B']}</td><td>{s['3B']}</td><td>{s.HR}</td>
                        <td>{s.SO}</td><td>{s.BB}</td><td>{s.HBP}</td>
                        <td>{AVG}</td><td>{OBP}</td><td>{SLG}</td><td>{OPS}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="matchup-charts-container"> {/* 新增容器 */}
                <div className="matchup-chart-wrapper">
                  <h4 className="matchup-pie-label">Pitch Type Distribution</h4>
                  <PitchTypePieChart pitchData={matchupData} />
                </div>
                <div className="matchup-chart-wrapper">
                  <h4 className="matchup-heatmap-label">Pitch Location Heatmap</h4>
                  <PitcherHeatMap player={totalPitch} />
                </div>
              </div>
            </div>
        ))}
      </div>
      
    </div>
  )
}

export default MatchUp;
