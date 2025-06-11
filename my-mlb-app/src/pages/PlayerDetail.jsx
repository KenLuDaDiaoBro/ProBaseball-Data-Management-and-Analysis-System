import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CircularProgressbarWithChildren,
  buildStyles
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import BatterHeatMap from '../components/BatterHeatmap';
import PitcherHeatMap from '../components/PitcherHeatmap';
import PitchTypePieChart from '../components/PitchTypePieChart';

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
  const [rawPitches, setRawPitches] = useState([]);
  const [pitcherPitches, setPitcherPitches] = useState([]);

  const updatedStats = [...playerData];
  const yearsWithTeams = useMemo(() => {
    return new Set(
      playerData
        .filter((stat) => stat.Team && stat.Team.includes("Teams"))
        .map((stat) => stat.Year)
    );
  }, [playerData]);

  const sortedPlayerData = useMemo(() => {
    return [...playerData].sort((a, b) => b.Year - a.Year);
  }, [playerData]);

  const filterPitchesByYear = (pitches, year) => {
    if (!pitches?.length || !year) return [];
    return pitches.filter(p => {
      const pitchYear = new Date(p.game_date).getFullYear();
      return pitchYear === year;
    });
  };

  useEffect(() => {
    const fetchPlayerStats = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/api/selected_player", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data; // 返回 API 數據
      } catch (error) {
        console.error("Error fetching player details:", error);
        return [];
      }
    };

    const fetchPitcherPitches = async (playerDataFromApi) => {
      if (!playerDataFromApi.length || playerDataFromApi[0].Type !== "Pitcher") {
        console.log("Condition not met: playerDataFromApi =", playerDataFromApi);
        setRawPitches([]);
        return;
      }

      try {
        const response = await fetch(`http://127.0.0.1:5000/api/PitcherPitches?pitcher=${id}`);
        console.log("Response status:", response.status);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setRawPitches(data);
      } catch (error) {
        console.error("Error fetching pitcher pitches:", error);
        setRawPitches([]);
      }
    };

    const fetchData = async () => {
      const playerDataFromApi = await fetchPlayerStats();
      if (Array.isArray(playerDataFromApi) && playerDataFromApi.length > 0) {
        setPlayerStats(playerDataFromApi);
        const years = playerDataFromApi.map(p => p.Year).filter(y => typeof y === 'number');
        const maxYear = Math.max(...years);
        setSelectedYear(maxYear);
      } else {
        setPlayerStats([]);
        setSelectedYear(null);
      }
      await fetchPitcherPitches(playerDataFromApi);
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    if (selectedYear && rawPitches.length) {
      const filteredPitches = filterPitchesByYear(rawPitches, selectedYear);
      setPitcherPitches(filteredPitches);
    } else {
      setPitcherPitches([]);
    }
  }, [selectedYear, rawPitches]);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/players")
      .then((response) => response.json())
      .then((data) => setPlayers(data))
      .catch((error) => console.error("Error fetching players:", error));
  }, []);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/teams")
      .then((res) => res.json())
      .then((data) => setTeams(data))
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
   setFilteredOptions([]);
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
  }, [selectedYear]);

  const currentStat = playerData.find(p => Number(p.Year) === Number(selectedYear));

  // Decide qualification
  const minThreshold = currentStat
    ? (currentStat.Type === 'Batter' ? 324 : 243) // 162 * 2 : 81 * 3
    : null;

  const actualValue = currentStat
    ? (currentStat.Type === 'Batter'
        ? Number(currentStat.PA)
        : parseIP(currentStat.IP))
    : null;

  const qualifies = ((minThreshold !== null) && (actualValue >= minThreshold));


  const getGaugeData = () => {
    if (!players.length || !playerData.length || !allPlayersData.length) return [];
  
    const current = playerData.find((p) => Number(p.Year) === Number(selectedYear));
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
      <div className="fixed-header-bg" />
      <button className="back-button" onClick={() => navigate(-1)}>←</button>

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

      <div className="player-detail-heatmap">
        {playerData[0] && (
          playerData[0].Type === "Batter" ? (
            <>
              <h2 className="player-detail-heatmap-title">Batting Average</h2>
              <BatterHeatMap player={currentStat} />
            </>
          ) : (
            <>
              <h2 className="player-detail-heatmap-title">Total Pitches</h2>
              <PitcherHeatMap player={currentStat} />
            </>
          )
        )}
      </div>

      <div className="player-detail-gauge-wrapper">
        {gaugeData.map((item, index) => (
          <div className="player-detail-gauge-item" key={index}>
            <CircularProgressbarWithChildren
              value={qualifies ? gaugeData[index].percent : 100}
              styles={buildStyles({
                pathColor: qualifies
                  ? getColorByPercent(item.percent)
                  : '#9ca3af',
                trailColor: '#d1d5db'
              })}
            >
              <div className="player-detail-gauge-percent">
                {qualifies ? gaugeData[index].percent : 'NQ'}
              </div>
              <strong className="player-detail-gauge-label">{item.field}</strong>
            </CircularProgressbarWithChildren>
          </div>
        ))}
      </div>

      <div className="player-detail-stats-wrapper">
        {playerData[0].Type === "Batter" ? (
          <div className="player-detail-table-container">
            <table className="player-detail-stats-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Team</th>
                  <th onClick={() => navigate(`/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=PA`)}>PA</th>
                  <th onClick={() => navigate(`/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=AB`)}>AB</th>
                  <th onClick={() => navigate(`/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=H`)}>H</th>
                  <th onClick={() => navigate(`/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=H2`)}>2B</th>
                  <th onClick={() => navigate(`/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=H3`)}>3B</th>
                  <th onClick={() => navigate(`/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=HR`)}>HR</th>
                  <th onClick={() => navigate(`/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=RBI`)}>RBI</th>
                  <th onClick={() => navigate(`/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=SO`)}>SO</th>
                  <th onClick={() => navigate(`/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=BB`)}>BB</th>
                  <th onClick={() => navigate(`/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=SB`)}>SB</th>
                  <th onClick={() => navigate(`/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=CS`)}>CS</th>
                  <th onClick={() => navigate(`/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=AVG`)}>AVG</th>
                  <th onClick={() => navigate(`/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=OBP`)}>OBP</th>
                  <th onClick={() => navigate(`/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=SLG`)}>SLG</th>
                  <th onClick={() => navigate(`/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=OPS`)}>OPS</th>
                  <th onClick={() => navigate(`/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=Chase`)}>Chase%</th>
                  <th onClick={() => navigate(`/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=Whiff`)}>Whiff%</th>
                  <th onClick={() => navigate(`/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=GB`)}>GB</th>
                  <th onClick={() => navigate(`/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=FB`)}>FB</th>
                  <th onClick={() => navigate(`/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=GF`)}>G/F</th>
                  <th onClick={() => navigate(`/LeaderBoardDetail?type=batter&year=${selectedYear}&sortKey=Sprint`)}>Sprint</th>
                </tr>
              </thead>
              <tbody>
                {sortedPlayerData.map((stat, index) => (
                  <tr key={index} className={stat.Team && stat.Team.includes("Team") ? "team-row" : ""}>
                    <td>{stat.Year}</td>
                    <td
                      className="player-detail-team-cell"
                      onClick={() => navigate(`/team/${stat.Team}`)}
                    >
                      {stat.Team}
                    </td>
                    <td>{stat.PA}</td><td>{stat.AB}</td><td>{stat.H}</td>
                    <td>{stat.H2}</td><td>{stat.H3}</td><td>{stat.HR}</td><td>{stat.RBI}</td><td>{stat.SO}</td>
                    <td>{stat.BB}</td><td>{stat.SB}</td><td>{stat.CS}</td><td>{stat.AVG.toFixed(3)}</td><td>{stat.OBP.toFixed(3)}</td>
                    <td>{stat.SLG.toFixed(3)}</td><td>{stat.OPS.toFixed(3)}</td>
                    <td>{isNaN(parseFloat(stat.Chase)) ? stat.Chase : parseFloat(stat.Chase).toFixed(1)}</td>
                    <td>{isNaN(parseFloat(stat.Whiff)) ? stat.Whiff : parseFloat(stat.Whiff).toFixed(1)}</td>
                    <td>{isNaN(parseFloat(stat.GB)) ? stat.GB : parseFloat(stat.GB).toFixed(1)}</td>
                    <td>{isNaN(parseFloat(stat.FB)) ? stat.FB : parseFloat(stat.FB).toFixed(1)}</td>
                    <td>{isNaN(parseFloat(stat.GF)) ? stat.GF : parseFloat(stat.GF).toFixed(2)}</td>
                    <td>{stat.Sprint.toFixed(1)}</td>
                  </tr>
                ))}
                <tr className="player-detail-summary-row">
                  <td colSpan={2}>Career</td>
                  <td>{batterSummary.PA}</td><td>{batterSummary.AB}</td><td>{batterSummary.H}</td><td>{batterSummary.H2}</td><td>{batterSummary.H3}</td>
                  <td>{batterSummary.HR}</td><td>{batterSummary.RBI}</td><td>{batterSummary.SO}</td><td>{batterSummary.BB}</td><td>{batterSummary.SB}</td>
                  <td>{batterSummary.CS}</td><td>{batterSummary.AVG}</td><td>{batterSummary.OBP}</td><td>{batterSummary.SLG}</td><td>{batterSummary.OPS}</td>
                  <td>{batterSummary.Chase}</td><td>{batterSummary.Whiff}</td><td>{batterSummary.GB}</td><td>{batterSummary.FB}</td><td>{batterSummary.GF}</td>
                  <td>/</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : playerData[0].Type === "Pitcher" ? (
          <div className="player-detail-table-container">
            <table className="player-detail-stats-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Team</th>
                  <th onClick={() => navigate(`/LeaderBoardDetail?type=pitcher&year=${selectedYear}&sortKey=W`)}>W</th>
                  <th onClick={() => navigate(`/LeaderBoardDetail?type=pitcher&year=${selectedYear}&sortKey=L`)}>L</th>
                  <th onClick={() => navigate(`/LeaderBoardDetail?type=pitcher&year=${selectedYear}&sortKey=ERA`)}>ERA</th>
                  <th onClick={() => navigate(`/LeaderBoardDetail?type=pitcher&year=${selectedYear}&sortKey=IP`)}>IP</th>
                  <th onClick={() => navigate(`/LeaderBoardDetail?type=pitcher&year=${selectedYear}&sortKey=H`)}>H</th>
                  <th onClick={() => navigate(`/LeaderBoardDetail?type=pitcher&year=${selectedYear}&sortKey=R`)}>R</th>
                  <th onClick={() => navigate(`/LeaderBoardDetail?type=pitcher&year=${selectedYear}&sortKey=ER`)}>ER</th>
                  <th onClick={() => navigate(`/LeaderBoardDetail?type=pitcher&year=${selectedYear}&sortKey=HR`)}>HR</th>
                  <th onClick={() => navigate(`/LeaderBoardDetail?type=pitcher&year=${selectedYear}&sortKey=SO`)}>SO</th>
                  <th onClick={() => navigate(`/LeaderBoardDetail?type=pitcher&year=${selectedYear}&sortKey=K9`)}>K/9</th>
                  <th onClick={() => navigate(`/LeaderBoardDetail?type=pitcher&year=${selectedYear}&sortKey=BB`)}>BB</th>
                  <th onClick={() => navigate(`/LeaderBoardDetail?type=pitcher&year=${selectedYear}&sortKey=BB9`)}>BB/9</th>
                  <th onClick={() => navigate(`/LeaderBoardDetail?type=pitcher&year=${selectedYear}&sortKey=WHIP`)}>WHIP</th>
                  <th onClick={() => navigate(`/LeaderBoardDetail?type=pitcher&year=${selectedYear}&sortKey=Chase`)}>Chase%</th>
                  <th onClick={() => navigate(`/LeaderBoardDetail?type=pitcher&year=${selectedYear}&sortKey=Whiff`)}>Whiff%</th>
                  <th onClick={() => navigate(`/LeaderBoardDetail?type=pitcher&year=${selectedYear}&sortKey=GB`)}>GB</th>
                  <th onClick={() => navigate(`/LeaderBoardDetail?type=pitcher&year=${selectedYear}&sortKey=FB`)}>FB</th>
                  <th onClick={() => navigate(`/LeaderBoardDetail?type=pitcher&year=${selectedYear}&sortKey=GF`)}>G/F</th>
                </tr>
              </thead>
              <tbody>
                {sortedPlayerData.map((stat, index) => (
                  <tr key={index} className={stat.Team && stat.Team.includes("Team") ? "team-row" : ""}>
                    <td>{stat.Year}</td>
                    <td
                      className="player-detail-team-cell"
                      onClick={() => navigate(`/team/${stat.Team}`)}
                    >
                      {stat.Team}
                    </td>
                    <td>{stat.W}</td><td>{stat.L}</td><td>{stat.ERA.toFixed(2)}</td>
                    <td>{stat.IP.toFixed(1)}</td><td>{stat.H}</td><td>{stat.R}</td><td>{stat.ER}</td><td>{stat.HR}</td>
                    <td>{stat.SO}</td><td>{stat.K9.toFixed(2)}</td><td>{stat.BB}</td><td>{stat.BB9.toFixed(2)}</td><td>{stat.WHIP.toFixed(2)}</td>
                    <td>{isNaN(parseFloat(stat.Chase)) ? stat.Chase : parseFloat(stat.Chase).toFixed(1)}</td>
                    <td>{isNaN(parseFloat(stat.Whiff)) ? stat.Whiff : parseFloat(stat.Whiff).toFixed(1)}</td>
                    <td>{isNaN(parseFloat(stat.GB)) ? stat.GB : parseFloat(stat.GB).toFixed(1)}</td>
                    <td>{isNaN(parseFloat(stat.FB)) ? stat.FB : parseFloat(stat.FB).toFixed(1)}</td>
                    <td>{isNaN(parseFloat(stat.GF)) ? stat.GF : parseFloat(stat.GF).toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="player-detail-summary-row">
                  <td colSpan={2}>Career</td>
                  <td>{pitcherSummary.W}</td><td>{pitcherSummary.L}</td><td>{pitcherSummary.ERA}</td><td>{pitcherSummary.IP}</td><td>{pitcherSummary.H}</td>
                  <td>{pitcherSummary.R}</td><td>{pitcherSummary.ER}</td><td>{pitcherSummary.HR}</td><td>{pitcherSummary.SO}</td><td>{pitcherSummary.K9}</td>
                  <td>{pitcherSummary.BB}</td><td>{pitcherSummary.BB9}</td><td>{pitcherSummary.WHIP}</td><td>{pitcherSummary.Chase}</td><td>{pitcherSummary.Whiff}</td>
                  <td>{pitcherSummary.GB}</td><td>{pitcherSummary.FB}</td><td>{pitcherSummary.GF}</td>
                </tr>
              </tbody>
            </table>
            {pitcherPitches.length > 0 ? (
              <div className="player-detail-pitch-type-chart">
                <h2 className="player-detail-heatmap-title">Pitch Type Distribution</h2>
                <PitchTypePieChart pitchData={pitcherPitches} />
              </div>
            ) : (
              <p>Loading pitch type data...</p>
            )}
          </div>
        ) : (
          <p>Unknown player type</p>
        )}
      </div>
    </div>
    
  );
}

export default PlayerDetail;
  