import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from "react-router-dom";

const metricsByType = {
    batter: ['H', 'HR', 'RBI', 'AVG', 'OBP', 'OPS', 'SB'],
    pitcher: ['ERA', 'WHIP', 'SO', 'BB', 'K9', 'BB9', 'W', 'L']
};

function LeaderBoard() {
    const [type, setType] = useState('batter');
    const [year, setYear] = useState(2024);
    const [metric, setMetric] = useState(metricsByType.batter[0]);
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(false);
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
        setFilteredOptions([]);      // ← 這裡清空 filteredOptions
        if (opt.type === "player") {
        navigate(`/playerDetail/${opt.id}`);
        } else {
        navigate(`/team/${opt.code}`);
        }
    };

    useEffect(() => {
        fetch(`http://127.0.0.1:5000/api/leaderboard?type=${type}&year=${year}&metric=${metric}`)
            .then(res => res.json())
            .then(data => setLeaders(data))
            .catch(console.error);
    }, [type, year, metric]);

    const handleTypeChange = (e) => {
        const newType = e.target.value;
        setType(newType);
        setMetric(metricsByType[newType][0]);
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
                        onClick={() => handleSelectOption(opt)}  // ← 呼叫改成 handleSelectOption
                    >
                        {opt.type === "player" ? opt.Name : opt.code}
                    </li>
                    ))}
                </ul>
            )}
            </div>
            <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Leaderboard</h1>

            <div className="flex gap-4 mb-4">
                <select value={type} onChange={handleTypeChange} className="p-2 border rounded">
                <option value="batter">Batter</option>
                <option value="pitcher">Pitcher</option>
                </select>

                <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="p-2 border rounded">
                {Array.from({ length: 10 }, (_, i) => {
                    const y = 2024 - i;
                    return (
                    <option key={y} value={y}>{y}</option>
                    );
                })}
                </select>

                <select value={metric} onChange={(e) => setMetric(e.target.value)} className="p-2 border rounded">
                {metricsByType[type].map((m) => (
                    <option key={m} value={m}>{m}</option>
                ))}
                </select>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <table className="min-w-full border">
                <thead>
                    <tr className="bg-gray-100">
                    <th className="border px-4 py-2">Rank</th>
                    <th className="border px-4 py-2">Name</th>
                    <th className="border px-4 py-2">{metric}</th>
                    </tr>
                </thead>
                <tbody>
                    {leaders.map((player, index) => (
                    <tr key={index} className="text-center">
                        <td className="border px-4 py-2">{index + 1}</td>
                        <td className="border px-4 py-2">{player.Name}</td>
                        <td className="border px-4 py-2">{player[metric]}</td>
                    </tr>
                    ))}
                </tbody>
                </table>
            )}
            </div>
        </div>  
    );
}

export default LeaderBoard;