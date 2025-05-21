import React, { useState, useEffect } from 'react';
import {useNavigate } from "react-router-dom";

const BATTER_TABS = [
  { key: "AVG",  label: "打擊率" },
  { key: "H",    label: "安打"   },
  { key: "HR",   label: "全壘打" },
  { key: "RBI",  label: "打點"   },
  { key: "SB",   label: "盜壘"   },
];
const PITCHER_TABS = [
  { key: "ERA",  label: "ERA"   },
  { key: "W",    label: "勝投"   },
  { key: "SO",   label: "三振"   },
  { key: "WHIP", label: "WHIP"  },
  { key: "K9",   label: "K/9"   },
];

const formatStat = (key, value) => {
    if (typeof value !== "number") return value;

    const threeDecimalStats = ["AVG"];
    const twoDecimalStats = ["ERA", "WHIP", "K9"];
    const integerStats = ["HR", "RBI", "SB", "W", "SO", "H"];

    if (threeDecimalStats.includes(key)) return value.toFixed(3);
    if (twoDecimalStats.includes(key)) return value.toFixed(2);
    if (integerStats.includes(key)) return Math.round(value);

    return value;
};

function LeaderBoard() {
    const [year, setYear] = useState(2024);
    const [batTab, setBatTab] = useState(BATTER_TABS[0].key);
    const [pitTab, setPitTab] = useState(PITCHER_TABS[0].key);
    const [rawStats, setRawStats] = useState([]);
    const [batLeaders, setBatLeaders] = useState([]);
    const [pitLeaders, setPitLeaders] = useState([]);
    const navigate = useNavigate();
  
    const [players, setPlayers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredOptions, setFilteredOptions] = useState([]);

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
        setFilteredOptions([]);
        if (opt.type === "player") {
        navigate(`/playerDetail/${opt.id}`);
        } else {
        navigate(`/team/${opt.code}`);
        }
    };

    useEffect(() => {
        fetch(`http://127.0.0.1:5000/api/players_stats?year=${year}`)
        .then(r => r.json())
        .then(data => {
            // （若後端已經做過 dedupe，這裡直接存即可）
            setRawStats(data);
        })
        .catch(console.error);
    }, [year]);

    useEffect(() => {
        const batData = rawStats
        .filter(item => item.Type.toLowerCase() === 'batter')
        .sort((a, b) => (b[batTab] || 0) - (a[batTab] || 0));  // 打者全降冪
        setBatLeaders(batData.slice(0, 10));
    }, [rawStats, batTab]);

    useEffect(() => {
        const pitData = rawStats
        .filter(item => item.Type.toLowerCase() === 'pitcher')
        .sort((a, b) => {
            if (pitTab === 'W' || pitTab === 'SO') {
            // 勝投降冪
            return (b.W || 0) - (a.W || 0);
            } else {
            // 其餘欄位升冪
            return (a[pitTab] || 0) - (b[pitTab] || 0);
            }
        });
        setPitLeaders(pitData.slice(0, 10));
    }, [rawStats, pitTab]);

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
        <div className="leader-board-container">
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

            <h1 className="leader-board-title">TOP10</h1>
            <div className="leader-board-year">
                <label htmlFor="yearSelect" className="leader-board-year-select-label">Select Year:</label>
                <select
                    value={year}
                    onChange={(e) => setYear(+e.target.value)}
                    className="leader-board-year-select-dropdown">
                    <option key='2024' value='2024'>2024</option>
                    <option key='2023' value='2023'>2023</option>
                    <option key='2022' value='2022'>2022</option>
                    <option key='2021' value='2021'>2021</option>
                </select>
                <span
                    className="leader-board-more"
                    onClick={() => navigate("/LeaderBoardDetail")}
                >
                    More →
                </span>
            </div>

            <div className="leader-board-flex">
                {/* 打者排行榜 */}
                <div className="leader-board-panel">
                    <div className="leader-board-panel-header">
                        {BATTER_TABS.map(t => (
                        <button
                            key={t.key}
                            className={`leader-board-tab ${batTab === t.key ? "active" : ""}`}
                            onClick={() => setBatTab(t.key)}
                        >
                            {t.label}
                        </button>
                        ))}
                    </div>
                    <ul className="leader-board-list">
                        {batLeaders.map((p, i) => (
                        <li key={`batter-${p.Name}-${i}`} className="leader-board-item">
                            <div className={`leader-board-rank ${i===0?'first':i===1?'second':i===2?'third':''}`}>{i + 1}</div>
                            <div className="leader-board-player">
                                <span className="leader-board-name"
                                    onClick={() =>
                                        handlePlayerClick(
                                            p.Name,
                                            p.Team,
                                            year
                                        )
                                }>
                                    {p.Name}
                                </span>
                                <span
                                    className={
                                        !p.Team.includes("Teams") ? " leader-board-team-clickable-team" : "leader-board-team"
                                    }
                                    onClick={
                                        !p.Team.includes("Teams")
                                        ? () => navigate(`/team/${p.Team}`)
                                        : undefined
                                    }
                                    >
                                    （{p.Team}）
                                </span>
                            </div>
                            <div className="leader-board-value">{formatStat(batTab, p[batTab])}</div>
                        </li>
                        ))}
                    </ul>
                </div>

                {/* 投手排行榜 */}
                <div className="leader-board-panel">
                    <div className="leader-board-panel-header">
                        {PITCHER_TABS.map(t => (
                        <button
                            key={t.key}
                            className={`leader-board-tab ${pitTab === t.key ? "active" : ""}`}
                            onClick={() => setPitTab(t.key)}
                        >
                            {t.label}
                        </button>
                        ))}
                    </div>
                    <ul className="leader-board-list">
                        {pitLeaders.map((p, i) => (
                        <li key={`pitcher-${p.Name}-${i}`} className="leader-board-item">
                            <div className={`leader-board-rank ${i===0?'first':i===1?'second':i===2?'third':''}`}>{i + 1}</div>
                            <div className="leader-board-player">
                                <span className="leader-board-name"
                                    onClick={() =>
                                        handlePlayerClick(
                                            p.Name,
                                            p.Team,
                                            year
                                        )
                                }>
                                    {p.Name}
                                </span>
                                <span
                                    className={
                                        !p.Team.includes("Teams") ? " leader-board-team-clickable-team" : "leader-board-team"
                                    }
                                    onClick={
                                        !p.Team.includes("Teams")
                                        ? () => navigate(`/team/${p.Team}`)
                                        : undefined
                                    }
                                    >
                                    （{p.Team}）
                                </span>
                            </div>
                            <div className="leader-board-value">{formatStat(pitTab, p[pitTab])}</div>
                        </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default LeaderBoard;