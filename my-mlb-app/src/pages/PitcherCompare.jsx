import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PitchTypePieChart from '../components/PitchTypePieChart';
import PitcherHeatMap from '../components/PitcherHeatmap';

function PitcherCompare() {
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
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [playerData1, setPlayerStats1] = useState([]);
    const [playerData2, setPlayerStats2] = useState([]);
    const [pitcherPitches1, setPitcherPitches1] = useState([]);
    const [pitcherPitches2, setPitcherPitches2] = useState([]);
    const [commonYears, setCommonYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState(null);

    const displayKeys = ["Name", "W", "L", "ERA", "IP", "H", "R", "ER", "HR", "SO", "K9", "BB", "BB9", "WHIP", "Chase", "Whiff"];

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

        setFilteredPitchers1(matches);
    }, [pitcherInput1, players]);

    useEffect(() => {
        const term = pitcherInput2.trim().toLowerCase();
        if (!term) return setFilteredPitchers2([]);

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
                setIsSubmitted(true);
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

                const years1 = new Set(data1.map(p => p.Year));
                const years2 = new Set(data2.map(p => p.Year));
                const common = [...years1].filter(y => years2.has(y));
                setCommonYears(common);
                if (common.length > 0) {
                    setSelectedYear(common[0]); // 預設選第一個年份
                } else {
                    setSelectedYear(null);
                }

                const pitchRes1 = await fetch(`http://127.0.0.1:5000/api/PitcherPitches?pitcher=${confirmedPitcher1.id}`);
                const pitchData1 = await pitchRes1.json();
                setPitcherPitches1(pitchData1);

                const pitchRes2 = await fetch(`http://127.0.0.1:5000/api/PitcherPitches?pitcher=${confirmedPitcher2.id}`);
                const pitchData2 = await pitchRes2.json();
                setPitcherPitches2(pitchData2);

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
    
    const reverseScoreKeys = new Set(["ERA", "BB", "BB9", "WHIP"]); // 可以自行擴充

    const compareValue = (key, a, b) => {
        if (a == null || b == null) return 0; // 缺資料就不計分
        if (typeof a === "string") a = parseFloat(a);
        if (typeof b === "string") b = parseFloat(b);
        if (isNaN(a) || isNaN(b)) return 0;

        const isReversed = reverseScoreKeys.has(key);
        if (a === b) return 0.5;
        if (isReversed) return a < b ? 1 : 0;
        else return a > b ? 1 : 0;
    };

    return (
    <div className="compare-container">
        <h1 className="matchup-title">Pitcher vs Pitcher</h1>
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
        <div className="matchup-search-section">
            {/* Pitcher search */}
            <label className="matchup-search-label">Pitcher A:</label>
            <div className="matchup-search-box">
            <input
                type="text"
                placeholder="Search for a pitcher..."
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

            <label className="matchup-search-label">Pitcher B:</label>
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
        ) : commonYears.length === 0  && isSubmitted ? (
            <p style={{ marginTop: '200px' }}>
                No matched year between {confirmedPitcher1?.Name} and {confirmedPitcher2?.Name}.
            </p>
        ) : (
            <>
                {commonYears.length > 0 && (
                <div className="compare-year-select-section">
                    <label className="compare-year-select-label">Year: </label>
                    <select
                    className="compare-year-select-dropdown"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    >
                    {commonYears.map((year) => (
                        <option key={year} value={year}>
                        {year}
                        </option>
                    ))}
                    </select>
                </div>
                )}

                {selectedYear &&
                playerData1.length > 0 &&
                playerData2.length > 0 &&
                (() => {
                    const player1 = playerData1.find((d) => d.Year === selectedYear);
                    const player2 = playerData2.find((d) => d.Year === selectedYear);

                    const keys = displayKeys;
                    const noNameKeys = keys.filter((key) => key !== "Name");

                    let player1Score = 0;
                    let player2Score = 0;

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
                                    {noNameKeys.map((key) => (
                                        <th key={key}>{key === "Chase" ? "Chase%" : key === "Whiff" ? "Whiff%" : key}</th>
                                    ))}
                                    <th>Point</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{confirmedPitcher1?.Name}</td>
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
                                            {player1[key]}
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
                                    >{player1Score}</td>
                                </tr>
                                <tr>
                                    <td>{confirmedPitcher2?.Name}</td>
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
                                            {player2[key]}
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
                                    >{player2Score}</td>
                                </tr>
                            </tbody>
                        </table>

                        <div className="heatmap-section-wrapper">
                            <h3 className="section-title">Heatmaps</h3>
                            <div className="heatmap-section">
                                <div className="heatmap-item">
                                    <div className="heatmap-inner">
                                        <h4>{confirmedPitcher1.Name}</h4>
                                        <PitcherHeatMap player={player1} />
                                    </div>
                                </div>

                                <div className="heatmap-item">
                                    <div className="heatmap-inner">
                                        <h4>{confirmedPitcher2.Name}</h4>
                                        <PitcherHeatMap player={player2} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="pie-section-wrapper">
                            <h3 className="section-title">Pitch Type Pie Charts</h3>
                            <div className="pie-section">
                                <div className="pie-item">
                                    <div className="pie-inner">
                                        <h4>{confirmedPitcher1.Name}</h4>
                                        <PitchTypePieChart pitchData={pitcherPitches1} />
                                    </div>
                                </div>

                                <div className="pie-item">
                                    <div className="pie-inner">
                                        <h4>{confirmedPitcher2.Name}</h4>
                                        <PitchTypePieChart pitchData={pitcherPitches2} />
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

export default PitcherCompare;