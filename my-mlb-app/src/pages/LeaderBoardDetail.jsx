import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const TYPE_OPTIONS = [
  { value: 'batter', label: 'Batter' },
  { value: 'pitcher', label: 'Pitcher' },
  { value: 'team', label: 'Team' },
];

const COLUMNS = {
  batter: [
    { key: 'Name',  label: 'Name'   },
    { key: 'Team',  label: 'Team'   },
    { key: 'PA',    label: 'PA'     },
    { key: 'AB',    label: 'AB'     },
    { key: 'H',     label: 'H'      },
    { key: 'H2',    label: '2B'     },
    { key: 'H3',    label: '3B'     },
    { key: 'HR',    label: 'HR'     },
    { key: 'RBI',   label: 'RBI'    },
    { key: 'SO',    label: 'SO'     },
    { key: 'BB',    label: 'BB'     },
    { key: 'SB',    label: 'SB'     },
    { key: 'CS',    label: 'CS'     },
    { key: 'AVG',   label: 'AVG'    },
    { key: 'OBP',   label: 'OBP'    },
    { key: 'SLG',   label: 'SLG'    },
    { key: 'OPS',   label: 'OPS'    },
    { key: 'Chase', label: 'Chase%' },
    { key: 'Whiff', label: 'Whiff%' },
    { key: 'GB',    label: 'GB%'    },
    { key: 'FB',    label: 'FB%'    },
    { key: 'GF',    label: 'G/F'    },
    { key: 'Sprint',label: 'Sprint' },
  ],
  pitcher: [
    { key: 'Name',  label: 'Name' },
    { key: 'Team',  label: 'Team' },
    { key: 'W',     label: 'W'    },
    { key: 'L',     label: 'L'    },
    { key: 'ERA',   label: 'ERA'  },
    { key: 'IP',    label: 'IP'   },
    { key: 'H',     label: 'H'    },
    { key: 'R',     label: 'R'    },
    { key: 'ER',    label: 'ER'   },
    { key: 'HR',    label: 'HR'   },
    { key: 'BB',    label: 'BB'   },
    { key: 'BB9',   label: 'BB/9' },
    { key: 'SO',    label: 'SO'   },
    { key: 'K9',    label: 'K/9'  },
    { key: 'WHIP',  label: 'WHIP' },
    { key: 'Chase', label: 'Chase%' },
    { key: 'Whiff', label: 'Whiff%' },
    { key: 'GB',    label: 'GB%'    },
    { key: 'FB',    label: 'FB%'    },
    { key: 'GF',    label: 'G/F'    },
  ],
  team: [
    { key: 'Team',    label: 'Team'    },
    { key: 'PA',      label: 'PA'      },
    { key: 'AB',      label: 'AB'      },
    { key: 'H',       label: 'H'       },
    { key: 'H2',      label: '2B'      },
    { key: 'H3',      label: '3B'      },
    { key: 'HR',      label: 'HR'      },
    { key: 'RBI',     label: 'RBI'     },
    { key: 'SO',      label: 'SO'      },
    { key: 'BB',      label: 'BB'      },
    { key: 'SB',      label: 'SB'      },
    { key: 'CS',      label: 'CS'      },
    { key: 'AVG',     label: 'AVG'     },
    { key: 'OPS',     label: 'OPS'     },
    { key: 'SLG',     label: 'SLG'     },
    { key: 'OBP',     label: 'OBP'     },
    { key: 'Chase',   label: 'Chase%'  },
    { key: 'Whiff',   label: 'Whiff%'  },
    { key: 'GB',      label: 'GB%'     },
    { key: 'FB',      label: 'FB%'     },
    { key: 'GF',      label: 'G/F'     },
    { key: 'W',       label: 'W'       },
    { key: 'L',       label: 'L'       },
    { key: 'ERA',     label: 'ERA'     },
    { key: 'IP',      label: 'IP'      },
    { key: 'PH',      label: 'P-H'      },
    { key: 'R',       label: 'R'       },
    { key: 'ER',      label: 'ER'      },
    { key: 'PHR',     label: 'P-HR'     },
    { key: 'PBB',     label: 'P-BB'     },
    { key: 'BB9',     label: 'BB/9'    },
    { key: 'PSO',     label: 'P-SO'     },
    { key: 'K9',      label: 'K/9'     },
    { key: 'WHIP',    label: 'WHIP'    },
    { key: 'PChase',  label: 'P-Chase%'  },
    { key: 'PWhiff',  label: 'P-Whiff%'  },
    { key: 'PGB',     label: 'P-GB%'     },
    { key: 'PFB',     label: 'P-FB%'     },
    { key: 'PGF',     label: 'P-G/F'     },
  ],
};

