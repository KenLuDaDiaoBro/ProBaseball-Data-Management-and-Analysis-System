import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BatterHeatMap from '../components/BatterHeatmap';

function BatterCompare() {
    const [players, setPlayers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [pitcherInput1, setPitcherInput1] = useState("");
    const [pitcherInput2, setPitcherInput2] = useState("");
    const [selectedPitcher1, setSelectedPitcher1] = useState(null);
    const [selectedPitcher2, setSelectedPitcher2] = useState(null);
    const [isPitcherFocused1, setIsPitcherFocused1] = useState(false);
    const [isPitcherFocused2, setIsPitcherFocused2] = useState(false);
    const [filteredOptions, setFilteredOptions] = useState([]);
    const [filteredPitchers1, setFilteredPitchers1] = useState([]);
    const [filteredPitchers2, setFilteredPitchers2] = useState([]);
    const navigate = useNavigate();

    const [confirmedPitcher1, setConfirmedPitcher1] = useState(null);
    const [confirmedPitcher2, setConfirmedPitcher2] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [playerData1, setPlayerStats1] = useState([]);
    const [playerData2, setPlayerStats2] = useState([]);
    const [selectedYear1, setSelectedYear1] = useState(null);
    const [selectedYear2, setSelectedYear2] = useState(null);

    const displayKeys = ["Name", "PA", "H", "H2", "H3", "HR", "RBI", "SO", "BB", "SB", "AVG", "OBP", "SLG", "OPS", "Chase", "Whiff"];

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
        const term = pitcherInput1.trim().toLowerCase();
        if (!term) return setFilteredPitchers1([]);

        const matches = players
        .filter((p) => p.Type === "Batter")
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

        setFilteredPitchers1(matches);
    }, [pitcherInput1, players]);

    useEffect(() => {
        const term = pitcherInput2.trim().toLowerCase();
        if (!term) return setFilteredPitchers2([]);

        const matches = players
        .filter((p) => p.Type === "Batter")
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

        setFilteredPitchers2(matches);
    }, [pitcherInput2, players]);

    const handleSelectPitcher1 = (p) => {
        setPitcherInput1(p.Name);
        setSelectedPitcher1(p);
        setFilteredPitchers1([]);
        setIsPitcherFocused1(false);
    };

    const handleSelectPitcher2 = (p) => {
        setPitcherInput2(p.Name);
        setSelectedPitcher2(p);
        setFilteredPitchers2([]);
        setIsPitcherFocused2(false);
    };

    const handleSubmit = async () => {
        if (selectedPitcher1 && selectedPitcher2) {
            try {
                setIsLoading(true);
                setConfirmedPitcher1(selectedPitcher1);
                setConfirmedPitcher2(selectedPitcher2);
                const res1 = await fetch("http://127.0.0.1:5000/api/selected_player", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ id: selectedPitcher1.id }),
                });
                const data1 = await res1.json();
                setPlayerStats1(data1);
                console.log("Player 1 data:", data1);

                const res2 = await fetch("http://127.0.0.1:5000/api/selected_player", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ id: selectedPitcher2.id }),
                });
                const data2 = await res2.json();
                setPlayerStats2(data2);
                console.log("Player 2 data:", data2);

                const uniqueData1 = getUniqueData(data1);
                const uniqueData2 = getUniqueData(data2);
                setSelectedYear1(uniqueData1[0]?.Year || null);
                setSelectedYear2(uniqueData2[0]?.Year || null);

            } catch (error) {
                console.error("Error fetching matchup:", error);
                alert("取得對戰資料時發生錯誤");
            } finally {
                setIsLoading(false);
            }
        } else {
            alert("請選擇投手");
        }
    };
    
    const reverseScoreKeys = new Set(["SO", "Chase", "Whiff"]);

    const compareValue = (key, a, b) => {
        if (a == null || b == null) return 0;
        if (typeof a === "string") a = parseFloat(a);
        if (typeof b === "string") b = parseFloat(b);
        if (isNaN(a) || isNaN(b)) return 0;

        const isReversed = reverseScoreKeys.has(key);
        if (a === b) return 0.5;
        if (isReversed) return a < b ? 1 : 0;
        else return a > b ? 1 : 0;
    };

    const getUniqueData = (playerData) => {
        if (!playerData?.length) return [];

        const yearMap = new Map();

        playerData.forEach(data => {
            const year = data.Year;
            const team = data.Team;

            if (!yearMap.has(year)) {
                yearMap.set(year, data);
            }
            else if (team.includes('Teams')) {
                yearMap.set(year, data);
            }
        });

        return Array.from(yearMap.values()).sort((a, b) => b.Year - a.Year);
    };

    const uniqueData1 = getUniqueData(playerData1);
    const uniqueData2 = getUniqueData(playerData2);

    return (
    <div className="compare-container">
        <h1 className="matchup-title">Batter vs Batter</h1>
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
            <label className="matchup-search-label">Batter A:</label>
            <div className="matchup-search-box">
            <input
                type="text"
                placeholder="Search for a batter..."
                value={pitcherInput1}
                onChange={(e) => setPitcherInput1(e.target.value)}
                onFocus={() => setIsPitcherFocused1(true)}
                onBlur={() => setTimeout(() => setIsPitcherFocused1(false), 150)}
                className="search-input"
            />
            {filteredPitchers1.length > 0 && isPitcherFocused1 && (
                <ul className="matchup-search-suggestions">
                {filteredPitchers1.map((p, i) => (
                    <li
                        key={i}
                        className="matchup-search-suggestion-item"
                        onMouseDown={() => handleSelectPitcher1(p)}
                    >
                    {p.Name}
                    </li>
                ))}
                </ul>
            )}
            </div>

            <label className="matchup-search-label">Batter B:</label>
            <div className="matchup-search-box">
            <input
                type="text"
                placeholder="Search for a batter..."
                value={pitcherInput2}
                onChange={(e) => setPitcherInput2(e.target.value)}
                onFocus={() => setIsPitcherFocused2(true)}
                onBlur={() => setTimeout(() => setIsPitcherFocused2(false), 150)}
                className="search-input"
            />
            {filteredPitchers2.length > 0 && isPitcherFocused2 && (
                <ul className="matchup-search-suggestions">
                {filteredPitchers2.map((b, i) => (
                    <li
                        key={i}
                        className="matchup-search-suggestion-item"
                        onMouseDown={() => handleSelectPitcher2(b)}
                    >
                    {b.Name}
                    </li>
                ))}
                </ul>
            )}
            </div>
            <button className="matchup-submit-button" onClick={handleSubmit}>Submit</button>
        </div>

        {isLoading ? (
            <p style={{ marginTop: '200px' }}>Loading…</p>
        ) : (
            <>
                {confirmedPitcher1 && confirmedPitcher2 && (
                    <div className="compare-year-select-section">
                        <div style={{ marginRight: "20px" }}>
                        <label className="compare-year-select-label">{confirmedPitcher1.Name} Year: </label>
                        <select
                            className="compare-year-select-dropdown"
                            value={selectedYear1 || ''}
                            onChange={(e) => setSelectedYear1(parseInt(e.target.value))}
                        >
                            {uniqueData1.map((data, index) => (
                                <option key={`${data.Year}-${index}`} value={data.Year}>
                                    {data.Year}
                                </option>
                            ))}
                        </select>
                        </div>

                        <div>
                        <label className="compare-year-select-label">{confirmedPitcher2.Name} Year: </label>
                        <select
                            className="compare-year-select-dropdown"
                            value={selectedYear2 || ''}
                            onChange={(e) => setSelectedYear2(parseInt(e.target.value))}
                        >
                            {uniqueData2.map((data, index) => (
                                <option key={`${data.Year}-${index}`} value={data.Year}>
                                    {data.Year}
                                </option>
                            ))}
                        </select>
                        </div>
                    </div>
                )}

                {playerData1.length > 0 && playerData2.length > 0 && (() => {
                    const player1 = uniqueData1.find((d) => d.Year === selectedYear1);
                    const player2 = uniqueData2.find((d) => d.Year === selectedYear2);

                    const keys = displayKeys;
                    const noNameKeys = keys.filter((key) => key !== "Name" && key != "PA");

                    let player1Score = 0;
                    let player2Score = 0;

                    const formatNumber = (val, key) => {

                        const twoDecimalKeys = new Set(["AVG", "OBP", "SLG", "OPS"]);
                        const oneDecimalKeys = new Set(["Chase", "Whiff"]);

                        if (twoDecimalKeys.has(key)) return val.toFixed(3);
                        if (oneDecimalKeys.has(key)) return val.toFixed(1);

                        return val;
                    };

                    noNameKeys.forEach((key) => {
                    const result = compareValue(key, player1[key], player2[key]);
                    if (result === 1) player1Score += 1;
                    else if (result === 0) player2Score += 1;
                    else if (result === 0.5) {
                        player1Score += 0.5;
                        player2Score += 0.5;
                    }
                    });

                    return (
                    <div className="compare-table-section">
                        <table className="compare-table">
                            <thead>
                                <tr>
                                    <th>Stat</th>
                                    <th>PA</th>
                                    {noNameKeys.map((key) => (
                                        <th key={key}>{key === "H2" ? "2B" : key === "H3" ? "3B" : key === "Chase" ? "Chase%" : key === "Whiff" ? "Whiff%" : key}</th>
                                    ))}
                                    <th>Point</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{fontWeight: 'bold', backgroundColor: 'transparent'}}>{confirmedPitcher1.Name}</td>
                                    <td style={{fontWeight: 'bold', backgroundColor: 'transparent'}}>{player1.PA}</td>
                                    {noNameKeys.map((key) => (
                                        <td
                                            key={key}
                                            style={{
                                                fontWeight: 'bold',
                                                color:
                                                compareValue(key, player1[key], player2[key]) === 1
                                                    ? 'green'
                                                    : compareValue(key, player1[key], player2[key]) === 0
                                                    ? 'red'
                                                    : 'black',
                                                backgroundColor:
                                                compareValue(key, player1[key], player2[key]) === 1
                                                    ? '#e6ffe6'
                                                    : compareValue(key, player1[key], player2[key]) === 0
                                                    ? '#ffe6e6'
                                                    : 'transparent',
                                            }}
                                        >
                                            {formatNumber(player1[key], key)}
                                        </td>
                                    ))}
                                    <td
                                        style={{
                                            fontWeight: 'bold',
                                            color:
                                            player1Score > player2Score
                                                ? 'green'
                                                : player1Score < player2Score
                                                ? 'red'
                                                : 'gray',
                                            backgroundColor:
                                            player1Score > player2Score
                                                ? '#e6ffe6'
                                                : player1Score < player2Score
                                                ? '#ffe6e6'
                                                : '#f0f0f0',
                                        }}
                                    >
                                        {player1Score}
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{fontWeight: 'bold', backgroundColor: 'transparent'}}>{confirmedPitcher2.Name}</td>
                                    <td style={{fontWeight: 'bold', backgroundColor: 'transparent'}}>{player2.PA}</td>
                                    {noNameKeys.map((key) => (
                                        <td
                                            key={key}   
                                            style={{
                                                fontWeight: 'bold',
                                                color:
                                                compareValue(key, player1[key], player2[key]) === 0
                                                    ? 'green'
                                                    : compareValue(key, player1[key], player2[key]) === 1
                                                    ? 'red'
                                                    : 'black',
                                                backgroundColor:
                                                compareValue(key, player1[key], player2[key]) === 0
                                                    ? '#e6ffe6'
                                                    : compareValue(key, player1[key], player2[key]) === 1
                                                    ? '#ffe6e6'
                                                    : 'transparent',
                                            }}
                                        >
                                            {formatNumber(player2[key], key)}
                                        </td>
                                    ))}
                                    <td
                                        style={{
                                            fontWeight: 'bold',
                                            color:
                                            player1Score < player2Score
                                                ? 'green'
                                                : player1Score > player2Score
                                                ? 'red'
                                                : 'gray',
                                            backgroundColor:
                                            player1Score < player2Score
                                                ? '#e6ffe6'
                                                : player1Score > player2Score
                                                ? '#ffe6e6'
                                                : '#f0f0f0',
                                        }}
                                    >
                                        {player2Score}
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <div className="heatmap-section-wrapper">
                            <h3 className="section-title">Heatmaps</h3>
                            <div className="heatmap-section">
                                <div className="heatmap-item">
                                    <div className="heatmap-inner">
                                        <h4>{confirmedPitcher1.Name}</h4>
                                        <BatterHeatMap player={player1} />
                                    </div>
                                </div>

                                <div className="heatmap-item">
                                    <div className="heatmap-inner">
                                        <h4>{confirmedPitcher2.Name}</h4>
                                        <BatterHeatMap player={player2} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    );
                })()}
            </>
        )}

    </div>
  );
}

export default BatterCompare;