function LeaderBoardDetail() {
    const location = useLocation();
    const params   = new URLSearchParams(location.search);
    const initType    = params.get("type")    || "batter";
    const initYear    = parseInt(params.get("year")) || 2024;
    const initSortKey = params.get("sortKey") || (initType === "pitcher" ? "W" : "PA");

    const navigate = useNavigate();
    const [type,   setType]   = useState(initType);
    const [year,   setYear]   = useState(initYear);
    const [data,   setData]   = useState([]);
    const [loading, setLoading] = useState(false);
    const [sortKey, setSortKey] = useState(initSortKey);
    const [sortOrder,  setSortOrder]  = useState("desc");

    const [players, setPlayers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredOptions, setFilteredOptions] = useState([]);

    const [visibleCols, setVisibleCols] = useState([]);
    const [showColumnPicker, setShowColumnPicker] = useState(false);
    const [rawData, setRawData] = useState([]);

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

    // 2. 實作排序函式
    const sortArray = (arr, key, order) => {
        return [...arr].sort((a, b) => {
            const aVal = a[key];
            const bVal = b[key];
            let cmp;
            // 1) 如果兩邊都是數字，就做數值相減
            if (typeof aVal === "number" && typeof bVal === "number") {
            cmp = aVal - bVal;
            } else {
            // 2) 否則都轉成字串，用 localeCompare 做字串比較
            cmp = String(aVal).localeCompare(String(bVal));
            }
            // 3) 最後根據 order 決定回傳正負值：asc → 正比小；desc → 正比大
            return order === "asc" ? cmp : -cmp;
        });
    };

    // when year changes, fetch league stats
    useEffect(() => {
        setLoading(true);
        const endpoint =
        type === 'team'
            ? `http://127.0.0.1:5000/api/league_team_stats?year=${year}`
            : `http://127.0.0.1:5000/api/players_stats?year=${year}`;
        fetch(endpoint)
        .then(r => r.json())
        .then(json => {
            // 先做 type 篩選
            let arr = json
            if (type === "batter" || type === "pitcher") {
                arr = json.filter(item => String(item.Type).toLowerCase() === type);
            }
            setRawData(arr);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }, [type, year]);

    useEffect(() => {
        if (!rawData.length) return;
        console.log("ca");

        const columns = COLUMNS[type];
        const keys = columns.map(c => c.key);

        const priorityIgnore = new Set(['Name', 'Team', 'PA', 'W']);
        const visibleDataCols = visibleCols.filter(key => !priorityIgnore.has(key));
        const thirdColumnKey = visibleDataCols[0] || 'Name';    
        const secondColumnKey = visibleDataCols[1] || 'Name';

        const fallbackSortKeys = [];
        if (type === 'batter') {
            if (visibleCols.includes('PA')) fallbackSortKeys.push('PA');
            if (visibleCols.length > 0 ) fallbackSortKeys.push(thirdColumnKey);
            else fallbackSortKeys.push('Name');
        } else if (type === 'pitcher') {
            if (visibleCols.includes('W')) fallbackSortKeys.push('W');
            if (visibleCols.length >= 0) fallbackSortKeys.push(thirdColumnKey);
            else fallbackSortKeys.push('Name');
        } else if (type === 'team') {
            if (visibleCols.includes('PA')) fallbackSortKeys.push('PA');
            if (visibleCols.length >= 0) fallbackSortKeys.push(secondColumnKey);
            else fallbackSortKeys.push('Team');
        }
        
        const multiSort = (arr, keys, order = "desc") => {
            return [...arr].sort((a, b) => {
                for (let key of keys) {
                    const aVal = a[key];
                    const bVal = b[key];
                    let cmp = 0;
                    if (typeof aVal === "number" && typeof bVal === "number") {
                        cmp = aVal - bVal;
                    } else {
                        cmp = String(aVal).localeCompare(String(bVal));
                    }
                    if (cmp !== 0) {
                        return order === "asc" ? cmp : -cmp;
                    }
                }
                return 0;
            });
        };

        setSortKey(fallbackSortKeys[0]);
        setSortOrder("desc");
        setData(multiSort(rawData, fallbackSortKeys, "desc"));
    }, [visibleCols.join(','), rawData, type]);


    // 4. 點欄位時切換升／降、並重新排序
    const handleSort = (key) => {
    // 如果連續點同一個 key，從降 → 升；否則都設成降
        const newOrder = sortKey === key && sortOrder === "desc" ? "asc" : "desc";
        setSortKey(key);         // 記錄目前排序欄位
        setSortOrder(newOrder);  // 記錄目前排序方向
        // 再把 data 依照新的 key & order 排一次
        setData(sortArray(data, key, newOrder));
    };

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

    useEffect(() => {
        const saved = localStorage.getItem(`visibleCols_${type}`);
        if (saved) {
            const parsed = JSON.parse(saved);
            const alwaysShown = ["Name", "Team"];
            // 確保 Name/Team 永遠在欄位中
            const merged = [...new Set([...alwaysShown, ...parsed])];
            setVisibleCols(merged);
        } else {
            setVisibleCols(COLUMNS[type].map(c => c.key));
        }
    }, [type]);

    const handleColumnToggle = (key) => {
        const updated = visibleCols.includes(key)
        ? visibleCols.filter(k => k !== key)
        : [...visibleCols, key];
        setVisibleCols(updated);
        localStorage.setItem(`visibleCols_${type}`, JSON.stringify(updated));
    };

    const cols = COLUMNS[type].filter(c => visibleCols.includes(c.key));

    return (
        <div className="leaderboard-detail-container">
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
            <h1 className="leaderboard-detail-title">Leaderboard Detail</h1>

            <div className="leaderboard-detail-filters">
                <label>Type:
                    <select value={type} onChange={e => {
                        const newType = e.target.value;
                        setType(newType);
                        // 切到 pitcher 就預設 W，others 就 PA
                        const defaultKey = newType === 'pitcher' ? 'W' : 'PA';
                        setSortKey(defaultKey);
                        setSortOrder('desc');
                    }}>
                        {TYPE_OPTIONS.map(o=>(
                        <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </label>

                <label style={{ marginLeft: 16 }}>
                    Year:&nbsp;
                    <select value={year} onChange={e => setYear(+e.target.value)}>
                        {[...Array(4)].map((_, i) => {
                        const y = 2024 - i;
                        return <option key={y} value={y}>{y}</option>;
                        })}
                    </select>
                </label>
            </div>

            {/* 自定義欄位按鈕 */}
            <div className="leaderboard-detail-column-customization">
                <button onClick={() => setShowColumnPicker(!showColumnPicker)}>
                ⚙️ 顯示欄位
                </button>
                {showColumnPicker && (
                <div className="leaderboard-detail-column-picker">
                    {COLUMNS[type]
                    .filter(col => col.key !== "Name" && col.key !== "Team")
                    .map(col => (
                    <label key={col.key} style={{ display: "block" }}>
                        <input
                        type="checkbox"
                        checked={visibleCols.includes(col.key)}
                        onChange={() => handleColumnToggle(col.key)}
                        />
                        {col.label}
                    </label>
                    ))}
                </div>
                )}
            </div>

            {loading
                ? <p>Loading…</p>
                : <div className="leaderboard-detail-table-wrapper">
                    <table className="leaderboard-detail-table">
                    <thead>
                        <tr>
                            {cols.map(c => (
                            <th
                                key={c.key}
                                onClick={() => handleSort(c.key)}
                                style={{ cursor: "pointer", userSelect: "none" }}
                            >
                                {c.label}
                                {sortKey === c.key
                                ? (sortOrder === "desc" ? " 🔽" : " 🔼")
                                : ""}
                            </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row,idx)=>(
                        <tr key={idx}>
                            {cols.map(c=>{
                            let v = row[c.key];
                            if (typeof v==='number') {
                                if (['AVG','OPS','OBP','SLG'].includes(c.key))
                                v = v.toFixed(3);
                                else if (['ERA','WHIP','K9','BB9'].includes(c.key))
                                v = v.toFixed(2);
                                else if (['IP','Chase','Whiff','GB','FB','GF','Sprint'].includes(c.key))
                                v = v.toFixed(1);
                            }
                            const isPlayerCol = c.key === 'Name';
                            const isTeamCol = c.key === 'Team' && !String(row.Team).includes('Teams');
                            const onClick = isPlayerCol
                                ? () => handlePlayerClick(row.Name, row.Team, year)
                                : isTeamCol
                                    ? () => navigate(`/team/${row.Team}`)
                                    : undefined;
                            const cursor = isPlayerCol || isTeamCol
                                ? 'pointer'
                                : 'default';
                            const isClickable = isPlayerCol || isTeamCol;
                            return (
                                <td
                                    key={c.key}
                                    onClick={onClick}
                                    className={isClickable ? 'leaderboard-detail-clickable-cell' : ''}
                                    style={{
                                        whiteSpace: 'nowrap',
                                        cursor
                                    }}
                                >
                                    {v != null ? v : '—'}
                                </td>
                                );
                            })}
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
            }
        </div>
    );
}

export default LeaderBoardDetail;